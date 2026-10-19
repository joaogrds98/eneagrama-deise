import { describe, expect, it } from 'vitest'
import { angleDelta, rotationForType, snapRotation, typeForRotation } from './atlasRotation'

describe('atlas rotation', () => {
  it('crosses the angle boundary in either direction without a full-turn jump', () => {
    expect(angleDelta(179, -179)).toBe(2)
    expect(angleDelta(-179, 179)).toBe(-2)
    expect(angleDelta(350, 10)).toBe(20)
    expect(angleDelta(10, 350)).toBe(-20)
  })

  it('accumulates more than one complete turn without clamping', () => {
    const samples = [0, 90, 179, -90, 0, 90, 179, -90, 0, 90]
    let rotation = 0
    for (let index = 1; index < samples.length; index++) rotation += angleDelta(samples[index - 1], samples[index])
    expect(rotation).toBe(810)
    expect(typeForRotation(rotation)).toBe(7)
  })

  it('returns small gestures and snaps larger ones to the nearest position', () => {
    expect(snapRotation(19)).toBe(0)
    expect(snapRotation(21)).toBe(40)
    expect(snapRotation(-19)).toBeCloseTo(0)
    expect(snapRotation(-21)).toBe(-40)
    expect(snapRotation(757)).toBe(760)
    expect(snapRotation(-757)).toBe(-760)
  })

  it('selects the nearest type across positive and negative complete turns', () => {
    expect(typeForRotation(0)).toBe(0)
    expect(typeForRotation(-40)).toBe(1)
    expect(typeForRotation(40)).toBe(8)
    expect(typeForRotation(720)).toBe(0)
    expect(typeForRotation(-760)).toBe(1)
    expect(typeForRotation(760)).toBe(8)
  })

  it('moves a clicked type to the fixed focus position by the shortest route', () => {
    for (const current of [-1085, -359, -20, 0, 19, 359, 1085]) {
      for (let type = 0; type < 9; type++) {
        const target = rotationForType(type, current)
        expect(Math.abs(target - current)).toBeLessThanOrEqual(180)
        expect(typeForRotation(target)).toBe(type)
        expect(angleDelta(-50, -50 + type * 40 + target)).toBeCloseTo(0)
      }
    }
    expect(rotationForType(1, 710)).toBe(680)
    expect(rotationForType(8, -710)).toBe(-680)
  })
})
