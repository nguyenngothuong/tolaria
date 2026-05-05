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

  it('serializes blockquotes, code blocks, and strikethrough', () => {
    const draft = createMobileEditorDraft({
      note: {
        id: 'formatting',
        title: 'Formatting',
        content: '# Formatting',
      },
      editorHtml: [
        '<blockquote><p>Quoted idea</p><p>Second line</p></blockquote>',
        '<pre><code class="language-ts">const value = &lt;string&gt;input</code></pre>',
        '<p>Keep <s>stale</s> text visible.</p>',
      ].join(''),
    })

    expect(draft).toMatchObject({
      persistable: true,
      canonicalMarkdown: [
        '> Quoted idea',
        '> Second line',
        '',
        '```ts',
        'const value = <string>input',
        '```',
        '',
        'Keep ~~stale~~ text visible.',
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
        editorHtml: '<figure><figcaption>Not yet supported</figcaption></figure>',
      }),
    ).toEqual({
      noteId: 'workflow',
      sourceMarkdown: '# Workflow\n\nOriginal markdown',
      editorHtml: '<figure><figcaption>Not yet supported</figcaption></figure>',
      persistable: false,
      blockedReason: 'unsupportedEditorHtml',
    })
  })

  it('serializes simple TenTap tables as Markdown tables', () => {
    expect(
      createMobileEditorDraft({
        note: {
          id: 'table',
          title: 'Table',
          content: '# Table',
        },
        editorHtml: [
          '<table><tbody>',
          '<tr><th><p>Name</p></th><th><p>Status</p></th></tr>',
          '<tr><td><p>Tolaria</p></td><td><p>Ready &amp; synced</p></td></tr>',
          '<tr><td><p>Pipe</p></td><td><p>A | B</p></td></tr>',
          '</tbody></table>',
        ].join(''),
      }),
    ).toMatchObject({
      noteId: 'table',
      persistable: true,
      canonicalMarkdown: [
        '| Name | Status |',
        '| --- | --- |',
        '| Tolaria | Ready & synced |',
        '| Pipe | A \\| B |',
      ].join('\n'),
    })
  })

  it('blocks malformed tables instead of guessing columns', () => {
    expect(
      createMobileEditorDraft({
        note: {
          id: 'table',
          title: 'Table',
          content: '# Table',
        },
        editorHtml: '<table><tbody><tr><td>Name</td><td>Status</td></tr><tr><td>Tolaria</td></tr></tbody></table>',
      }),
    ).toMatchObject({
      noteId: 'table',
      persistable: false,
      blockedReason: 'unsupportedEditorHtml',
    })
  })

  it('serializes safe image attachments inside supported blocks', () => {
    expect(
      createMobileEditorDraft({
        note: {
          id: 'image',
          title: 'Image',
          content: '# Image',
        },
        editorHtml: '<p>Before</p><p><img src="attachments/sketch.png" alt="Interface sketch"></p><p>After</p>',
      }),
    ).toMatchObject({
      noteId: 'image',
      persistable: true,
      canonicalMarkdown: 'Before\n\n![Interface sketch](attachments/sketch.png)\n\nAfter',
    })
  })

  it('blocks transient or unsafe image sources inside otherwise supported blocks', () => {
    expect(
      createMobileEditorDraft({
        note: {
          id: 'image',
          title: 'Image',
          content: '# Image',
        },
        editorHtml: '<p><img src="blob:https://tolaria.app/preview" alt="Attachment"></p>',
      }),
    ).toMatchObject({
      noteId: 'image',
      persistable: false,
      blockedReason: 'unsupportedEditorHtml',
    })
  })
})
