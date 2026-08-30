import { useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { accountSummary, activityTables, activityTabs, riskLimits } from './fixtures.js'
import { activityTabId } from './formatters.js'

function cellTone(cell) {
  if (cell.startsWith('+') || cell === 'BUY') return 'positive'
  if (cell === 'SELL') return 'negative'
  if (cell === 'CANCEL' || cell === 'CLOSE') return 'action-danger'
  if (cell === 'DETAILS') return 'action-neutral'
  return ''
}

export default function Activity({ initialTab = 'POSITIONS' }) {
  const [tab, setTab] = useState(initialTab)
  const tabRefs = useRef(new Map())
  const table = activityTables[tab]
  const selectTab = (id) => {
    setTab(id)
    tabRefs.current.get(id)?.focus()
  }
  const handleTabKeyDown = (event, id) => {
    const index = activityTabs.findIndex(([tabId]) => tabId === id)
    let nextIndex = index

    if (event.key === 'ArrowRight') nextIndex = (index + 1) % activityTabs.length
    else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + activityTabs.length) % activityTabs.length
    else if (event.key === 'Home') nextIndex = 0
    else if (event.key === 'End') nextIndex = activityTabs.length - 1
    else return

    event.preventDefault()
    selectTab(activityTabs[nextIndex][0])
  }
  return (
    <section aria-label="Orders and positions" className="activity">
      <header>
        <div aria-label="Activity views" role="tablist">
          {activityTabs.map(([id, label]) => (
            <button
              aria-controls="activity-panel"
              aria-selected={tab === id}
              id={activityTabId(id)}
              key={id}
              onClick={() => setTab(id)}
              onKeyDown={(event) => handleTabKeyDown(event, id)}
              ref={(node) => {
                if (node) tabRefs.current.set(id, node)
                else tabRefs.current.delete(id)
              }}
              role="tab"
              tabIndex={tab === id ? 0 : -1}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
      </header>
      <div
        aria-labelledby={activityTabId(tab)}
        aria-live="polite"
        id="activity-panel"
        role="tabpanel"
      >
        {tab === 'ACCOUNT & RISK' ? (
          <div className="account-risk-view">
            <div className="account-summary">
              <div className="account-summary-heading">
                <span>DEMO-001</span>
                <span className="fixture-badge">SIMULATED ACCOUNT</span>
              </div>
              <div className="account-metrics">
                {accountSummary.map(({ label, tone, value }) => (
                  <div className="account-metric" key={label}>
                    <span>{label}</span>
                    <strong className={tone ?? ''}>{value}</strong>
                  </div>
                ))}
              </div>
            </div>
            <div className="risk-summary">
              <div className="risk-summary-heading">
                <span>SESSION RISK</span>
                <strong>WITHIN LIMITS</strong>
              </div>
              <div className="risk-limits">
                {riskLimits.map(({ detail, label, usage }) => (
                  <div className="risk-limit" key={label}>
                    <div>
                      <span>{label}</span>
                      <strong>{detail}</strong>
                    </div>
                    <span
                      aria-label={`${label} ${usage}% used`}
                      aria-valuemax="100"
                      aria-valuemin="0"
                      aria-valuenow={usage}
                      className="risk-meter"
                      role="progressbar"
                    >
                      <span style={{ width: `${usage}%` }} />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className={`activity-table activity-table--${tab.toLowerCase()}`}>
            <div className="activity-head" style={{ '--activity-columns': table.grid }}>
              {table.columns.map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>
            {table.rows.map((row, index) => (
              <div
                className="activity-row"
                key={`${tab}-${index}`}
                style={{ '--activity-columns': table.grid }}
              >
                {row.map((cell, cellIndex) => (
                  <span className={cellTone(cell)} key={cellIndex}>
                    {cell}
                  </span>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

Activity.propTypes = {
  initialTab: PropTypes.oneOf(activityTabs.map(([id]) => id))
}
