import PropTypes from 'prop-types'

function formatPlaybackTime(timestamp) {
  return new Date(timestamp).toISOString().slice(11, 19)
}

export default function PlaybackControls({ timestamp }) {
  return (
    <div
      aria-label="Historical playback"
      className="playback-controls"
      data-testid="playback-controls"
    >
      <span>Bybit Spot BTCUSDT · 2026-07-31 UTC</span>
      <output aria-live="polite" data-testid="playback-clock">
        {formatPlaybackTime(timestamp)}
      </output>
    </div>
  )
}

PlaybackControls.propTypes = {
  timestamp: PropTypes.number.isRequired
}
