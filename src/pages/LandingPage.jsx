import DeferredMarketPrimitivesShowcase from '../components/landing/DeferredMarketPrimitivesShowcase.jsx'
import HeroModeCarousel from '../components/landing/HeroModeCarousel.jsx'
import { trackEvent } from '../services/analytics.js'

export default function LandingPage() {
  return (
    <div className="landing-page">
      <a className="landing-skip" href="#main-content">
        Skip to content
      </a>

      <header className="landing-header">
        <a className="landing-brand" href="/" aria-label="Apex Trader home">
          <img alt="" height="243" src="/media/apex-trader.svg" width="1552" />
        </a>
        <nav className="landing-nav" aria-label="Apex Trader primary navigation">
          <a href="/storybook/">Component library</a>
          <a href="https://devsigner.xyz" target="_blank" rel="noopener noreferrer">
            Devsigner ↗
          </a>
          <a
            className="landing-button landing-button--primary"
            href="/demo"
            onClick={() => trackEvent('open_demo', { placement: 'header' })}
          >
            Open demo
          </a>
        </nav>
      </header>

      <main id="main-content">
        <section className="landing-section landing-opening" aria-labelledby="opening-title">
          <div className="landing-copy landing-copy--hero">
            <p className="landing-kicker">PRICE, ORDER FLOW AND LIQUIDITY - IN ONE VIEW</p>
            <h1 id="opening-title">See beyond the candles.</h1>
            <p className="landing-lede">
              Apex Trader connects price action with traded volume, liquidity and the tape, so you
              can understand how a move formed without switching tools.
            </p>
            <div className="landing-actions">
              <a
                className="landing-button landing-button--primary"
                href="/demo"
                onClick={() => trackEvent('open_demo', { placement: 'hero' })}
              >
                Open demo
              </a>
              <a
                className="landing-button landing-button--secondary"
                href="https://devsigner.xyz"
                target="_blank"
                rel="noopener noreferrer"
              >
                Visit devsigner.xyz
              </a>
            </div>
            <p className="landing-disclaimer">
              Personal portfolio demo by devsigner.xyz - for interface exploration, not live
              trading.
            </p>
          </div>

          <HeroModeCarousel />
        </section>

        <section
          className="landing-section landing-primitives-section"
          id="modes"
          aria-labelledby="modes-title"
        >
          <div className="landing-copy">
            <p className="landing-kicker">01 / SEE MORE THAN PRICE</p>
            <h2 id="modes-title">Choose the view that answers your question.</h2>
            <p className="landing-lede">
              Start with direction, drill into who traded at each price, then compare participation
              and liquidity without losing the session context.
            </p>
          </div>
          <DeferredMarketPrimitivesShowcase />
        </section>

        <aside className="landing-devsigner-banner" aria-labelledby="devsigner-banner-title">
          <div className="landing-devsigner-banner__copy landing-copy">
            <p className="landing-kicker">BUILT BY DEVSIGNER</p>
            <h2 id="devsigner-banner-title">Interfaces for products that deserve clarity.</h2>
            <p className="landing-lede">
              Explore more product experiments, systems and digital tools from the studio behind
              Apex Trader.
            </p>
          </div>
          <a
            className="landing-button landing-button--primary"
            href="https://devsigner.xyz"
            target="_blank"
            rel="noopener noreferrer"
          >
            Visit devsigner.xyz ↗
          </a>
        </aside>
      </main>

      <footer className="landing-footer">
        <div>
          <strong>APEX TRADER</strong>
          <span>See beyond the candle.</span>
        </div>
        <nav aria-label="Apex Trader footer navigation">
          <a href="/demo" onClick={() => trackEvent('open_demo', { placement: 'footer' })}>
            OPEN DEMO
          </a>
          <a href="https://devsigner.xyz" target="_blank" rel="noopener noreferrer">
            DEVSIGNER ↗
          </a>
        </nav>
      </footer>
    </div>
  )
}
