import { useEffect, useState } from 'react'

const compactWorkstationQuery =
  '(max-width: 767px), (max-width: 1399px) and (hover: none) and (pointer: coarse)'

export default function DemoViewportNotice() {
  const [visible, setVisible] = useState(
    () => window.matchMedia?.(compactWorkstationQuery).matches ?? false
  )
  const reducedMotion =
    typeof window !== 'undefined' &&
    (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false)

  useEffect(() => {
    const media = window.matchMedia?.(compactWorkstationQuery)
    if (!media) return undefined
    const update = () => setVisible(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  if (!visible) return null

  return (
    <aside
      aria-labelledby="demo-viewport-title"
      aria-modal="true"
      className="demo-viewport-notice"
      role="dialog"
    >
      <div className="demo-viewport-notice__card">
        <div className="demo-viewport-notice__video">
          <video
            aria-label="Apex Trader desktop workstation replay"
            autoPlay={!reducedMotion}
            loop
            muted
            playsInline
            poster="/media/hero-terminal-candles-800.avif"
            preload="metadata"
          >
            <source src="/media/hero-replay.mp4" type="video/mp4" />
            <source src="/media/hero-replay.webm" type="video/webm" />
          </video>
        </div>
        <div className="demo-viewport-notice__content">
          <span>DESKTOP WORKSTATION</span>
          <h1 id="demo-viewport-title">APEX TRADER ESTÁ PENSADO PARA ESCRITORIO</h1>
          <p>
            La terminal necesita una pantalla amplia para mostrar chart, mercado, profundidad y
            ejecución al mismo tiempo. La experiencia para móvil y tablet todavía no está
            disponible.
          </p>
          <a
            href="https://www.devsigner.xyz/proyectos/apextrader/"
            rel="noopener noreferrer"
            target="_blank"
          >
            VER DETALLE DEL PROYECTO
          </a>
        </div>
      </div>
    </aside>
  )
}
