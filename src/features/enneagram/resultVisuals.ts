import type { EnneagramType, ScoreResult } from './types'

export const resultTypeOrder: readonly EnneagramType[] = [2, 3, 4, 5, 6, 7, 8, 9, 1]

export const typeColors: Record<EnneagramType, string> = {
  1: '#b32162',
  2: '#e63737',
  3: '#f28a00',
  4: '#e6c400',
  5: '#a8b900',
  6: '#339b13',
  7: '#35bdbb',
  8: '#48b6d2',
  9: '#555ca7',
}

export const intelligenceCenters = [
  { id: 'emotional', name: 'Emocional', types: [2, 3, 4] as const, color: '#339b13' },
  { id: 'mental', name: 'Mental', types: [5, 6, 7] as const, color: '#48b6d2' },
  { id: 'instinctive', name: 'Instintivo', types: [8, 9, 1] as const, color: '#e63737' },
] as const

export interface ResultTypeRow {
  type: EnneagramType
  raw: number
  maximum: number
  name: string
}

export interface ResultCenterSummary {
  id: (typeof intelligenceCenters)[number]['id']
  name: string
  types: readonly EnneagramType[]
  color: string
  raw: number
  percentage: number
}

export interface ResultVisualData {
  rows: ResultTypeRow[]
  centers: ResultCenterSummary[]
  total: number
}

/** Shared display data for the results screen and local PDF; scoring remains untouched. */
export function getResultVisualData(result: ScoreResult, typeName: (type: EnneagramType) => string): ResultVisualData {
  const byType = new Map(result.scores.map(score => [score.type, score]))
  const rows = resultTypeOrder.map(type => {
    const score = byType.get(type)
    if (!score) throw new Error(`Pontuação ausente para o tipo ${type}.`)
    return { type, raw: score.raw, maximum: score.maximum, name: typeName(type) }
  })
  const total = rows.reduce((sum, row) => sum + row.raw, 0)
  const rawCenters = intelligenceCenters.map(center => ({
    ...center,
    raw: center.types.reduce((sum, type) => sum + (byType.get(type)?.raw ?? 0), 0),
  }))
  const exactShares = rawCenters.map(center => total === 0 ? 0 : (center.raw / total) * 100)
  const percentages = exactShares.map(Math.floor)
  let remaining = 100 - percentages.reduce((sum, percentage) => sum + percentage, 0)
  const remainderOrder = exactShares
    .map((share, index) => ({ index, remainder: share - Math.floor(share) }))
    .sort((a, b) => b.remainder - a.remainder || a.index - b.index)
  for (let index = 0; index < remaining; index += 1) percentages[remainderOrder[index % remainderOrder.length].index] += 1
  const centers = rawCenters.map((center, index) => ({ ...center, percentage: percentages[index] }))
  return { rows, centers, total }
}
