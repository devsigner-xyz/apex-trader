/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { playbackSpeeds } from '../hooks/useProfessionalPlayback.js'

const fixtureMarkets = [
  ['BTCUSDT', '7,391.62', '7,391.61', '7,391.63', '+0.30%', '5.1K'], ['ETHUSDT', '151.42', '151.41', '151.43', '-0.89%', '112K'],
  ['BNBUSDT', '15.88', '15.87', '15.89', '+0.43%', '47K'], ['XRPUSDT', '0.2251', '0.2250', '0.2252', '+1.12%', '2.4M'],
  ['ES', '3,146.25', '3,146.00', '3,146.50', '+0.38%', '1.1M'], ['NQ', '8,402.50', '8,402.25', '8,402.75', '+0.95%', '484K'],
  ['YM', '28,083', '28,082', '28,084', '+0.76%', '64K'], ['RTY', '1,624.1', '1,624.0', '1,624.2', '+0.26%', '129K'],
  ['CL', '55.42', '55.41', '55.43', '+2.39%', '211K'], ['GC', '1,472.6', '1,472.5', '1,472.7', '+2.09%', '191K'],
  ['SI', '17.05', '17.04', '17.06', '+1.82%', '63K'], ['ZN', "129'085", "129'080", "129'090", '-0.22%', '2.4M'],
  ['EURUSD', '1.1018', '1.1017', '1.1019', '+0.06%', '—'], ['GBPUSD', '1.2904', '1.2903', '1.2905', '+0.10%', '—'],
  ['USDJPY', '109.52', '109.51', '109.53', '-0.11%', '—'], ['AAPL', '66.04', '66.03', '66.05', '-0.63%', '47M'],
  ['MSFT', '151.38', '151.37', '151.39', '+0.43%', '23M'], ['NVDA', '5.40', '5.39', '5.41', '-0.98%', '99M'],
  ['AMD', '39.15', '39.14', '39.16', '+0.81%', '14M'], ['TSLA', '22.10', '22.09', '22.11', '+5.14%', '59M'],
  ['META', '202.00', '201.99', '202.01', '+0.75%', '14M'], ['AMZN', '89.08', '89.07', '89.09', '-0.57%', '36M'],
  ['GOOGL', '65.68', '65.67', '65.69', '+1.22%', '21M'], ['NFLX', '314.66', '314.65', '314.67', '-0.69%', '24M'],
  ['DAX', '13,236', '—', '—', '+0.59%', '43M'], ['VIX', '12.62', '—', '—', '-5.50%', '—'],
  ['QQQ', '205.58', '205.57', '205.59', '+0.35%', '33M'], ['SPY', '314.31', '314.30', '314.32', '+0.41%', '39M']
]

const activity = [
  ['04:02:18', 'LIMIT', 'BTCUSDT', 'BUY', '0.25', '7,380.50', 'WORKING', '—', 'CANCEL'],
  ['03:58:40', 'STOP', 'BTCUSDT', 'SELL', '0.25', '7,350.00', 'WORKING', '—', 'CANCEL'],
  ['03:42:11', 'MARKET', 'BTCUSDT', 'BUY', '0.25', '7,366.42', 'FILLED', '+$6.30', 'DETAILS'],
  ['02:17:06', 'LIMIT', 'BTCUSDT', 'SELL', '0.10', '7,412.18', 'FILLED', '+$4.58', 'DETAILS'],
  ['01:48:03', 'STOP', 'BTCUSDT', 'BUY', '0.10', '7,405.00', 'CANCELLED', '—', 'DETAILS']
]

function fmt(value, digits = 2) { return Number(value).toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits }) }
function clock(timestamp, ms = false) { return new Date(timestamp).toISOString().slice(11, ms ? 23 : 19) }

function Watchlist() {
  return <section className="pro-watchlist" aria-label="Demo watchlist"><header><strong>WATCHLIST</strong><select aria-label="Watchlist category"><option>Markets · DEMO</option></select></header><div className="watch-head"><span>SYM</span><span>LAST</span><span>BID</span><span>ASK</span><span>Δ%</span><span>VOL</span></div>{fixtureMarkets.map((row, index) => <button className={index === 0 ? 'selected' : ''} key={row[0]} type="button">{row.map((cell, i) => <span className={i === 4 ? (cell.startsWith('-') ? 'negative' : 'positive') : ''} key={i}>{cell}</span>)}</button>)}</section>
}

function sessionProfile(profile, min, max) {
  const bins = Array.from({ length: 25 }, (_, i) => ({ ask: 0, bid: 0, price: min + ((max - min) * i) / 24 }))
  for (const level of profile) {
    const index = Math.max(0, Math.min(24, Math.round(((level.price - min) / (max - min || 1)) * 24)))
    bins[index].ask += level.ask; bins[index].bid += level.bid
  }
  return bins
}

