import { describe, expect, it } from 'vitest'
import { createMobileEditorDraft } from './mobileEditorDraft'

describe('mobile editor draft', () => {
  it('serializes supported TenTap HTML into canonical Markdown', () => {
    expect(
      createMobileEditorDraft({
        note: {
          id: 'workflow',
          title: 'Workflow',
          content: '# Workflow\n\nOriginal markdown',
        },
        editorHtml: '<h1>Workflow</h1><p>Edited content</p><ul><li>First</li><li>Second</li></ul>',
      }),
    ).toEqual({
      noteId: 'workflow',
      sourceMarkdown: '# Workflow\n\nOriginal markdown',
      editorHtml: '<h1>Workflow</h1><p>Edited content</p><ul><li>First</li><li>Second</li></ul>',
      persistable: true,
      canonicalMarkdown: '# Workflow\n\nEdited content\n\n- First\n- Second',
    })
  })

  it('preserves source frontmatter outside the edited body', () => {
    const draft = createMobileEditorDraft({
      note: {
        id: 'workflow',
        title: 'Workflow',
        content: '---\ntype: Essay\n---\n\n# Workflow\n\nOriginal markdown',
      },
      editorHtml: '<h1>Workflow</h1><p>Edited content</p>',
    })

    expect(draft).toMatchObject({
      persistable: true,
      canonicalMarkdown: '---\ntype: Essay\n---\n# Workflow\n\nEdited content',
    })
  })

  it('decodes escaped text before writing Markdown', () => {
    const draft = createMobileEditorDraft({
      note: {
        id: 'symbols',
        title: 'Symbols',
        content: '# Symbols',
      },
      editorHtml: '<h1>Symbols</h1><p>Use &lt;tags&gt; &amp; &quot;quotes&quot;</p>',
    })

    expect(draft).toMatchObject({
      persistable: true,
      canonicalMarkdown: '# Symbols\n\nUse <tags> & "quotes"',
    })
  })

  it('serializes headings, ordered lists, and inline marks', () => {
    const draft = createMobileEditorDraft({
      note: {
        id: 'formatting',
        title: 'Formatting',
        content: '# Formatting',
      },
      editorHtml: [
        '<h2>Section</h2>',
        '<p>Use <strong>bold</strong>, <em>emphasis</em>, <code>code</code>, and <a href="https://tolaria.app">links</a>.</p>',
        '<ol><li>First</li><li>Second</li></ol>',
      ].join(''),
    })

    expect(draft).toMatchObject({
      persistable: true,
      canonicalMarkdown: [
        '## Section',
        '',
        'Use **bold**, *emphasis*, `code`, and [links](https://tolaria.app).',
        '',
        '1. First',
        '1. Second',
      ].join('\n'),
    })
  })

  it('serializes TenTap-style task list items', () => {
    const draft = createMobileEditorDraft({
      note: {
        id: 'tasks',
        title: 'Tasks',
        content: '# Tasks',
      },
      editorHtml: [
        '<ul data-type="taskList">',
        '<li data-checked="true"><label><input type="checkbox" checked=""></label><div><p>Done</p></div></li>',
        '<li data-checked="false"><label><input type="checkbox"></label><div><p>Todo</p></div></li>',
        '</ul>',
      ].join(''),
    })

    expect(draft).toMatchObject({
      persistable: true,
      canonicalMarkdown: '- [x] Done\n- [ ] Todo',
    })
  })

  it('blocks unsupported HTML instead of persisting unknown editor output', () => {
    expect(
      createMobileEditorDraft({
        note: {
          id: 'workflow',
          title: 'Workflow',
          content: '# Workflow\n\nOriginal markdown',
        },
        editorHtml: '<blockquote><p>Not yet supported</p></blockquote>',
      }),
    ).toEqual({
      noteId: 'workflow',
      sourceMarkdown: '# Workflow\n\nOriginal markdown',
      editorHtml: '<blockquote><p>Not yet supported</p></blockquote>',
      persistable: false,
      blockedReason: 'unsupportedEditorHtml',
    })
  })
})
