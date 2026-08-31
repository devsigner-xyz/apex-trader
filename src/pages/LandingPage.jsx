import DeferredMarketPrimitivesShowcase from '../components/landing/DeferredMarketPrimitivesShowcase.jsx'
import HeroModeCarousel from '../components/landing/HeroModeCarousel.jsx'

const metrics = [
  ['6', 'ISOLATED MARKET SURFACES'],
  ['1', 'SYNCHRONIZED CLOCK'],
  ['24 HOURS', 'BTCUSDT SESSION'],
  ['420,562', 'REAL TRADES']
]

const callouts = [
  'CHANGE PERSPECTIVE',
  'INSPECT PRICE',
  'FOLLOW THE TAPE',
  'KEEP THE SESSION ALIGNED'
]

export default function LandingPage() {
  return (
    <div className="landing-page">
      <a className="landing-skip" href="#main-content">
        Skip to content
      </a>

      <header className="landing-header">
        <a className="landing-brand" href="/" aria-label="Apex Trader home">
          APEX TRADER
        </a>
        <nav className="landing-nav" aria-label="Apex Trader primary navigation">
          <a href="#modes">Modes</a>
          <a href="#session">Session</a>
          <a href="#workspace">Workspace</a>
          <a href="/storybook/">Components</a>
          <a href="https://devsigner.xyz" target="_blank" rel="noopener noreferrer">
            Devsigner ↗
          </a>
          <a className="landing-button landing-button--primary" href="/demo">
            Open demo
          </a>
        </nav>
      </header>

      <main id="main-content">
        <section className="landing-section landing-opening" aria-labelledby="opening-title">
          <div className="landing-copy landing-copy--hero">
            <p className="landing-kicker">A DIFFERENT WAY TO READ A SESSION</p>
            <h1 id="opening-title">Candles show the result. They hide the behavior.</h1>
            <p className="landing-lede">
              Apex Trader brings price, executed volume, order flow, depth and tape into one
              synchronized market view.
            </p>
            <div className="landing-actions">
              <a className="landing-button landing-button--primary" href="/demo">
                Launch demo
              </a>
              <a className="landing-button landing-button--secondary" href="#modes">
                Explore market primitives
              </a>
            </div>
          </div>

          <HeroModeCarousel />
        </section>

        <section
          className="landing-section landing-primitives-section"
          id="modes"
          aria-labelledby="modes-title"
        >
          <div className="landing-copy">
            <p className="landing-kicker">01 / MARKET PRIMITIVES</p>
            <h2 id="modes-title">Read one signal at a time.</h2>
            <p className="landing-lede">
              Each scene isolates one chart or market surface. The values update deterministically,
              but the terminal controls and surrounding panels stay out of the way.
            </p>
          </div>
          <DeferredMarketPrimitivesShowcase />
        </section>

        <section
          className="landing-section landing-section--panel landing-session"
          id="session"
          aria-labelledby="session-title"
        >
          <div className="landing-copy">
            <p className="landing-kicker">02 / ONE CLOCK</p>
            <h2 id="session-title">Every surface advances together.</h2>
            <p className="landing-lede">
              Candles, order flow, visible-range volume, depth and recent executions all describe
              the same deterministic moment rather than unrelated decorative examples.
            </p>
          </div>

          <div className="landing-session-evidence" aria-labelledby="evidence-title">
            <div className="landing-copy">
              <p className="landing-kicker">03 / SESSION EVIDENCE</p>
              <h3 id="evidence-title">A complete day, kept in context.</h3>
              <p className="landing-lede">
                Explore one 24-hour BTCUSDT session across every mode and synchronized surface.
              </p>
            </div>
            <dl className="landing-metrics">
              {metrics.map(([value, label]) => (
                <div key={label}>
                  <dt>{value}</dt>
                  <dd>{label}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section
          className="landing-section landing-workspace"
          id="workspace"
          aria-labelledby="workspace-title"
        >
          <div className="landing-copy">
            <p className="landing-kicker">04 / THE WORKSPACE</p>
            <h2 id="workspace-title">Move from summary to market structure.</h2>
            <p className="landing-lede">
              Pan, zoom, change timeframe, inspect depth, follow the tape and compare chart modes
              inside one focused workspace.
            </p>
          </div>

          <ul className="landing-callouts">
            {callouts.map((callout) => (
              <li key={callout}>{callout}</li>
            ))}
          </ul>

          <figure className="landing-product-reveal">
            <img
              src="/media/full-terminal.png"
              alt="The complete Apex Trader workspace with market list, Footprint chart, DOM, execution controls and Time and Sales."
              width="1600"
              height="900"
              loading="lazy"
              decoding="async"
            />
          </figure>

          <div className="landing-closing">
            <div className="landing-copy">
              <h2>Read the session beyond the candle.</h2>
              <p className="landing-lede">
                Open Apex Trader and explore the same market history from three synchronized
                perspectives.
              </p>
            </div>
            <div className="landing-actions">
              <a className="landing-button landing-button--primary" href="/demo">
                Open demo
              </a>
              <a
                className="landing-button landing-button--secondary"
                href="https://devsigner.xyz"
                target="_blank"
                rel="noopener noreferrer"
              >
                Devsigner ↗
              </a>
            </div>
          </div>
        </section>

        <aside className="landing-endorsement" aria-label="Apex Trader case study endorsement">
          <p>
            Apex Trader is designed and built by Devsigner, and presented as a public interactive
            product case study.
          </p>
          <a href="https://devsigner.xyz" target="_blank" rel="noopener noreferrer">
            VISIT DEVSIGNER ↗
          </a>
        </aside>
      </main>

      <footer className="landing-footer">
        <div>
          <strong>APEX TRADER</strong>
          <span>See beyond the candle.</span>
        </div>
        <nav aria-label="Apex Trader footer navigation">
          <a href="/demo">OPEN DEMO</a>
          <a href="https://devsigner.xyz" target="_blank" rel="noopener noreferrer">
            DEVSIGNER ↗
          </a>
        </nav>
      </footer>
    </div>
  )
}
