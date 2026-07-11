import assert from 'node:assert/strict'
import test from 'node:test'
import {
  clamp,
  computeDeskConstraint,
  computeHorizontalFOV,
  computeInterfaceBandwidth,
  computePPD,
  computePPI,
  computeRetinaDistance,
  computeSMPTERange,
  computeTextComfort,
  computeTHXDistance,
  resolveDimensions,
} from '../js/calc.js'

const closeTo = (actual, expected, tolerance = 1e-10) => {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} is not close to ${expected}`)
}

test('clamp keeps values inside inclusive bounds', () => {
  assert.equal(clamp(-1, 0, 100), 0)
  assert.equal(clamp(50, 0, 100), 50)
  assert.equal(clamp(101, 0, 100), 100)
})

test('PPI handles a known 4K display and an invalid diagonal', () => {
  closeTo(computePPI(3840, 2160, 32), 137.681698, 0.000001)
  assert.equal(computePPI(3840, 2160, 0), 0)
})

test('resolved dimensions preserve diagonal and aspect ratio', () => {
  const dimensions = resolveDimensions(32, '16:9')
  closeTo(Math.hypot(dimensions.widthCm, dimensions.heightCm) / 2.54, 32)
  closeTo(dimensions.widthCm / dimensions.heightCm, 16 / 9)
})

test('retina distance is the inverse of approximately 60 PPD', () => {
  const ppi = computePPI(3840, 2160, 32)
  const retinaDistance = computeRetinaDistance(ppi)
  closeTo(computePPD(ppi, retinaDistance), 60, 0.002)
  assert.equal(computePPD(0, retinaDistance), 0)
  assert.equal(computeRetinaDistance(0), 0)
})

test('horizontal field of view decreases as viewing distance grows', () => {
  const near = computeHorizontalFOV(32, '16:9', 60)
  const far = computeHorizontalFOV(32, '16:9', 100)
  assert.ok(near > far)
  assert.ok(far > 0 && near < 180)
})

test('THX and SMPTE distances use centimetres and ordered bounds', () => {
  closeTo(computeTHXDistance(32), (32 / 0.84) * 2.54)
  const range = computeSMPTERange(32)
  closeTo(range.min, (32 / 0.625) * 2.54)
  closeTo(range.max, (32 / 0.417) * 2.54)
  assert.ok(range.min < range.max)
})

test('text comfort score clamps to 0–100 and assigns boundary labels', () => {
  assert.deepEqual(computeTextComfort(0, 0), { score: 0, label: '差' })
  assert.equal(computeTextComfort(40, 0).label, '良好')
  assert.deepEqual(computeTextComfort(120, 100), { score: 100, label: '极致' })
})

test('interface bandwidth uses decimal Gbps', () => {
  assert.equal(computeInterfaceBandwidth(3840, 2160, 60, 10), 4.97664)
  assert.equal(computeInterfaceBandwidth(1920, 1080, 60, 8), 0.995328)
})

test('desk constraint keeps the documented 25 cm reserve', () => {
  const result = computeDeskConstraint(80)
  assert.equal(result.usableDepthCm, 55)
  closeTo(result.maxDiagonalInch, 55 / 0.37)
})
