import { defaultMobileVaultMetadata, type MobileVaultMetadata } from './mobileVaultMetadata'

export type MobileVaultMetadataFileInfo = {
  exists: boolean
  isDirectory?: boolean
}

export type MobileVaultMetadataFileSystem = {
  documentDirectory: string | null
  getInfoAsync: (uri: string) => Promise<MobileVaultMetadataFileInfo>
  makeDirectoryAsync: (uri: string, options: { intermediates: true }) => Promise<void>
  readAsStringAsync: (uri: string) => Promise<string>
  writeAsStringAsync: (uri: string, content: string) => Promise<void>
}

export type MobileVaultMetadataStorage = {
  load: () => Promise<MobileVaultMetadata[]>
  save: (vaults: MobileVaultMetadata[]) => Promise<void>
}

export function createMobileVaultMetadataStorage(
  fileSystem: MobileVaultMetadataFileSystem,
): MobileVaultMetadataStorage {
  return {
    load: async () => loadMobileVaultMetadata(fileSystem),
    save: async (vaults) => saveMobileVaultMetadata({ fileSystem, vaults }),
  }
}

async function loadMobileVaultMetadata(fileSystem: MobileVaultMetadataFileSystem) {
  const fileUri = metadataFileUri(fileSystem)
  const info = await fileSystem.getInfoAsync(fileUri)
  if (!info.exists || info.isDirectory) {
    return [defaultMobileVaultMetadata]
  }

  return parseMobileVaultMetadata(await fileSystem.readAsStringAsync(fileUri))
}

async function saveMobileVaultMetadata({
  fileSystem,
  vaults,
}: {
  fileSystem: MobileVaultMetadataFileSystem
  vaults: MobileVaultMetadata[]
}) {
  const rootUri = metadataRootUri(fileSystem)
  await ensureDirectory({ fileSystem, uri: rootUri })
  await fileSystem.writeAsStringAsync(metadataFileUri(fileSystem), JSON.stringify({ vaults }))
}

function parseMobileVaultMetadata(content: string) {
  try {
    return normalizeMobileVaultMetadata(JSON.parse(content))
  } catch {
    return [defaultMobileVaultMetadata]
  }
}

function normalizeMobileVaultMetadata(value: unknown) {
  if (!isVaultMetadataRoot(value)) {
    return [defaultMobileVaultMetadata]
  }

  const vaults = value.vaults.flatMap((vault) => coerceMobileVaultMetadata(vault))
  return vaults.length > 0 ? vaults : [defaultMobileVaultMetadata]
}

function coerceMobileVaultMetadata(value: unknown): MobileVaultMetadata[] {
  if (!isValidVaultMetadataRecord(value)) {
    return []
  }

  return [{
    id: value.id.trim(),
    name: value.name.trim(),
    ...(hasText(value.remoteUrl) ? { remoteUrl: value.remoteUrl.trim() } : {}),
  }]
}

function isValidVaultMetadataRecord(
  value: unknown,
): value is { id: string; name: string; remoteUrl?: unknown } {
  return isVaultMetadataRecord(value) && hasText(value.id) && hasText(value.name)
}

async function ensureDirectory({
  fileSystem,
  uri,
}: {
  fileSystem: MobileVaultMetadataFileSystem
  uri: string
}) {
  const info = await fileSystem.getInfoAsync(uri)
  if (!info.exists) {
    await fileSystem.makeDirectoryAsync(uri, { intermediates: true })
  }
}

function metadataFileUri(fileSystem: MobileVaultMetadataFileSystem) {
  return `${metadataRootUri(fileSystem)}/vaults.json`
}

function metadataRootUri(fileSystem: MobileVaultMetadataFileSystem) {
  if (!fileSystem.documentDirectory) {
    throw new Error('Expo FileSystem documentDirectory is unavailable')
  }

  return `${fileSystem.documentDirectory.replace(/\/+$/, '')}/state`
}

function isVaultMetadataRoot(value: unknown): value is { vaults: unknown[] } {
  return typeof value === 'object'
    && value !== null
    && Array.isArray((value as { vaults?: unknown }).vaults)
}

function isVaultMetadataRecord(
  value: unknown,
): value is { id?: unknown; name?: unknown; remoteUrl?: unknown } {
  return typeof value === 'object' && value !== null
}

function hasText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}
