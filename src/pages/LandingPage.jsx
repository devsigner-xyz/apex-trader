import DeferredMarketPrimitivesShowcase from '../components/landing/DeferredMarketPrimitivesShowcase.jsx'
import HeroModeCarousel from '../components/landing/HeroModeCarousel.jsx'

const metrics = [
  ['6', 'COMPLEMENTARY MARKET VIEWS'],
  ['1', 'SHARED MARKET CLOCK'],
  ['24 HOURS', 'CONTINUOUS BTCUSDT SESSION'],
  ['420,562', 'RECORDED MARKET TRADES']
]

const callouts = [
  'COMPARE THREE CHART MODES',
  'INSPECT VOLUME AT PRICE',
  'READ MARKET DEPTH',
  'FOLLOW EVERY EXECUTION'
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
          <a href="#modes">Market views</a>
          <a href="#session">Session</a>
          <a href="#workspace">Workspace</a>
          <a href="/storybook/">Component library</a>
          <a href="https://devsigner.xyz" target="_blank" rel="noopener noreferrer">
            Devsigner ↗
          </a>
          <a className="landing-button landing-button--primary" href="/demo">
            Open workspace
          </a>
        </nav>
      </header>

      <main id="main-content">
        <section className="landing-section landing-opening" aria-labelledby="opening-title">
          <div className="landing-copy landing-copy--hero">
            <p className="landing-kicker">PRICE, ORDER FLOW AND LIQUIDITY — IN ONE VIEW</p>
            <h1 id="opening-title">See what moved the market, not just where it closed.</h1>
            <p className="landing-lede">
              Apex Trader connects price action with traded volume, liquidity and the tape, so you
              can understand how a move formed without switching tools.
            </p>
            <div className="landing-actions">
              <a className="landing-button landing-button--primary" href="/demo">
                Open workspace
              </a>
              <a className="landing-button landing-button--secondary" href="#modes">
                Compare market views
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
            <p className="landing-kicker">01 / SEE MORE THAN PRICE</p>
            <h2 id="modes-title">Choose the view that answers your question.</h2>
            <p className="landing-lede">
              Start with direction, drill into who traded at each price, then compare participation
              and liquidity without losing the session context.
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
            <p className="landing-kicker">02 / KEEP EVERY VIEW IN CONTEXT</p>
            <h2 id="session-title">One market moment, seen from every angle.</h2>
            <p className="landing-lede">
              Switch between charts, depth and tape without comparing unrelated snapshots. Every
              surface stays aligned to the same point in the session.
            </p>
          </div>

          <div className="landing-session-evidence" aria-labelledby="evidence-title">
            <div className="landing-copy">
              <p className="landing-kicker">03 / EXPLORE A COMPLETE SESSION</p>
              <h3 id="evidence-title">Follow the session, not a highlight.</h3>
              <p className="landing-lede">
                Move through a full 24-hour BTCUSDT session and switch from price action to order
                flow and execution detail without losing your place.
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
            <p className="landing-kicker">04 / WORK WITHOUT LOSING CONTEXT</p>
            <h2 id="workspace-title">Move from overview to execution detail.</h2>
            <p className="landing-lede">
              Pan through price, change timeframe, inspect volume at price, read depth and follow
              the tape from one focused workspace.
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
              <h2>Ready to read the move differently?</h2>
              <p className="landing-lede">
                Open Apex Trader and explore the same session through Candles, Footprint and Step
                Profile.
              </p>
            </div>
            <div className="landing-actions">
              <a className="landing-button landing-button--primary" href="/demo">
                Open workspace
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
          <a href="/demo">OPEN WORKSPACE</a>
          <a href="https://devsigner.xyz" target="_blank" rel="noopener noreferrer">
            DEVSIGNER ↗
          </a>
        </nav>
      </footer>
    </div>
  )
}
