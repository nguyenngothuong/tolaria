import type { MobileVaultConfig } from './mobileVaultConfig'
import type { MobileVaultFile, MobileVaultStorageDriver } from './mobileVaultStorage'

export type ExpoMobileVaultFileInfo = {
  exists: boolean
  isDirectory?: boolean
  modificationTime?: number
  size?: number
}

export type ExpoMobileVaultFileSystem = {
  deleteAsync: (uri: string, options?: { idempotent?: boolean }) => Promise<void>
  documentDirectory: string | null
  getInfoAsync: (uri: string) => Promise<ExpoMobileVaultFileInfo>
  makeDirectoryAsync: (uri: string, options: { intermediates: true }) => Promise<void>
  readAsStringAsync: (uri: string, options?: ExpoMobileVaultReadOptions) => Promise<string>
  readDirectoryAsync: (uri: string) => Promise<string[]>
  writeAsStringAsync: (uri: string, content: string, options?: ExpoMobileVaultWriteOptions) => Promise<void>
}

type VaultPathInput = {
  path: string
}

export type ExpoMobileVaultReadOptions = {
  encoding?: 'base64' | 'utf8'
}

export type ExpoMobileVaultWriteOptions = ExpoMobileVaultReadOptions

type DirectoryListingInput = {
  fileSystem: ExpoMobileVaultFileSystem
  rootUri: string
  directoryPath: string
}

type DirectoryEntryInput = DirectoryListingInput & {
  name: string
}

type VaultFileInput = {
  fileSystem: ExpoMobileVaultFileSystem
  rootUri: string
  path: string
}

type DirectoryInput = {
  fileSystem: ExpoMobileVaultFileSystem
  uri: string
}

export function createExpoMobileVaultStorage(
  fileSystem: ExpoMobileVaultFileSystem,
): MobileVaultStorageDriver {
  return {
    deleteMarkdownFile: (vault, path) => deleteMarkdownFile(fileSystem, vault, path),
    listMarkdownFiles: (vault) => listMarkdownFiles(fileSystem, vault),
    readMarkdownFile: (vault, path) => readMarkdownFile(fileSystem, vault, path),
    writeMarkdownFile: (vault, path, content) => writeMarkdownFile(fileSystem, vault, path, content),
  }
}

async function deleteMarkdownFile(
  fileSystem: ExpoMobileVaultFileSystem,
  vault: MobileVaultConfig,
  path: string,
) {
  const rootUri = vaultRootUri(fileSystem, vault)
  const safePath = normalizeVaultPath({ path })
  await fileSystem.deleteAsync(appendUri({ root: rootUri, segments: [safePath] }), { idempotent: true })
}

async function listMarkdownFiles(
  fileSystem: ExpoMobileVaultFileSystem,
  vault: MobileVaultConfig,
): Promise<MobileVaultFile[]> {
  const rootUri = await ensureVaultRoot(fileSystem, vault)
  const paths = await listMarkdownPaths({ fileSystem, rootUri, directoryPath: '' })
  const files = await Promise.all(paths.map((path) => readVaultFile({ fileSystem, rootUri, path })))

  return files.sort((left, right) => left.path.localeCompare(right.path))
}

async function readMarkdownFile(
  fileSystem: ExpoMobileVaultFileSystem,
  vault: MobileVaultConfig,
  path: string,
) {
  const rootUri = vaultRootUri(fileSystem, vault)
  const safePath = normalizeVaultPath({ path })
  const fileUri = appendUri({ root: rootUri, segments: [safePath] })
  const info = await fileSystem.getInfoAsync(fileUri)

  return info.exists && !info.isDirectory ? fileSystem.readAsStringAsync(fileUri) : null
}

async function writeMarkdownFile(
  fileSystem: ExpoMobileVaultFileSystem,
  vault: MobileVaultConfig,
  path: string,
  content: string,
) {
  const rootUri = await ensureVaultRoot(fileSystem, vault)
  const safePath = normalizeVaultPath({ path })
  await ensureParentDirectory({ fileSystem, rootUri, path: safePath })
  await fileSystem.writeAsStringAsync(appendUri({ root: rootUri, segments: [safePath] }), content)
}

async function listMarkdownPaths(input: DirectoryListingInput): Promise<string[]> {
  const directoryUri = appendUri({ root: input.rootUri, segments: [input.directoryPath] })
  const names = await input.fileSystem.readDirectoryAsync(directoryUri)
  const paths = await Promise.all(
    names.map((name) => listDirectoryEntry({ ...input, name })),
  )

  return paths.flat()
}

async function listDirectoryEntry(input: DirectoryEntryInput): Promise<string[]> {
  if (isUnsafeSegment(input.name)) {
    return []
  }

  const path = input.directoryPath ? `${input.directoryPath}/${input.name}` : input.name
  const info = await input.fileSystem.getInfoAsync(appendUri({ root: input.rootUri, segments: [path] }))
  if (!info.exists) {
    return []
  }

  if (info.isDirectory) {
    return listMarkdownPaths({ fileSystem: input.fileSystem, rootUri: input.rootUri, directoryPath: path })
  }

  return path.endsWith('.md') ? [path] : []
}

async function readVaultFile(input: VaultFileInput): Promise<MobileVaultFile> {
  return {
    path: input.path,
    content: await input.fileSystem.readAsStringAsync(
      appendUri({ root: input.rootUri, segments: [input.path] }),
    ),
  }
}

async function ensureVaultRoot(fileSystem: ExpoMobileVaultFileSystem, vault: MobileVaultConfig) {
  const rootUri = vaultRootUri(fileSystem, vault)
  await ensureDirectory({ fileSystem, uri: rootUri })

  return rootUri
}

async function ensureParentDirectory(input: VaultFileInput) {
  const parentPath = input.path.split('/').slice(0, -1).join('/')
  if (parentPath) {
    await ensureDirectory({
      fileSystem: input.fileSystem,
      uri: appendUri({ root: input.rootUri, segments: [parentPath] }),
    })
  }
}

async function ensureDirectory(input: DirectoryInput) {
  const info = await input.fileSystem.getInfoAsync(input.uri)
  if (info.exists && !info.isDirectory) {
    throw new Error(`Mobile vault path is not a directory: ${input.uri}`)
  }

  if (!info.exists) {
    await input.fileSystem.makeDirectoryAsync(input.uri, { intermediates: true })
  }
}

function vaultRootUri(fileSystem: ExpoMobileVaultFileSystem, vault: MobileVaultConfig) {
  if (!fileSystem.documentDirectory) {
    throw new Error('Expo FileSystem documentDirectory is unavailable')
  }

  return appendUri({
    root: fileSystem.documentDirectory,
    segments: ['vaults', vault.storage.directoryName || vault.id],
  })
}

function normalizeVaultPath(input: VaultPathInput) {
  const path = input.path
  const segments = path.replaceAll('\\', '/').split('/').filter(Boolean)
  if (isUnsafeVaultPath({ path, segments })) {
    throw new Error(`Unsafe mobile vault path: ${path}`)
  }

  return segments.join('/')
}

function isUnsafeVaultPath(input: VaultPathInput & { segments: string[] }) {
  return !input.path.endsWith('.md') || input.segments.length === 0 || input.segments.some(isUnsafeSegment)
}

function isUnsafeSegment(segment: string) {
  return segment === '.' || segment === '..' || segment.includes('/')
}

function appendUri(input: { root: string; segments: string[] }) {
  const base = input.root.replace(/\/+$/, '')
  const path = input.segments.filter(Boolean).join('/')

  return path ? `${base}/${path}` : base
}
