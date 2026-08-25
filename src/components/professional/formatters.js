export function formatNumber(value, digits = 2) {
  return Number(value).toLocaleString('en-US', {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits
  })
}

export function formatClock(timestamp, milliseconds = false) {
  return new Date(timestamp).toISOString().slice(11, milliseconds ? 23 : 19)
}

export function activityTabId(id) {
  return `activity-tab-${id.toLowerCase().replaceAll(/[^a-z]+/g, '-')}`
}
