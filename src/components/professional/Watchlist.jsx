import { useEffect, useMemo, useRef, useState } from 'react'
import { Search as SearchIcon, Settings as SettingsIcon } from 'lucide-react'
import { usePersistentState } from '../../hooks/usePersistentState.js'
import { normalizeWatchlistColumns } from '../../services/professionalTerminalPersistence.js'
import { storageKeys, watchlistColumns } from './config.js'
import { fixtureMarkets } from './fixtures.js'

export default function Watchlist() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [marketQuery, setMarketQuery] = useState('')
  const [optionalColumns, setOptionalColumns] = usePersistentState(
    storageKeys.watchlistColumns,
    normalizeWatchlistColumns
  )
  const watchlistRef = useRef(null)
  const visibleColumns = watchlistColumns.filter(
    ({ id, required }) => required || optionalColumns.includes(id)
  )
  const gridTemplateColumns = visibleColumns.map(({ width }) => width).join(' ')
  const filteredMarkets = useMemo(() => {
    const query = marketQuery.trim().toUpperCase()
    if (!query) return fixtureMarkets
    return fixtureMarkets.filter(([symbol]) => symbol.includes(query))
  }, [marketQuery])

  useEffect(() => {
    if (!settingsOpen) return undefined
    const close = (event) => {
      if (event.type === 'keydown' && event.key !== 'Escape') return
      if (event.type === 'pointerdown' && watchlistRef.current?.contains(event.target)) return
      setSettingsOpen(false)
    }
    window.addEventListener('keydown', close)
    window.addEventListener('pointerdown', close)
    return () => {
      window.removeEventListener('keydown', close)
      window.removeEventListener('pointerdown', close)
    }
  }, [settingsOpen])

  return (
    <section className="pro-watchlist" aria-label="Markets" ref={watchlistRef}>
      <div className="markets-toolbar">
        <label className="markets-search">
          <SearchIcon aria-hidden="true" size={15} strokeWidth={2} />
          <input
            aria-label="Search markets"
            onChange={(event) => setMarketQuery(event.target.value)}
            placeholder="Search symbol"
            spellCheck="false"
            type="search"
            value={marketQuery}
          />
        </label>
        <button
          aria-controls="markets-settings-panel"
          aria-expanded={settingsOpen}
          aria-label="Markets settings"
          className="watch-settings-button"
          onClick={() => setSettingsOpen((current) => !current)}
          title="Markets settings"
          type="button"
        >
          <SettingsIcon aria-hidden="true" size={16} strokeWidth={2} />
        </button>
      </div>
      {settingsOpen && (
        <aside
          aria-label="Markets columns"
          className="watch-settings-popover"
          id="markets-settings-panel"
          role="dialog"
        >
          <strong>VISIBLE COLUMNS</strong>
          <div className="watch-column-options">
            {watchlistColumns.map(({ id, label, required }) => (
              <label key={id}>
                <input
                  aria-label={`Show ${label} column`}
                  checked={required || optionalColumns.includes(id)}
                  disabled={required}
                  onChange={() => {
                    if (required) return
                    setOptionalColumns((current) =>
                      current.includes(id)
                        ? current.filter((column) => column !== id)
                        : [...current, id]
                    )
                  }}
                  type="checkbox"
                />
                <span>{label}</span>
                {required && <small>ALWAYS</small>}
              </label>
            ))}
          </div>
        </aside>
      )}
      <div className="watch-head" style={{ gridTemplateColumns }}>
        {visibleColumns.map(({ id, label }) => (
          <span className={`watch-cell watch-cell--${id}`} key={id}>
            {label}
          </span>
        ))}
      </div>
      <div className="markets-scroll" aria-label="Market symbols">
        {filteredMarkets.map((row) => (
          <button
            className={`market-row${row[0] === 'BTCUSDT' ? ' selected' : ''}`}
            key={row[0]}
            style={{ gridTemplateColumns }}
            type="button"
          >
            {visibleColumns.map(({ id, sourceIndex }) => {
              const cell = row[sourceIndex]
              return (
                <span
                  className={`watch-cell watch-cell--${id}${
                    id === 'change' ? ` ${cell.startsWith('-') ? 'negative' : 'positive'}` : ''
                  }`}
                  key={id}
                >
                  {cell}
                </span>
              )
            })}
          </button>
        ))}
        {filteredMarkets.length === 0 && (
          <p className="markets-empty" role="status">
            No markets found
          </p>
        )}
      </div>
    </section>
  )
}
