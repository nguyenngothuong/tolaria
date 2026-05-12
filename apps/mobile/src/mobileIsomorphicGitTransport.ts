import * as git from 'isomorphic-git'
import http from 'isomorphic-git/http/web'
import type { AuthCallback, FsClient, HttpClient, StatusRow } from 'isomorphic-git'
import type { ExpoMobileVaultFileSystem } from './mobileExpoVaultStorage'
import { createMobileExpoGitFileSystem } from './mobileExpoGitFileSystem'
import type { MobileGitCredentialStorage } from './mobileGitCredentialStorage'
import type { MobileGitRemote } from './mobileGitRemote'
import type {
  MobileGitRepositoryStatus,
  MobileGitTransport,
  MobileGitTransportRequest,
  MobileGitTransportResult,
} from './mobileGitTransport'

export type MobileIsoGitClient = {
  add: (input: { dir: string; filepath: string; fs: FsClient }) => Promise<void>
  clone: (input: { depth?: number; dir: string; fs: FsClient; http: HttpClient; onAuth: AuthCallback; singleBranch: true; url: string }) => Promise<void>
  commit: (input: {
    author: { email: string; name: string }
    dir: string
    fs: FsClient
    message: string
  }) => Promise<string>
  pull: (input: {
    author: { email: string; name: string }
    dir: string
    fastForwardOnly: true
    fs: FsClient
    http: HttpClient
    onAuth: AuthCallback
    singleBranch: true
  }) => Promise<void>
  push: (input: { dir: string; fs: FsClient; http: HttpClient; onAuth: AuthCallback }) => Promise<{ ok: boolean; error: string | null }>
  remove: (input: { dir: string; filepath: string; fs: FsClient }) => Promise<void>
  statusMatrix: (input: { dir: string; fs: FsClient }) => Promise<StatusRow[]>
}

export function createIsomorphicMobileGitTransport({
  credentialStorage,
  fileSystem,
  gitClient = defaultGitClient,
  httpClient = http,
}: {
  credentialStorage: MobileGitCredentialStorage
  fileSystem: ExpoMobileVaultFileSystem
  gitClient?: MobileIsoGitClient
  httpClient?: HttpClient
}): MobileGitTransport {
  return {
    pull: (request) => runGitOperation(() => pullOrClone({ credentialStorage, fileSystem, gitClient, httpClient, request })),
    push: (request) => runGitOperation(() => commitAndPush({ credentialStorage, fileSystem, gitClient, httpClient, request })),
    status: (request) => repositoryStatus({ fileSystem, gitClient, request }),
  }
}

async function pullOrClone({
  credentialStorage,
  fileSystem,
  gitClient,
  httpClient,
  request,
}: {
  credentialStorage: MobileGitCredentialStorage
  fileSystem: ExpoMobileVaultFileSystem
  gitClient: MobileIsoGitClient
  httpClient: HttpClient
  request: MobileGitTransportRequest
}) {
  const context = createMobileExpoGitFileSystem({ fileSystem, vault: request.vault })
  const onAuth = await authForRequest({ credentialStorage, remote: request.remote })

  if (await isGitRepository(context)) {
    await gitClient.pull({
      author: mobileGitAuthor(),
      dir: context.dir,
      fastForwardOnly: true,
      fs: context.fs,
      http: httpClient,
      onAuth,
      singleBranch: true,
    })
    return
  }

  await gitClient.clone({
    depth: 1,
    dir: context.dir,
    fs: context.fs,
    http: httpClient,
    onAuth,
    singleBranch: true,
    url: request.remote.url,
  })
}

async function commitAndPush({
  credentialStorage,
  fileSystem,
  gitClient,
  httpClient,
  request,
}: {
  credentialStorage: MobileGitCredentialStorage
  fileSystem: ExpoMobileVaultFileSystem
  gitClient: MobileIsoGitClient
  httpClient: HttpClient
  request: MobileGitTransportRequest
}) {
  const context = createMobileExpoGitFileSystem({ fileSystem, vault: request.vault })
  if (!await isGitRepository(context)) {
    throw new Error('Pull the remote vault before pushing mobile changes.')
  }

  await commitLocalChanges({ context, gitClient })
  const result = await gitClient.push({
    dir: context.dir,
    fs: context.fs,
    http: httpClient,
    onAuth: await authForRequest({ credentialStorage, remote: request.remote }),
  })
  if (!result.ok) {
    throw new Error(result.error ?? 'Git push failed.')
  }
}

