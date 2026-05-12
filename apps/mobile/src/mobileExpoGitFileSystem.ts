import { Buffer } from 'buffer'
import { createMobileVaultConfigFromMetadata } from './mobileVaultMetadata'
import type { MobileVaultMetadata } from './mobileVaultMetadata'
import type { ExpoMobileVaultFileInfo, ExpoMobileVaultFileSystem } from './mobileExpoVaultStorage'
import type { PromiseFsClient } from 'isomorphic-git'

type MobileGitStat = {
  ctime: Date
  ctimeMs: number
  dev: number
  gid: number
  ino: number
  isDirectory: () => boolean
  isFile: () => boolean
  isSymbolicLink: () => boolean
  mode: number
  mtime: Date
  mtimeMs: number
  size: number
  uid: number
}

type MobileGitReadOptions = 'utf8' | { encoding?: 'base64' | 'utf8' }
type MobileGitWriteOptions = { encoding?: 'base64' | 'utf8' }
type MobileGitFileData = string | Uint8Array
type ExistingPathInput = {
  fileSystem: ExpoMobileVaultFileSystem
  path: string
  rootUri: string
}

export type MobileExpoGitFileSystemContext = {
  dir: string
  fs: PromiseFsClient
}

export function createMobileExpoGitFileSystem({
  fileSystem,
  vault,
}: {
  fileSystem: ExpoMobileVaultFileSystem
  vault: MobileVaultMetadata
}): MobileExpoGitFileSystemContext {
  const rootUri = mobileExpoGitVaultRootUri({ fileSystem, vault })
  const dir = '/vault'

  return {
    dir,
    fs: {
      promises: {
        chmod: async () => {},
        lstat: (path: string) => statPath({ fileSystem, path, rootUri }),
        mkdir: (path: string) => mkdirPath({ fileSystem, path, rootUri }),
        readFile: (path: string, options?: MobileGitReadOptions) => readFile({ fileSystem, options, path, rootUri }),
        readlink: async () => {
          throw createFileSystemError('ENOTSUP', 'Symbolic links are not supported in mobile vaults.')
        },
        readdir: (path: string) => readDirectory({ fileSystem, path, rootUri }),
        rmdir: (path: string) => removeDirectory({ fileSystem, path, rootUri }),
        stat: (path: string) => statPath({ fileSystem, path, rootUri }),
        symlink: async () => {
          throw createFileSystemError('ENOTSUP', 'Symbolic links are not supported in mobile vaults.')
        },
        unlink: (path: string) => unlinkPath({ fileSystem, path, rootUri }),
        writeFile: (path: string, data: MobileGitFileData, options?: MobileGitWriteOptions) =>
          writeFile({ data, fileSystem, options, path, rootUri }),
      },
    },
  }
}

export function mobileExpoGitVaultRootUri({
  fileSystem,
  vault,
}: {
  fileSystem: ExpoMobileVaultFileSystem
  vault: MobileVaultMetadata
}) {
  if (!fileSystem.documentDirectory) {
    throw new Error('Expo FileSystem documentDirectory is unavailable')
  }

  const vaultConfig = createMobileVaultConfigFromMetadata(vault)
  return appendUri({
    root: fileSystem.documentDirectory,
    segments: ['vaults', vaultConfig.storage.directoryName || vaultConfig.id],
  })
}

async function mkdirPath({
  fileSystem,
  path,
  rootUri,
}: {
  fileSystem: ExpoMobileVaultFileSystem
  path: string
  rootUri: string
}) {
  const uri = uriForPath({ path, rootUri })
  const info = await fileSystem.getInfoAsync(uri)
  if (info.exists && !info.isDirectory) {
    throw createFileSystemError('ENOTDIR', `Path is not a directory: ${path}`)
  }

  if (!info.exists) {
    await fileSystem.makeDirectoryAsync(uri, { intermediates: true })
  }
}

async function readDirectory({
  fileSystem,
  path,
  rootUri,
}: ExistingPathInput) {
  await existingDirectory({ fileSystem, path, rootUri })

  return fileSystem.readDirectoryAsync(uriForPath({ path, rootUri }))
}

async function readFile({
  fileSystem,
  options,
  path,
  rootUri,
}: {
  fileSystem: ExpoMobileVaultFileSystem
  options?: MobileGitReadOptions
  path: string
  rootUri: string
}) {
  const info = await existingInfo({ fileSystem, path, rootUri })
  if (info.isDirectory) {
    throw createFileSystemError('EISDIR', `Path is a directory: ${path}`)
  }

  const uri = uriForPath({ path, rootUri })
  return readAsUtf8(options)
    ? fileSystem.readAsStringAsync(uri, { encoding: 'utf8' })
    : Buffer.from(await fileSystem.readAsStringAsync(uri, { encoding: 'base64' }), 'base64')
}

