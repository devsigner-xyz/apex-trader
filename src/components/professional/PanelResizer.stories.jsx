import { useState } from 'react'
import PanelResizer from './PanelResizer.jsx'

const meta = {
  title: 'Workspace/Panel resizer',
  component: PanelResizer
}

export default meta

function HorizontalResizer() {
  const [width, setWidth] = useState(280)
  return (
    <div className="storybook-resizer-demo">
      <div className="storybook-resizer-panel" style={{ width }}>
        <strong>Resizable panel</strong>
        <output>{width}px</output>
      </div>
      <PanelResizer
        label="Resize example panel"
        onResize={(delta) => setWidth((current) => Math.min(Math.max(current + delta, 180), 420))}
      />
    </div>
  )
}

export const Horizontal = { render: () => <HorizontalResizer /> }
