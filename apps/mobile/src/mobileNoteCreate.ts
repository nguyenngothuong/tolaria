import type { MobileVaultFile } from './mobileVaultStorage'

export function createMobileNoteFile({
  now = new Date(),
  title = 'Untitled',
}: {
  now?: Date
  title?: string
} = {}): MobileVaultFile {
  const id = `note-${now.getTime().toString(36)}`

  return {
    path: `${id}.md`,
    content: [
      '---',
      `title: ${title}`,
      'type: Note',
      `created: ${now.toISOString()}`,
      '---',
      '',
      `# ${title}`,
      '',
    ].join('\n'),
  }
}