function MarketChart({ mode, view }) {
  const visible = mode === 'footprint' ? view.bars.slice(-8) : mode === 'step-profile' ? view.bars.slice(-7) : view.bars.slice(-34)
  const low = Math.min(...visible.map((bar) => bar.low)); const high = Math.max(...visible.map((bar) => bar.high)); const range = high - low || 1
  const y = (price) => 510 - ((price - low) / range) * 430
  const plotWidth = 910; const step = plotWidth / visible.length
  const profile = sessionProfile(view.profile, low, high); const maxProfile = Math.max(...profile.map((p) => p.ask + p.bid), 1)
  return <section className="market-chart"><header><span>O {fmt(view.current.open)} H {fmt(view.current.high)} L {fmt(view.current.low)} C {fmt(view.current.close)}</span><span>{mode === 'footprint' ? `Δ ${fmt(view.current.delta)} · V ${fmt(view.current.volume)}` : `VWAP ${fmt(view.current.vwap)} · POC ${fmt(view.current.poc)}`}</span></header><svg aria-label={`${mode} historical chart`} preserveAspectRatio="none" viewBox="0 0 1128 730">
    <rect width="1128" height="730" fill="#0b0f12" />
    {Array.from({ length: 10 }, (_, i) => <line className="gridline" key={`h${i}`} x1="0" x2="1128" y1={30 + i * 60} y2={30 + i * 60} />)}
    {Array.from({ length: 10 }, (_, i) => <line className="gridline faint" key={`v${i}`} x1={i * 97} x2={i * 97} y1="0" y2="730" />)}
    <text className="quiet" x="12" y="18">{mode === 'candles' ? 'CANDLES · VWAP · EMA20' : mode === 'footprint' ? 'BID × ASK CLUSTERS' : 'STEP PROFILE · 30M · BID × ASK · VA 70%'}</text><text className="quiet" x="900" y="18">SESSION VOLUME PROFILE</text>
    {mode === 'candles' && visible.map((bar, i) => { const x = 18 + i * step; const up = bar.close >= bar.open; return <g className={up ? 'up' : 'down'} key={bar.timestamp}><line x1={x} x2={x} y1={y(bar.high)} y2={y(bar.low)} /><rect x={x - 5} y={Math.min(y(bar.open), y(bar.close))} width="10" height={Math.max(2, Math.abs(y(bar.open) - y(bar.close)))} /></g> })}
    {mode === 'footprint' && visible.map((bar, i) => { const x = 14 + i * step; const levels = bar.levels.filter((l) => l.price >= low && l.price <= high); const max = Math.max(...levels.map((l) => l.ask + l.bid), 1); return <g key={bar.timestamp}>{levels.map((level) => { const yy = y(level.price); const intensity = Math.min(1, (level.ask + level.bid) / max); return <g key={level.price}><rect fill="#173e52" fillOpacity={0.45 + intensity * 0.55} x={x} y={yy - 4} width={step * .36} height="8"/><rect fill="#7a3540" fillOpacity={0.45 + intensity * .55} x={x + step * .36} y={yy - 4} width={step * .36} height="8"/></g>})}<text className={bar.delta >= 0 ? 'positive-fill' : 'negative-fill'} x={x} y={y(bar.high)-8}>Δ {fmt(bar.delta, 3)}</text></g> })}
    {mode === 'step-profile' && visible.map((bar, i) => { const x = 22 + i * step; const levels = bar.levels.filter((l) => l.price >= low && l.price <= high); const max = Math.max(...levels.map((l) => l.ask + l.bid), 1); return <g key={bar.timestamp}>{levels.map((level) => { const width = ((level.ask + level.bid) / max) * step * .72; return <rect fill={level.price === bar.poc ? '#d68b54' : '#315f76'} x={x + (step * .72 - width)/2} y={y(level.price)-2} width={width} height="4" key={level.price}/>})}<line className="profile-spine" x1={x+step*.36} x2={x+step*.36} y1={y(bar.high)} y2={y(bar.low)}/><text className={bar.delta >= 0 ? 'positive-fill' : 'negative-fill'} x={x} y={y(bar.low)+15}>Δ {fmt(bar.delta, 2)}</text></g> })}
    {profile.map((level, i) => { const total = level.ask + level.bid; const width = total/maxProfile*150; return <g key={i}><rect fill="#223e63" x={1065-width} y={y(level.price)-4} width={width*.48} height="8"/><rect fill="#315f76" x={1065-width*.52} y={y(level.price)-4} width={width*.52} height="8"/></g> })}
    <line className="poc-line" x1="0" x2="1072" y1={y(view.current.poc)} y2={y(view.current.poc)} /><line className="value-line" x1="0" x2="1072" y1={y(view.current.vah)} y2={y(view.current.vah)} /><line className="value-line" x1="0" x2="1072" y1={y(view.current.val)} y2={y(view.current.val)} />
    {visible.map((bar, i) => { const x = 18+i*step; const height = Math.max(2, bar.volume/Math.max(...visible.map((b)=>b.volume))*55); return <rect className={bar.close >= bar.open ? 'volume-up' : 'volume-down'} x={x-5} y={630-height} width={Math.max(8, step*.22)} height={height} key={`v${bar.timestamp}`}/> })}
    {visible.map((bar, i) => { const x = 18+i*step; const height = Math.abs(bar.delta)/Math.max(...visible.map((b)=>Math.abs(b.delta)),1)*25; return <rect className={bar.delta >= 0 ? 'volume-up' : 'volume-down'} x={x-5} y={bar.delta>=0?684-height:684} width={Math.max(8, step*.22)} height={height} key={`d${bar.timestamp}`}/> })}
    <text className="label" x="12" y="585">VOLUME</text><text className="label" x="12" y="665">CVD Δ · PER BAR</text>
  </svg></section>
}

