import { splitFrontmatter } from '@tolaria/markdown'
import type { MobileEditorDocumentInput } from './mobileEditorDocument'
import { serializeSupportedMobileEditorHtml } from './mobileEditorHtmlMarkdown'

export type MobileEditorDraft =
  | {
      noteId: string
      sourceMarkdown: string
      editorHtml: string
      persistable: true
      canonicalMarkdown: string
    }
  | {
      noteId: string
      sourceMarkdown: string
      editorHtml: string
      persistable: false
      blockedReason: 'unsupportedEditorHtml'
    }

export function createMobileEditorDraft({
  editorHtml,
  note,
}: {
  editorHtml: string
  note: MobileEditorDocumentInput
}): MobileEditorDraft {
  const markdownBody = serializeSupportedMobileEditorHtml({ editorHtml })
  if (!markdownBody) {
    return createBlockedDraft({ editorHtml, note })
  }

  return {
    noteId: note.id,
    sourceMarkdown: note.content,
    editorHtml,
    persistable: true,
    canonicalMarkdown: withFrontmatter({ markdownBody, sourceMarkdown: note.content }),
  }
}

function createBlockedDraft({
  editorHtml,
  note,
}: {
  editorHtml: string
  note: MobileEditorDocumentInput
}): MobileEditorDraft {
  return {
    noteId: note.id,
    sourceMarkdown: note.content,
    editorHtml,
    persistable: false,
    blockedReason: 'unsupportedEditorHtml',
  }
}

function withFrontmatter({
  markdownBody,
  sourceMarkdown,
}: {
  markdownBody: string
  sourceMarkdown: string
}) {
  const [frontmatter] = splitFrontmatter(sourceMarkdown)
  return frontmatter ? `${frontmatter}${markdownBody}` : markdownBody
}