async function repositoryStatus({
  fileSystem,
  gitClient,
  request,
}: {
  fileSystem: ExpoMobileVaultFileSystem
  gitClient: MobileIsoGitClient
  request: MobileGitTransportRequest
}): Promise<MobileGitRepositoryStatus> {
  try {
    const context = createMobileExpoGitFileSystem({ fileSystem, vault: request.vault })
    if (!await isGitRepository(context)) {
      return { hasLocalChanges: false, isRepository: false, state: 'available' }
    }

    return {
      hasLocalChanges: hasChangedRows(await gitClient.statusMatrix({ dir: context.dir, fs: context.fs })),
      isRepository: true,
      state: 'available',
    }
  } catch {
    return { message: 'Could not inspect mobile Git repository state.', state: 'failed' }
  }
}

async function commitLocalChanges({
  context,
  gitClient,
}: {
  context: MobileExpoGitContext
  gitClient: MobileIsoGitClient
}) {
  const matrix = await gitClient.statusMatrix({ dir: context.dir, fs: context.fs })
  const changedRows = matrix.filter(isChangedRow)
  await Promise.all(changedRows.map((row) => stageStatusRow({ context, gitClient, row })))

  if (changedRows.length > 0) {
    await gitClient.commit({
      author: mobileGitAuthor(),
      dir: context.dir,
      fs: context.fs,
      message: `Mobile sync ${new Date().toISOString()}`,
    })
  }
}

async function stageStatusRow({
  context,
  gitClient,
  row,
}: {
  context: MobileExpoGitContext
  gitClient: MobileIsoGitClient
  row: StatusRow
}) {
  const filepath = row[0]
  if (row[2] === 0) {
    await gitClient.remove({ dir: context.dir, filepath, fs: context.fs })
    return
  }

  await gitClient.add({ dir: context.dir, filepath, fs: context.fs })
}

async function authForRequest({
  credentialStorage,
  remote,
}: {
  credentialStorage: MobileGitCredentialStorage
  remote: MobileGitRemote
}): Promise<AuthCallback> {
  if (remote.authStrategy !== 'githubOAuth') {
    throw new Error('Mobile Git sync currently supports GitHub OAuth remotes only.')
  }

  const record = await credentialStorage.loadRecord({ host: remote.host, strategy: remote.authStrategy })
  if (!record?.secret?.accessToken) {
    throw new Error('GitHub credentials are missing. Connect GitHub before syncing.')
  }

  return () => ({ username: record.secret?.accessToken })
}

async function isGitRepository(context: MobileExpoGitContext) {
  try {
    await context.fs.promises.stat(`${context.dir}/.git`)
    return true
  } catch {
    return false
  }
}

async function runGitOperation(operation: () => Promise<void>): Promise<MobileGitTransportResult> {
  try {
    await operation()
    return { state: 'completed' }
  } catch (error) {
    return { message: gitFailureMessage(error), state: 'failed' }
  }
}

function hasChangedRows(rows: StatusRow[]) {
  return rows.some(isChangedRow)
}

function isChangedRow(row: StatusRow) {
  return row[1] !== row[2] || row[2] !== row[3]
}

function mobileGitAuthor() {
  return {
    email: 'mobile@tolaria.local',
    name: 'Tolaria Mobile',
  }
}

function gitFailureMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Mobile Git sync failed.'
}

type MobileExpoGitContext = ReturnType<typeof createMobileExpoGitFileSystem>

const defaultGitClient: MobileIsoGitClient = {
  add: git.add,
  clone: git.clone,
  commit: git.commit,
  pull: git.pull,
  push: git.push,
  remove: git.remove,
  statusMatrix: git.statusMatrix,
}