async function writeFile({
  data,
  fileSystem,
  options,
  path,
  rootUri,
}: {
  data: MobileGitFileData
  fileSystem: ExpoMobileVaultFileSystem
  options?: MobileGitWriteOptions
  path: string
  rootUri: string
}) {
  await ensureParentDirectory({ fileSystem, path, rootUri })

  if (typeof data === 'string' && writeAsUtf8(options)) {
    await fileSystem.writeAsStringAsync(uriForPath({ path, rootUri }), data, { encoding: 'utf8' })
    return
  }

  await fileSystem.writeAsStringAsync(
    uriForPath({ path, rootUri }),
    dataToBase64(data),
    { encoding: 'base64' },
  )
}

async function unlinkPath({
  fileSystem,
  path,
  rootUri,
}: ExistingPathInput) {
  await existingFile({ fileSystem, path, rootUri })

  await fileSystem.deleteAsync(uriForPath({ path, rootUri }))
}

async function removeDirectory({
  fileSystem,
  path,
  rootUri,
}: ExistingPathInput) {
  await existingDirectory({ fileSystem, path, rootUri })

  await fileSystem.deleteAsync(uriForPath({ path, rootUri }))
}

async function statPath({
  fileSystem,
  path,
  rootUri,
}: {
  fileSystem: ExpoMobileVaultFileSystem
  path: string
  rootUri: string
}): Promise<MobileGitStat> {
  return statForInfo(await existingInfo({ fileSystem, path, rootUri }))
}

async function existingInfo({
  fileSystem,
  path,
  rootUri,
}: ExistingPathInput) {
  const info = await fileSystem.getInfoAsync(uriForPath({ path, rootUri }))
  if (!info.exists) {
    throw createFileSystemError('ENOENT', `Path does not exist: ${path}`)
  }

  return info
}

async function existingDirectory(input: ExistingPathInput) {
  const info = await existingInfo(input)
  if (!info.isDirectory) {
    throw createFileSystemError('ENOTDIR', `Path is not a directory: ${input.path}`)
  }
}

async function existingFile(input: ExistingPathInput) {
  const info = await existingInfo(input)
  if (info.isDirectory) {
    throw createFileSystemError('EISDIR', `Path is a directory: ${input.path}`)
  }
}

function statForInfo(info: ExpoMobileVaultFileInfo): MobileGitStat {
  const modifiedMs = Math.round((info.modificationTime ?? 0) * 1000)
  const modified = new Date(modifiedMs)
  const isDirectory = info.isDirectory === true

  return {
    ctime: modified,
    ctimeMs: modifiedMs,
    dev: 0,
    gid: 0,
    ino: 0,
    isDirectory: () => isDirectory,
    isFile: () => !isDirectory,
    isSymbolicLink: () => false,
    mode: isDirectory ? 0o040000 : 0o100644,
    mtime: modified,
    mtimeMs: modifiedMs,
    size: info.size ?? 0,
    uid: 0,
  }
}

async function ensureParentDirectory({
  fileSystem,
  path,
  rootUri,
}: {
  fileSystem: ExpoMobileVaultFileSystem
  path: string
  rootUri: string
}) {
  const segments = normalizedSegments(path)
  const parentSegments = segments.slice(0, -1)
  if (parentSegments.length === 0) {
    return
  }

  await fileSystem.makeDirectoryAsync(appendUri({ root: rootUri, segments: parentSegments }), { intermediates: true })
}

function uriForPath({ path, rootUri }: { path: string; rootUri: string }) {
  return appendUri({ root: rootUri, segments: normalizedSegments(path) })
}

function normalizedSegments(path: string) {
  const pathWithoutRoot = path.replace(/^\/+vault\/?/, '')
  const segments = pathWithoutRoot.replaceAll('\\', '/').split('/').filter(Boolean)
  if (segments.some(isUnsafeSegment)) {
    throw createFileSystemError('EINVAL', `Unsafe mobile Git path: ${path}`)
  }

  return segments
}

function isUnsafeSegment(segment: string) {
  return segment === '.' || segment === '..' || segment.includes('/')
}

function readAsUtf8(options?: MobileGitReadOptions) {
  return options === 'utf8' || (typeof options === 'object' && options.encoding === 'utf8')
}

function writeAsUtf8(options?: MobileGitWriteOptions) {
  return options?.encoding === 'utf8'
}

function dataToBase64(data: MobileGitFileData) {
  return typeof data === 'string'
    ? Buffer.from(data, 'utf8').toString('base64')
    : Buffer.from(data).toString('base64')
}

function appendUri(input: { root: string; segments: string[] }) {
  const base = input.root.replace(/\/+$/, '')
  const path = input.segments.filter(Boolean).join('/')

  return path ? `${base}/${path}` : base
}

function createFileSystemError(code: string, message: string) {
  const error = new Error(message)
  return Object.assign(error, { code })
}
