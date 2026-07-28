import PropTypes from 'prop-types'

export default function FootprintInspector({ bar }) {
  if (!bar) return null

  return (
    <aside aria-live="polite" className="footprint-inspector" data-testid="footprint-inspector">
      <strong>Barra seleccionada</strong>
      <span>
        Volumen {bar.total} · Δ {bar.delta >= 0 ? '+' : ''}
        {bar.delta}
      </span>
      <span>POC {bar.pocPrice.toLocaleString('en-US')}</span>
      <span>
        Rango {bar.low.toLocaleString('en-US')}–{bar.high.toLocaleString('en-US')}
      </span>
      <small>Lectura educativa; no es una señal ni una cotización.</small>
    </aside>
  )
}

FootprintInspector.propTypes = {
  bar: PropTypes.shape({
    delta: PropTypes.number.isRequired,
    high: PropTypes.number.isRequired,
    low: PropTypes.number.isRequired,
    pocPrice: PropTypes.number.isRequired,
    total: PropTypes.number.isRequired
  })
}
