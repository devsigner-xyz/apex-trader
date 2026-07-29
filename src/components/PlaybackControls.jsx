import PropTypes from 'prop-types'
import { playbackSpeeds } from '../hooks/useTardisPlayback.js'

function formatPlaybackTime(timestamp) {
  return new Date(timestamp).toISOString().slice(11, 19)
}

export default function PlaybackControls({ onSpeedChange, speed, timestamp }) {
  return (
    <div
      aria-label="Historical playback"
      className="playback-controls"
      data-testid="playback-controls"
    >
      <span>Binance Spot BTCUSDT · 2019-12-01 UTC</span>
      <output aria-live="polite" data-testid="playback-clock">
        {formatPlaybackTime(timestamp)}
      </output>
      <label>
        Velocidad
        <select
          aria-label="Playback speed"
          onChange={(event) => onSpeedChange(Number(event.target.value))}
          value={speed}
        >
          {playbackSpeeds.map((option) => (
            <option key={option} value={option}>
              {option}×
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}

PlaybackControls.propTypes = {
  onSpeedChange: PropTypes.func.isRequired,
  speed: PropTypes.number.isRequired,
  timestamp: PropTypes.number.isRequired
}