function Dom({ orderbook, onPrice }) {
  const asks = [...orderbook.asks].reverse().slice(-21); const bids = orderbook.bids.slice(0, 21); const rows = [...asks.map((x)=>({...x,side:'ask'})), ...bids.map((x)=>({...x,side:'bid'}))]; const max = Math.max(...rows.map((r)=>r.amount),1)
  return <section className="dom"><header><strong>DOM</strong><span>BTC · 0.01 · x1</span></header><div className="dom-tools">LADDER&nbsp;&nbsp;AUTO&nbsp;&nbsp;D42&nbsp;&nbsp;CUM</div><div className="dom-head"><span>PRICE</span><span>Δ</span><span>SIZE</span><span>LAST</span></div>{rows.map((row,i)=><button className={`dom-row ${row.side}`} key={`${row.side}${row.price}`} onClick={()=>onPrice(row.price)} type="button"><span>{fmt(row.price)}</span><span>{i%3===0?(row.side==='bid'?'+':'-')+Math.round(row.amount*10):''}</span><span style={{backgroundSize:`${Math.max(8,row.amount/max*100)}% 90%`}}>{fmt(row.amount,3)}</span><span>{i%5===0?Math.round(row.amount*3):''}</span></button>)}<footer><span>BID {fmt(orderbook.bids[0]?.price)} ASK {fmt(orderbook.asks[0]?.price)}</span><span>Exact groups applied {orderbook.groupsApplied}</span></footer></section>
}

function TimeSales({ trades }) { return <section className="tape"><header><strong>TIME &amp; SALES</strong><span>BTC · HIST</span></header><div className="tape-head"><span>TIME</span><span>PRICE</span><span>SIZE</span><span>SIDE</span></div>{trades.slice(0,20).map((trade,i)=><button className={trade.side} key={`${trade.timestamp}-${i}`} type="button"><span>{clock(trade.timestamp,true)}</span><span>{fmt(trade.price)}</span><span>{fmt(trade.amount,4)}</span><span>{trade.side.toUpperCase()}</span></button>)}</section> }

function Execution({ price, setPrice, trades }) {
  const [side,setSide]=useState('buy'); const [qty,setQty]=useState('0.10'); const valid=Number(price)>0&&Number(qty)>0
  return <aside className="execution"><section className="ticket"><header><strong>EXECUTION</strong><span>BTCUSDT</span></header><div className="side-tabs"><button className={side==='buy'?'active buy':''} onClick={()=>setSide('buy')} type="button">BUY</button><button className={side==='sell'?'active sell':''} onClick={()=>setSide('sell')} type="button">SELL</button></div><label>ORDER TYPE<select><option>Limit</option><option>Market</option><option>Stop</option></select></label><label>LIMIT PRICE<div className="field"><input aria-label="Limit price" onChange={(e)=>setPrice(e.target.value)} value={price}/><span>USDT</span></div></label><label>TIME IN FORCE<select><option>Day</option><option>GTC</option><option>IOC</option></select></label><label>STOP LOSS<input defaultValue={price?fmt(Number(price)-25):''}/></label><label>TAKE PROFIT<input defaultValue={price?fmt(Number(price)+35):''}/></label><label>QUANTITY<input onChange={(e)=>setQty(e.target.value)} value={qty}/></label><button className={`submit ${side}`} disabled={!valid} type="button">PLACE {side.toUpperCase()} LIMIT</button><small>SIM fixture · no order is transmitted</small></section><TimeSales trades={trades}/></aside>
}

