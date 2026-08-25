import { useRef } from 'react'
import PropTypes from 'prop-types'

export default function PanelResizer({ axis = 'x', className = '', label, onResize }) {
  const startPosition = useRef(null)
  const handlePointerDown = (event) => {
    startPosition.current = axis === 'y' ? event.clientY : event.clientX
    const handleMove = (moveEvent) => {
      const nextPosition = axis === 'y' ? moveEvent.clientY : moveEvent.clientX
      const delta = nextPosition - startPosition.current
      startPosition.current = nextPosition
      onResize(delta)
    }
    const handleUp = () => {
      startPosition.current = null
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
    }
    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
  }

  return (
    <button
      aria-label={label}
      className={`panel-resizer ${className}`.trim()}
      onKeyDown={(event) => {
        if (event.key === (axis === 'y' ? 'ArrowUp' : 'ArrowLeft')) onResize(-8)
        else if (event.key === (axis === 'y' ? 'ArrowDown' : 'ArrowRight')) onResize(8)
        else return
        event.preventDefault()
      }}
      onPointerDown={handlePointerDown}
      type="button"
    />
  )
}

PanelResizer.propTypes = {
  axis: PropTypes.oneOf(['x', 'y']),
  className: PropTypes.string,
  label: PropTypes.string.isRequired,
  onResize: PropTypes.func.isRequired
}
