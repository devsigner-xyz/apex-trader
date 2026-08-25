import { useState } from 'react'
import { activityRows, activityTabs } from './fixtures.js'
import { activityTabId } from './formatters.js'

export default function Activity() {
  const [tab, setTab] = useState('POSITIONS')
  const rows = activityRows[tab]
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
              role="tab"
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
        <div>
          <span className="fixture-badge">DEMO DATA</span>
          <span>UPL +$6.30</span>
          <span>RPL +$18.42</span>
          <span>FEES $0.75</span>
        </div>
      </header>
      <div
        aria-labelledby={activityTabId(tab)}
        aria-live="polite"
        id="activity-panel"
        role="tabpanel"
      >
        <div className="activity-head">
          {[
            'TIME',
            'TYPE',
            'SYMBOL',
            'SIDE',
            'QTY',
            'PRICE',
            'STATUS',
            'PNL',
            'ACCOUNT',
            'ACTION'
          ].map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
        {rows.map((row, index) => (
          <div className="activity-row" key={`${tab}-${index}`}>
            {row.map((cell, cellIndex) => (
              <span className={cell.startsWith('+') ? 'positive' : ''} key={cellIndex}>
                {cell}
              </span>
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}
