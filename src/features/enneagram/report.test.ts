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

function saveRender(name: string, bytes: Uint8Array) {
  if (process.env.RENDER_PDF !== '1') return
  mkdirSync(resolve('tmp/pdfs'), { recursive: true })
  writeFileSync(resolve(`tmp/pdfs/${name}.pdf`), bytes)
}

describe('local PDF report', () => {
  beforeEach(() => {
    const logo = readFileSync(resolve('public/branding/logo-original.png'))
    vi.stubGlobal('fetch', vi.fn(async () => new Response(new Uint8Array(logo), { status: 200 })))
  })
  afterEach(() => vi.unstubAllGlobals())

  it('fits one clear leader and the score distribution on one A4 page', async () => {
    const bytes = await createReport(makeResult([5]), new Date('2026-10-16T12:00:00Z'))
    const pdf = await PDFDocument.load(bytes)
    expect(pdf.getTitle()).toBe('Eneagrama - Relatório de autoconhecimento')
    expect(pdf.getAuthor()).toBe('Deise A. Zardeto Bello')
    expect(pdf.getPageCount()).toBe(1)
    expect(pdf.getPages()[0].getSize().width).toBeCloseTo(595.28, 1)
    expect(bytes.length).toBeGreaterThan(10_000)
    saveRender('report-single-leader', bytes)
  })

  it('keeps two tied leaders equal in a one-page report when space permits', async () => {
    const bytes = await createReport(makeResult([2, 7]), new Date('2026-10-16T12:00:00Z'))
    const pdf = await PDFDocument.load(bytes)
    expect(pdf.getPageCount()).toBe(1)
    saveRender('report-two-way-tie', bytes)
  })

  it('lays out five tied profiles without clipping or naming a winner', async () => {
    const bytes = await createReport(makeResult([1, 3, 5, 7, 9]), new Date('2026-10-16T12:00:00Z'))
    const pdf = await PDFDocument.load(bytes)
    expect(pdf.getPageCount()).toBe(2)
    saveRender('report-five-way-tie', bytes)
  })

  it('lays out all nine tied profiles without clipping or naming a winner', async () => {
    const bytes = await createReport(makeResult(types), new Date('2026-10-16T12:00:00Z'))
    const pdf = await PDFDocument.load(bytes)
    expect(pdf.getPageCount()).toBe(2)
    saveRender('report-nine-way-tie', bytes)
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
    expect(pdf.getPageCount()).toBe(1)
    expect(bytes.length).toBeGreaterThan(10_000)
    saveRender('report-long-participant-name', bytes)
  })
})
