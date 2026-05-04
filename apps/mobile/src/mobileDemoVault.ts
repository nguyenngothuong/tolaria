import { demoNoteSources } from './demoData'
import type { MobileEditorDraft } from './mobileEditorDraft'
import { saveMobileEditorDraft } from './mobileEditorDraftSave'
import { createMobileNoteFile } from './mobileNoteCreate'
import {
  createMobileVaultConfigFromMetadata,
  defaultMobileVaultMetadata,
} from './mobileVaultMetadata'
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

export async function createDemoVaultNote({ title }: { title?: string } = {}) {
  const storage = createNativeMobileVaultStorage()
  const file = createMobileNoteFile({ title })
  await storage.writeMarkdownFile(demoVault, file.path, file.content)

  return createStoredMobileVaultRepository({ storage, vault: demoVault }).readNote(file.path.replace(/\.md$/, ''))
}

export async function deleteDemoVaultNote(noteId: string) {
  const storage = createNativeMobileVaultStorage()
  await createStoredMobileVaultRepository({ storage, vault: demoVault }).deleteNote(noteId)
}

function demoVaultFiles(): MobileVaultFile[] {
  return demoNoteSources.map((source) => ({
    path: source.filename,
    content: source.content,
  }))
}

function createDemoVaultConfig() {
  return createMobileVaultConfigFromMetadata(defaultMobileVaultMetadata)
}
