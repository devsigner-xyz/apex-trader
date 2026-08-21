import PropTypes from 'prop-types'

export default function VolumeHeightControl({ onChange, value }) {
  return (
    <label className="chart-volume-height-control">
      <span>Vol.</span>
      <input
        aria-label="Volume pane height"
        max="50"
        min="15"
        onChange={(event) => onChange(Number(event.target.value))}
        step="1"
        type="range"
        value={value}
      />
      <output>{value}%</output>
    </label>
  )
}

VolumeHeightControl.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.number.isRequired
}
