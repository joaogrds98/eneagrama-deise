import { describe, expect, it } from 'vitest'
import { activeAssessment, emotionalCoachingInstrument } from './instrument'
import { validateInstrument, validateScoreResult } from './scoring'
import { shuffleItems } from './shuffle'
import type { EnneagramType } from './types'

const types: EnneagramType[] = [1, 2, 3, 4, 5, 6, 7, 8, 9]
const instrument = emotionalCoachingInstrument
const answers = (value: number) => Object.fromEntries(instrument.items.map(item => [item.id, value]))

describe('questionário Emotional Coaching', () => {
  it('has exactly 135 complete, unique statements and 15 items per type', () => {
    expect(() => validateInstrument(instrument)).not.toThrow()
    expect(instrument.items).toHaveLength(135)
    expect(new Set(instrument.items.map(item => item.id)).size).toBe(135)
    expect(new Set(instrument.items.map(item => item.text)).size).toBe(135)
    expect(instrument.items.every(item => item.text.trim().length > 0)).toBe(true)
    expect(instrument.anchors).toEqual([
      'Não combina comigo', 'Combina pouco comigo', 'Combina mais ou menos comigo',
      'Combina comigo', 'Combina totalmente comigo',
    ])
    for (const type of types) expect(instrument.items.filter(item => item.type === type)).toHaveLength(15)
    instrument.items.forEach((item, index) => {
      expect(item.id).toBe(`ec-${String(index + 1).padStart(3, '0')}`)
      expect(item.type).toBe(Math.floor(index / 15) + 1)
    })
  })

  it.each(types)('can identify type %i with the source key', type => {
    const values = answers(1)
    for (const item of instrument.items.filter(item => item.type === type)) values[item.id] = 5
    const result = activeAssessment.score(values)
    expect(() => validateScoreResult(instrument, result)).not.toThrow()
    expect(result.dominantType).toBe(type)
    expect(result.leaders).toEqual([type])
    expect(result.scores.find(score => score.type === type)).toMatchObject({
      raw: 75, minimum: 15, maximum: 75, itemCount: 15,
    })
    expect(result.scores.find(score => score.type === type)!.percentage).toBeCloseTo(75 / 195 * 100)
    expect(result.scores.filter(score => score.type !== type).every(score => score.raw === 15)).toBe(true)
  })

  it('calculates the share of total scores and preserves ties', () => {
    const allEqual = activeAssessment.score(answers(3))
    expect(allEqual.leaders).toEqual(types)
    expect(allEqual.scores.every(score => score.raw === 45)).toBe(true)
    expect(allEqual.scores.every(score => Math.abs(score.percentage - 100 / 9) < 1e-10)).toBe(true)
    const values = answers(1)
    for (const item of instrument.items.filter(item => item.type === 2 || item.type === 9)) values[item.id] = 4
    const tied = activeAssessment.score(values)
    expect(tied.leaders).toEqual([2, 9])
    expect(tied.dominantType).toBeNull()
    expect(tied.topScore).toBe(60)
    expect(tied.scores.find(score => score.type === 2)!.percentage).toBeCloseTo(60 / 225 * 100)
    expect(tied.scores.reduce((sum, score) => sum + score.percentage, 0)).toBeCloseTo(100)
  })

  it('keeps every ID and its type when shuffled, and allows a different order', () => {
    const original = instrument.items
    const shuffled = shuffleItems(original, () => 0)
    expect(shuffled).not.toEqual(original)
    expect(new Set(shuffled.map(item => item.id))).toEqual(new Set(original.map(item => item.id)))
    expect(shuffled.map(item => item.type).sort()).toEqual(original.map(item => item.type).sort())
    expect(original[0].id).toBe('ec-001')
  })

  it('rejects incomplete responses and invalid percentages', () => {
    const values = answers(3)
    delete values['ec-135']
    expect(() => activeAssessment.score(values)).toThrow()
    const result = activeAssessment.score(answers(3))
    const scores = result.scores.map((score, index) => index === 0 ? { ...score, percentage: 99 } : score)
    expect(() => validateScoreResult(instrument, { ...result, scores })).toThrow()
  })
})
