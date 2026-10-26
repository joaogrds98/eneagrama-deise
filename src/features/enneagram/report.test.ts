import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PDFDocument } from 'pdf-lib'
import { activeAssessment, emotionalCoachingInstrument } from './instrument'
import { createReport, rankScoresForReport, reportFilename, sanitizeFilenameName } from './report'
import { getResultVisualData } from './resultVisuals'
import type { EnneagramType } from './types'

const types: EnneagramType[] = [1, 2, 3, 4, 5, 6, 7, 8, 9]
const makeResult = (leaders: EnneagramType[]) => {
  const answers = Object.fromEntries(emotionalCoachingInstrument.items.map(item => [item.id, leaders.includes(item.type!) ? 5 : 3]))
  return activeAssessment.score(answers)
}

function saveRender(name: string, bytes: Uint8Array) {
  if (process.env.RENDER_PDF !== '1') return
  mkdirSync(resolve('tmp/pdfs/revisao-resultados'), { recursive: true })
  writeFileSync(resolve(`tmp/pdfs/revisao-resultados/${name}.pdf`), bytes)
}

describe('local PDF report', () => {
  beforeEach(() => {
    const logo = readFileSync(resolve('public/branding/logo-original.png'))
    vi.stubGlobal('fetch', vi.fn(async () => new Response(new Uint8Array(logo), { status: 200 })))
  })
  afterEach(() => vi.unstubAllGlobals())

  it('fits the table and both charts on a single A4 landscape page', async () => {
    const bytes = await createReport(makeResult([5]), new Date('2026-10-16T12:00:00Z'))
    const pdf = await PDFDocument.load(bytes)
    expect(pdf.getTitle()).toBe('Eneagrama - Resultado')
    expect(pdf.getAuthor()).toBe('Deise A. Zardeto Bello')
    expect(pdf.getPageCount()).toBe(1)
    expect(pdf.getPages()[0].getSize().width).toBeCloseTo(841.89, 1)
    expect(bytes.length).toBeGreaterThan(10_000)
    saveRender('report-single-leader', bytes)
  })

  it('preserves a two-way tie in the report without choosing a winner', async () => {
    const bytes = await createReport(makeResult([2, 7]), new Date('2026-10-16T12:00:00Z'))
    const pdf = await PDFDocument.load(bytes)
    saveRender('report-two-way-tie', bytes)
    expect(pdf.getPageCount()).toBe(1)
  })

  it('renders five tied leaders on the same shared results layout', async () => {
    const bytes = await createReport(makeResult([1, 3, 5, 7, 9]), new Date('2026-10-16T12:00:00Z'))
    const pdf = await PDFDocument.load(bytes)
    expect(pdf.getPageCount()).toBe(1)
    saveRender('report-five-way-tie', bytes)
  })

  it('renders nine tied leaders without changing the report layout or tie data', async () => {
    const bytes = await createReport(makeResult(types), new Date('2026-10-16T12:00:00Z'))
    const pdf = await PDFDocument.load(bytes)
    saveRender('report-nine-way-tie', bytes)
    expect(pdf.getPageCount()).toBe(1)
  })

  it('ranks report rows by descending score and then by type without changing scores', () => {
    const result = makeResult([3, 9])
    const ranking = rankScoresForReport(result)
    expect(ranking.map(score => [score.type, score.raw])).toEqual([
      [3, 75], [9, 75], [1, 45], [2, 45], [4, 45], [5, 45], [6, 45], [7, 45], [8, 45],
    ])
    expect(result.scores.map(score => score.type)).toEqual(types)
  })

  it('shares the chart order and center percentages derived from the same raw scores', () => {
    const result = makeResult([3, 9])
    const visual = getResultVisualData(result, type => `Nome ${type}`)
    expect(visual.rows.map(row => row.type)).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 1])
    expect(visual.centers.map(center => [center.name, center.raw, center.percentage])).toEqual([
      ['Emocional', 165, 36], ['Mental', 135, 29], ['Instintivo', 165, 35],
    ])
    expect(visual.centers.reduce((sum, center) => sum + center.percentage, 0)).toBe(100)
    expect(visual.total).toBe(result.scores.reduce((sum, score) => sum + score.raw, 0))
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
