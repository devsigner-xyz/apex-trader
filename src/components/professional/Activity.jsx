import { useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import {
  accountDetails,
  accountSummary,
  activityTables,
  activityTabs,
  riskLimits
} from './fixtures.js'
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
  const [detailsOpen, setDetailsOpen] = useState(false)
  const tabRefs = useRef(new Map())
  const detailsDialogRef = useRef(null)
  const detailsTriggerRef = useRef(null)
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
  const closeDetails = () => {
    setDetailsOpen(false)
    requestAnimationFrame(() => detailsTriggerRef.current?.focus())
  }

  useEffect(() => {
    if (!detailsOpen) return undefined
    const dialog = detailsDialogRef.current
    const focusable = [...(dialog?.querySelectorAll('button, [href], input, select, textarea') ?? [])]
    focusable[0]?.focus()

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeDetails()
        return
      }
      if (event.key !== 'Tab' || focusable.length === 0) return
      const first = focusable[0]
      const last = focusable.at(-1)
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [detailsOpen])
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
            <section aria-label="Account performance" className="account-summary">
              <div className="account-summary-heading">
                <span>ACCOUNT · DEMO-001</span>
                <span className="fixture-badge">SIMULATED ACCOUNT</span>
              </div>
              <div className="account-performance-summary">
                <div className="account-primary-metric">
                  <span>{accountSummary[0].label}</span>
                  <strong className={accountSummary[0].tone}>{accountSummary[0].value}</strong>
                </div>
                <div className="account-metrics">
                  {accountSummary.slice(1, 4).map(({ label, tone, value }) => (
                    <div className="account-metric" key={label}>
                      <span>{label}</span>
                      <strong className={tone ?? ''}>{value}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </section>
            <section aria-label="Session risk summary" className="risk-summary">
              <div className="risk-summary-heading">
                <span>SESSION RISK</span>
                <strong>WITHIN LIMITS</strong>
              </div>
              <div className="risk-limits risk-limits--summary">
                {riskLimits.slice(0, 2).map(({ detail, label, usage }) => (
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
              <button
                className="account-details-trigger"
                onClick={() => setDetailsOpen(true)}
                ref={detailsTriggerRef}
                type="button"
              >
                VIEW MORE
              </button>
            </section>
            {detailsOpen && (
              <div
                className="account-details-backdrop"
                onMouseDown={(event) => {
                  if (event.currentTarget === event.target) closeDetails()
                }}
              >
                <section
                  aria-labelledby="account-details-title"
                  aria-modal="true"
                  className="account-details-dialog"
                  ref={detailsDialogRef}
                  role="dialog"
                >
                  <header>
                    <div>
                      <span>DEMO-001 · SIMULATED ACCOUNT</span>
                      <h2 id="account-details-title">ACCOUNT &amp; RISK DETAILS</h2>
                    </div>
                    <button aria-label="Close account and risk details" onClick={closeDetails} type="button">
                      CLOSE
                    </button>
                  </header>
                  <div className="account-details-content">
                    <section aria-labelledby="account-details-financials">
                      <h3 id="account-details-financials">ACCOUNT SNAPSHOT</h3>
                      <div className="account-details-grid">
                        {accountDetails.map(({ label, value }) => (
                          <div key={label}>
                            <span>{label}</span>
                            <strong>{value}</strong>
                          </div>
                        ))}
                        {accountSummary.map(({ label, tone, value }) => (
                          <div key={label}>
                            <span>{label}</span>
                            <strong className={tone ?? ''}>{value}</strong>
                          </div>
                        ))}
                      </div>
                    </section>
                    <section aria-labelledby="account-details-risk">
                      <div className="account-details-section-heading">
                        <h3 id="account-details-risk">SESSION LIMITS</h3>
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
                              aria-label={`${label} ${usage}% used in details`}
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
                    </section>
                  </div>
                </section>
              </div>
            )}
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