function Activity() { const [tab,setTab]=useState('POSITIONS'); const tabs=['POSITIONS  2','ORDERS  4','FILLS  12','ACTIVITY','ACCOUNT & RISK']; return <section className="activity"><header><div>{tabs.map((name)=><button aria-selected={tab===name.split('  ')[0]} onClick={()=>setTab(name.split('  ')[0])} role="tab" type="button" key={name}>{name}</button>)}</div><div><span>UPL +$6.30</span><span>RPL +$18.42</span><span>FEES $0.75</span></div></header><div className="activity-head">{['TIME','TYPE','SYMBOL','SIDE','QTY','PRICE','STATUS','PNL','ACCOUNT','ACTION'].map(x=><span key={x}>{x}</span>)}</div>{activity.map((row,i)=><div className="activity-row" key={i}>{row.map((cell,j)=><span className={cell.startsWith('+')?'positive':''} key={j}>{cell}</span>)}</div>)}</section> }

export default function ProfessionalTerminal({ mode, onMode, playback }) {
  const { playing, seek, session, setPlaying, setSpeed, speed, timestamp, view }=playback; const [price,setPrice]=useState(Number(view.current.close).toFixed(2)); const [settings,setSettings]=useState(false)
  useEffect(()=>{if(!settings)return undefined;const close=(event)=>{if(event.key==='Escape')setSettings(false)};window.addEventListener('keydown',close);return()=>window.removeEventListener('keydown',close)},[settings])
  const modeTitle={candles:'PRICE CHART WORKSTATION',footprint:'ORDER FLOW WORKSTATION','step-profile':'STEP PROFILE WORKSTATION'}[mode]
  const routeMode=(next)=>{onMode(next); history.pushState({},'',next==='candles'?'/price-chart':`/${next}`)}
  return <div className="pro-terminal"><header className="market-header"><strong>APEX TRADER</strong><b>{modeTitle}</b><span>BTCUSDT</span><strong>{fmt(view.current.close)}</strong><span className={view.change>=0?'positive':'negative'}>{view.change>=0?'+':''}{view.change.toFixed(2)}%</span><span>UTC · {clock(timestamp)}</span><span className="feed">● TARDIS HISTORICAL</span><span>SIM-APX-04</span><span>{clock(timestamp,true)}</span></header><nav className="workspace-toolbar"><select aria-label="Market"><option>BTCUSDT</option></select><select aria-label="Timeframe"><option>5 min</option></select><select aria-label="Chart mode" onChange={(e)=>routeMode(e.target.value)} value={mode}><option value="candles">Candles</option><option value="footprint">Footprint</option><option value="step-profile">Step Profile</option></select><select aria-label="Tick size"><option>0.01 USD</option></select><span>CVD&nbsp;&nbsp;|&nbsp;&nbsp;VWAP&nbsp;&nbsp;|&nbsp;&nbsp;Session VP&nbsp;&nbsp;|&nbsp;&nbsp;Imbalance 300%</span><button onClick={()=>setSettings(true)} type="button">Layout 01&nbsp;&nbsp;·&nbsp;&nbsp;Settings</button></nav><div className="terminal-workspace"><Watchlist/><div className="chart-stack"><MarketChart mode={mode} view={view}/><Activity/></div><Dom onPrice={(next)=>setPrice(Number(next).toFixed(2))} orderbook={view.orderbook}/><Execution price={price} setPrice={setPrice} trades={view.trades}/></div><div className="playback-dock"><button onClick={()=>setPlaying(!playing)} type="button">{playing?'PAUSE':'PLAY'}</button><select aria-label="Playback speed" onChange={(e)=>setSpeed(Number(e.target.value))} value={speed}>{playbackSpeeds.map(x=><option key={x} value={x}>{x}×</option>)}</select><input aria-label="Historical time" min={session.playbackStart} max={session.sessionEndExclusive-1} onChange={(e)=>seek(e.target.value)} step="1000" type="range" value={timestamp}/><output>{session.date} · {clock(timestamp)} UTC</output></div>{settings&&<div className="modal-backdrop" onMouseDown={()=>setSettings(false)} role="presentation"><section aria-label="Workspace settings" aria-modal="true" className="settings-modal" onMouseDown={(e)=>e.stopPropagation()} role="dialog"><header><strong>WORKSPACE SETTINGS</strong><button onClick={()=>setSettings(false)} type="button">×</button></header><label>DOM render rate<input disabled value="20 Hz render / exact event replay"/></label><label>Fixture account<input disabled value="SIM-APX-04"/></label><button onClick={()=>setSettings(false)} type="button">DONE</button></section></div>}</div>
}

ProfessionalTerminal.propTypes={mode:PropTypes.oneOf(['candles','footprint','step-profile']).isRequired,onMode:PropTypes.func.isRequired,playback:PropTypes.object.isRequired}
