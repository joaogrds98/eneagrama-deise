import { describe, expect, it } from 'vitest'
import { scoreInstrument, validateInstrument, validateScoreResult } from './scoring'
import type { EnneagramType, Instrument } from './types'

// Synthetic fixture for arithmetic tests only; no participant questionnaire.
const types: EnneagramType[] = [1, 2, 3, 4, 5, 6, 7, 8, 9]
const fixture: Instrument = {
  id: 'synthetic-test-fixture', version: '1', title: 'Synthetic', source: 'Local unit test', license: 'Original test fixture', estimatedMinutes: 1,
  anchors: ['1', '2', '3', '4', '5'],
  items: types.flatMap(type => [1, 2, 3, 4].map(n => ({ id: `${type}-${n}`, text: `Synthetic item ${type}-${n}`, type }))),
}
const answers = (value: number) => Object.fromEntries(fixture.items.map(item => [item.id, value]))

describe('scoring engine', () => {
  it('accepts a complete instrument with nine equally represented types', () => {
    expect(() => validateInstrument(fixture)).not.toThrow()
  })
  it('returns minimum totals and preserves a nine-way tie', () => {
    const result = scoreInstrument(fixture, answers(1))
    expect(result.scores.map(score => score.raw)).toEqual(Array(9).fill(4))
    expect(result.leaders).toEqual(types)
    expect(result.dominantType).toBeNull()
  })
  it('returns maximum totals without pretending there is a unique leader', () => {
    const result = scoreInstrument(fixture, answers(5))
    expect(result.scores.map(score => score.raw)).toEqual(Array(9).fill(20))
    expect(result.dominantType).toBeNull()
  })
  it('identifies a unique leader and preserves its raw total', () => {
    const values = answers(2)
    for (const item of fixture.items.filter(item => item.type === 5)) values[item.id] = 5
    const result = scoreInstrument(fixture, values)
    expect(result.dominantType).toBe(5)
    expect(result.topScore).toBe(20)
    expect(result.scores[0].raw).toBe(8)
  })
  it('returns all tied leaders in numeric order', () => {
    const values = answers(2)
    for (const item of fixture.items.filter(item => item.type === 1 || item.type === 8)) values[item.id] = 5
    expect(scoreInstrument(fixture, values).leaders).toEqual([1, 8])
  })
  it.each([0, 6, 2.5, Number.NaN])('rejects an invalid value: %s', value => {
    expect(() => scoreInstrument(fixture, { ...answers(3), '1-1': value })).toThrow()
  })
  it('rejects missing and unknown responses', () => {
    const values = answers(3)
    delete values['1-1']
    expect(() => scoreInstrument(fixture, values)).toThrow()
    expect(() => scoreInstrument(fixture, { ...answers(3), other: 4 })).toThrow()
  })
  it('rejects unbalanced instruments', () => {
    expect(() => scoreInstrument({ ...fixture, items: fixture.items.slice(1) }, answers(3))).toThrow()
  })
  it('validates the contract returned by an interchangeable scorer', () => {
    const result = scoreInstrument(fixture, answers(3))
    expect(() => validateScoreResult(fixture, result)).not.toThrow()
    expect(() => validateScoreResult(fixture, { ...result, dominantType: 1 })).toThrow()
  })
})
