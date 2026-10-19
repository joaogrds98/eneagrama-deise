import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PDFDocument } from 'pdf-lib'
import { activeAssessment, emotionalCoachingInstrument } from './instrument'
import { createReport, reportFilename, sanitizeFilenameName } from './report'
import type { EnneagramType } from './types'

const types: EnneagramType[] = [1, 2, 3, 4, 5, 6, 7, 8, 9]
const makeResult = (leaders: EnneagramType[]) => {
  const answers = Object.fromEntries(emotionalCoachingInstrument.items.map(item => [item.id, leaders.includes(item.type!) ? 5 : 3]))
  return activeAssessment.score(answers)
}

describe('local PDF report', () => {
  beforeEach(() => {
    const logo = readFileSync(resolve('public/branding/logo-original.png'))
    vi.stubGlobal('fetch', vi.fn(async () => new Response(new Uint8Array(logo), { status: 200 })))
  })
  afterEach(() => vi.unstubAllGlobals())

  it('creates a readable A4 report with a unique leader', async () => {
    const bytes = await createReport(makeResult([5]), new Date('2026-10-16T12:00:00Z'))
    const pdf = await PDFDocument.load(bytes)
    expect(pdf.getTitle()).toBe('Eneagrama — Relatório de autoconhecimento')
    expect(pdf.getAuthor()).toBe('Déise A. Zardeto')
    expect(pdf.getPageCount()).toBeGreaterThanOrEqual(1)
    expect(pdf.getPages()[0].getSize().width).toBeCloseTo(595.28, 1)
    expect(bytes.length).toBeGreaterThan(10_000)
    if (process.env.RENDER_PDF === '1') {
      mkdirSync(resolve('tmp/pdfs'), { recursive: true })
      writeFileSync(resolve('tmp/pdfs/report-check.pdf'), bytes)
    }
  })

  it('creates a report for all tied leaders without selecting a winner', async () => {
    const bytes = await createReport(makeResult(types), new Date('2026-10-16T12:00:00Z'))
    const pdf = await PDFDocument.load(bytes)
    expect(pdf.getPageCount()).toBeGreaterThanOrEqual(1)
    if (process.env.RENDER_PDF === '1') {
      mkdirSync(resolve('tmp/pdfs'), { recursive: true })
      writeFileSync(resolve('tmp/pdfs/report-tie-check.pdf'), bytes)
    }
  })

  it('sanitizes accented and special characters for a safe personalized filename', () => {
    expect(sanitizeFilenameName('João Gabriel')).toBe('Joao-Gabriel')
    expect(sanitizeFilenameName('Ana/"Silva"?')).toBe('Ana-Silva')
    expect(sanitizeFilenameName(' < > : / \\ | ? * ')).toBe('')
  })

  it('uses the Eneagrama product name in report filenames', () => {
    expect(reportFilename()).toBe('Eneagrama-Resultado.pdf')
    expect(reportFilename('João Gabriel')).toBe('Eneagrama-Joao-Gabriel.pdf')
  })

  it('keeps long names safe for filenames and generates a PDF with a long special-character name', async () => {
    const longName = 'João Gabriel ' + 'da Silva '.repeat(9) + 'Filho & Neto'
    const safeName = sanitizeFilenameName(longName)
    expect(safeName).toMatch(/^[\p{L}\p{N}-]+$/u)
    expect(safeName.length).toBeLessThanOrEqual(72)
    const bytes = await createReport(makeResult([5]), new Date('2026-10-16T12:00:00Z'), longName)
    const pdf = await PDFDocument.load(bytes)
    expect(pdf.getPageCount()).toBeGreaterThanOrEqual(1)
    expect(bytes.length).toBeGreaterThan(10_000)
    if (process.env.RENDER_PDF === '1') {
      mkdirSync(resolve('tmp/pdfs'), { recursive: true })
      writeFileSync(resolve('tmp/pdfs/report-long-name-check.pdf'), bytes)
    }
  })
})
