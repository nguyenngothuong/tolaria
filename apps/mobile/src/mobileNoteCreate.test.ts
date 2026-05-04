import { describe, expect, it } from 'vitest'
import { createMobileNoteFile } from './mobileNoteCreate'

describe('mobile note create', () => {
  it('creates a deterministic markdown file from the current time', () => {
    const file = createMobileNoteFile({
      now: new Date('2026-05-04T12:34:56.000Z'),
    })

    expect(file).toEqual({
      path: 'note-mor6mem8.md',
      content: [
        '---',
        'title: Untitled',
        'type: Note',
        'created: 2026-05-04T12:34:56.000Z',
        '---',
        '',
        '# Untitled',
        '',
      ].join('\n'),
    })
  })

  it('supports a custom title for future create flows', () => {
    const file = createMobileNoteFile({
      now: new Date('2026-05-04T12:34:56.000Z'),
      title: 'Meeting notes',
    })

    expect(file.content).toContain('title: Meeting notes')
    expect(file.content).toContain('# Meeting notes')
  })
})
