export function createFixedChartSlots(itemCount, slotCount, plotLeft, plotWidth, phase = 0) {
  if (!Number.isInteger(itemCount) || itemCount < 0)
    throw new TypeError('Chart item count must be a non-negative integer.')
  if (!Number.isInteger(slotCount) || slotCount < 1 || itemCount > slotCount + 1)
    throw new TypeError('Chart item count cannot exceed slot count by more than one.')
  if (!Number.isFinite(plotLeft) || !Number.isFinite(plotWidth) || plotWidth <= 0)
    throw new TypeError('Chart plot geometry must be finite and have positive width.')
  if (!Number.isFinite(phase) || phase < 0 || phase >= 1)
    throw new TypeError('Chart slot phase must be a finite number from zero up to one.')

  const step = plotWidth / slotCount
  return {
    phase,
    positions: Array.from(
      { length: itemCount },
      (_, index) => plotLeft + (index + 0.5 - phase) * step
    ),
    step
  }
}
