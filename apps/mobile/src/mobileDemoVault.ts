import { demoNoteSources } from './demoData'
import type { MobileEditorDraft } from './mobileEditorDraft'
import { saveMobileEditorDraft } from './mobileEditorDraftSave'
import { createMobileNoteFile } from './mobileNoteCreate'
import { createMobileVaultConfig } from './mobileVaultConfig'
import { createNativeMobileVaultStorage } from './mobileNativeVaultStorage'
import { createStoredMobileVaultRepository } from './mobileVaultRepository'
import { seedMobileVaultIfEmpty } from './mobileVaultSeed'
import type { MobileVaultFile } from './mobileVaultStorage'

const demoVault = createDemoVaultConfig()

export async function loadDemoVaultNotes() {
  const storage = createNativeMobileVaultStorage()
  await seedMobileVaultIfEmpty({ files: demoVaultFiles(), storage, vault: demoVault })

  return createStoredMobileVaultRepository({ storage, vault: demoVault }).listNotes()
}

export function saveDemoVaultDraft(draft: MobileEditorDraft) {
  return saveMobileEditorDraft({
    draft,
    storage: createNativeMobileVaultStorage(),
    vault: demoVault,
  })
}

export async function createDemoVaultNote() {
  const storage = createNativeMobileVaultStorage()
  const file = createMobileNoteFile()
  await storage.writeMarkdownFile(demoVault, file.path, file.content)

  return createStoredMobileVaultRepository({ storage, vault: demoVault }).readNote(file.path.replace(/\.md$/, ''))
}

function demoVaultFiles(): MobileVaultFile[] {
  return demoNoteSources.map((source) => ({
    path: source.filename,
    content: source.content,
  }))
}

function createDemoVaultConfig() {
  const result = createMobileVaultConfig({ id: 'personal', name: 'Personal Journal' })
  if (!result.ok) {
    throw new Error(result.error)
  }

  return result.config
}
