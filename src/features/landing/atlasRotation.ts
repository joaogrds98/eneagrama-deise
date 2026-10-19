export const ATLAS_STEP = 40

// Keep the accumulated turns; normalize only the small difference between samples.
export function angleDelta(previous: number, next: number) {
  return ((next - previous + 180) % 360 + 360) % 360 - 180
}

export function rotationForType(index: number, current: number) {
  return current + angleDelta(current, -index * ATLAS_STEP)
}

export function snapRotation(rotation: number) {
  return Math.round(rotation / ATLAS_STEP) * ATLAS_STEP
}

export function typeForRotation(rotation: number) {
  const step = -Math.round(rotation / ATLAS_STEP)
  return ((step % 9) + 9) % 9
}
