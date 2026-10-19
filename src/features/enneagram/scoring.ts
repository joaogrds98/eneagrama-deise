import type { Answers, EnneagramType, Instrument, ScoreResult, TypeScore } from './types'

const TYPES: readonly EnneagramType[] = [1, 2, 3, 4, 5, 6, 7, 8, 9]

export function validateInstrument(instrument: Instrument): void {
  if (!instrument.id || !instrument.version || !instrument.source || !instrument.license) {
    throw new Error('O instrumento precisa de identificação, fonte e licença.')
  }
  if (!Number.isFinite(instrument.estimatedMinutes) || instrument.estimatedMinutes <= 0) {
    throw new Error('Duração estimada inválida.')
  }
  if (instrument.anchors.length !== 5 || instrument.anchors.some(anchor => !anchor.trim())) {
    throw new Error('A escala precisa ter cinco âncoras.')
  }
  const ids = new Set<string>()
  if (instrument.items.length === 0) throw new Error('O instrumento precisa de itens.')
  for (const item of instrument.items) {
    if (!item.id || !item.text.trim() || ids.has(item.id) || (item.type !== undefined && !TYPES.includes(item.type))) {
      throw new Error('Itens inválidos, duplicados ou com tipo desconhecido.')
    }
    if (item.anchors && (item.anchors.length !== 5 || item.anchors.some(anchor => !anchor.trim()))) {
      throw new Error('A escala de um item precisa ter cinco âncoras.')
    }
    ids.add(item.id)
  }
}

export function validateAnswers(instrument: Instrument, answers: Answers): void {
  validateInstrument(instrument)
  const expectedIds = new Set(instrument.items.map(item => item.id))
  if (Object.keys(answers).some(id => !expectedIds.has(id))) {
    throw new Error('As respostas contêm um item desconhecido.')
  }
  for (const item of instrument.items) {
    const value = answers[item.id]
    if (!Number.isInteger(value) || value === undefined || value < 1 || value > 5) {
      throw new Error(`Resposta ausente ou inválida: ${item.id}`)
    }
  }
}

/** Raw equal-weight 1–5 sum per keyed type. Never interpreted as a probability. */
export function scoreInstrument(instrument: Instrument, answers: Answers): ScoreResult {
  validateAnswers(instrument, answers)
  const counts = TYPES.map(type => instrument.items.filter(item => item.type === type).length)
  if (instrument.items.some(item => item.type === undefined) || counts.some(count => count === 0 || count !== counts[0])) {
    throw new Error('A soma direta exige igual quantidade positiva de itens por tipo e uma chave por item.')
  }
  const totals = new Map<EnneagramType, TypeScore>(
    TYPES.map(type => [type, { type, raw: 0, percentage: 0, minimum: 0, maximum: 0, itemCount: 0 }]),
  )
  for (const item of instrument.items) {
    const value = answers[item.id]!
    const score = totals.get(item.type!)!
    score.raw += value
    score.minimum += 1
    score.maximum += 5
    score.itemCount += 1
  }
  const scores = TYPES.map(type => totals.get(type)!)
  const grandTotal = scores.reduce((sum, score) => sum + score.raw, 0)
  for (const score of scores) score.percentage = (score.raw / grandTotal) * 100
  const topScore = Math.max(...scores.map(score => score.raw))
  const leaders = scores.filter(score => score.raw === topScore).map(score => score.type)
  return {
    instrumentId: instrument.id,
    instrumentVersion: instrument.version,
    scores,
    topScore,
    leaders,
    dominantType: leaders.length === 1 ? leaders[0] : null,
  }
}

export function validateScoreResult(instrument: Instrument, result: ScoreResult): void {
  if (result.instrumentId !== instrument.id || result.instrumentVersion !== instrument.version || result.scores.length !== 9) {
    throw new Error('Resultado incompatível com o instrumento.')
  }
  const seen = new Set<EnneagramType>()
  for (const score of result.scores) {
    if (!TYPES.includes(score.type) || seen.has(score.type) || !Number.isFinite(score.raw) || !Number.isFinite(score.percentage) || !Number.isFinite(score.minimum) || !Number.isFinite(score.maximum) || score.maximum <= score.minimum || score.raw < score.minimum || score.raw > score.maximum) {
      throw new Error('Pontuações inválidas.')
    }
    seen.add(score.type)
  }
  const grandTotal = result.scores.reduce((sum, score) => sum + score.raw, 0)
  if (grandTotal <= 0 || result.scores.some(score => Math.abs(score.percentage - (score.raw / grandTotal) * 100) > 1e-9)) {
    throw new Error('Percentuais incompatíveis com as pontuações.')
  }
  const top = Math.max(...result.scores.map(score => score.raw))
  const leaders = result.scores.filter(score => score.raw === top).map(score => score.type).sort((a, b) => a - b)
  if (result.topScore !== top || result.leaders.join(',') !== leaders.join(',') || result.dominantType !== (leaders.length === 1 ? leaders[0] : null)) {
    throw new Error('Liderança ou empate inconsistentes.')
  }
}
