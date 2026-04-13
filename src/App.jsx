import { useState, useEffect } from 'react'
import logo from '/elpriset_logo_trans.png'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import './App.css'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip)

// ── Constants ──────────────────────────────────────────────────────────────

const APPLIANCES = [
  { id: 'shower',    emoji: '🚿', name: 'En dusch',             kwh: 6,     desc: '10 min, ~6 kWh' },
  { id: 'bath',      emoji: '🛁', name: 'Ett bad',              kwh: 7.5,   desc: '200 liter, ~7,5 kWh' },
  { id: 'pizza',     emoji: '🍕', name: 'Baka en pizza',        kwh: 1.1,   desc: 'Ugn 30 min, ~1,1 kWh' },
  { id: 'kettle',    emoji: '💧', name: 'Koka 1 liter vatten',  kwh: 0.12,  desc: 'Varmplatta 4 min' },
  { id: 'heater',    emoji: '🌡️', name: 'Värmare dygnet runt',  kwh: 24,    desc: '1000W × 24h = 24 kWh' },
  { id: 'ev',        emoji: '🚗', name: 'Ladda elbilen',        kwh: 45,    desc: 'Nissan Leaf 10–80%' },
  { id: 'laundry',   emoji: '👕', name: 'En tvättmaskin',       kwh: 0.8,   desc: 'Genomsnitt, ~0,8 kWh' },
  { id: 'tv',        emoji: '📺', name: 'Titta på TV (1h)',     kwh: 0.06,  desc: 'Genomsnitt, ~0,06 kWh' },
  { id: 'fridge',    emoji: '🧊', name: 'Kylskåp per dag',      kwh: 0.44,  desc: 'Genomsnitt, ~0,44 kWh' },
  { id: 'vacuum',    emoji: '🌀', name: 'Dammsug 10 min',       kwh: 0.33,  desc: 'Dammsugare, ~0,33 kWh' },
  { id: 'hairdryer', emoji: '💨', name: 'Hårtork 10 min',       kwh: 0.33,  desc: 'Hårtork, ~0,33 kWh' },
  { id: 'phone',     emoji: '📱', name: 'Ladda mobilen',        kwh: 0.005, desc: 'Genomsnitt, ~0,005 kWh' },
]

const REGIONS = [
  { code: 'SE1', city: 'Luleå',     label: 'Norra' },
  { code: 'SE2', city: 'Sundsvall', label: 'N. Mellansverige' },
  { code: 'SE3', city: 'Stockholm', label: 'S. Mellansverige' },
  { code: 'SE4', city: 'Malmö',     label: 'Södra' },
]

// ── Helpers ────────────────────────────────────────────────────────────────

function formatApiDate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return { year: y, monthDay: `${m}-${d}` }
}

async function fetchPrices(region, date) {
  const { year, monthDay } = formatApiDate(date)
  const url = `https://www.elprisetjustnu.se/api/v1/prices/${year}/${monthDay}_${region}.json`
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

function sekToOre(sek) {
  return Math.round(sek * 100)
}

function getPriceLevel(priceOre, allPricesOre) {
  const sorted = [...allPricesOre].sort((a, b) => a - b)
  const lowThresh  = sorted[Math.floor(sorted.length * 0.33)]
  const highThresh = sorted[Math.floor(sorted.length * 0.66)]
  if (priceOre <= lowThresh)  return 'low'
  if (priceOre <= highThresh) return 'medium'
  return 'high'
}

const LEVEL_LABEL = { low: 'Lågt pris', medium: 'Normalt pris', high: 'Högt pris' }

// ── Sub-components ─────────────────────────────────────────────────────────

function RegionBar({ region, onSwitch }) {
  return (
    <div className="region-bar">
      {REGIONS.map(r => (
        <button
          key={r.code}
          className={`region-btn ${r.code === region ? 'active' : ''}`}
          onClick={() => onSwitch(r.code)}
        >
          <span className="region-code">{r.code}</span>
          <span className="region-city">{r.city}</span>
        </button>
      ))}
    </div>
  )
}

function HeroCard({ data, day }) {
  if (!data || data.length === 0) {
    return (
      <div className="hero-card">
        <div className="no-data-state">
          <strong>Ingen prisdata tillgänglig</strong>
        </div>
      </div>
    )
  }

  const currentHour = new Date().getHours()
  const allOre = data.map(e => sekToOre(e.SEK_per_kWh))

  const entry = day === 'today'
    ? data.find(e => new Date(e.time_start).getHours() === currentHour) ?? data[data.length - 1]
    : data[0]

  const ore   = sekToOre(entry.SEK_per_kWh)
  const level = getPriceLevel(ore, allOre)
  const h     = new Date(entry.time_start).getHours()
  const timeStr = day === 'today'
    ? `kl. ${String(currentHour).padStart(2, '0')}:00–${String(currentHour + 1).padStart(2, '0')}:00`
    : `${String(h).padStart(2, '0')}:00–${String(h + 1).padStart(2, '0')}:00 (lägsta)`

  return (
    <div className="hero-card">
      <div className="hero-eyebrow">
        {day === 'today' ? 'Aktuellt spotpris' : 'Imorgon — lägsta timme'}
      </div>
      <div className="hero-price-row">
        <div className="hero-price">{ore}</div>
        <div className="hero-unit">öre/kWh</div>
      </div>
      <div className="hero-time">{timeStr}</div>
      <div className={`hero-badge ${level}`}>
        <span className="badge-dot" />
        {LEVEL_LABEL[level]}
      </div>
    </div>
  )
}

function DayToggle({ day, hasTomorrow, onSwitch }) {
  return (
    <div className="day-toggle">
      <button
        className={`day-btn ${day === 'today' ? 'active' : ''}`}
        onClick={() => onSwitch('today')}
      >
        Idag
      </button>
      <button
        className={`day-btn ${day === 'tomorrow' ? 'active' : ''}`}
        disabled={!hasTomorrow}
        onClick={() => hasTomorrow && onSwitch('tomorrow')}
      >
        Imorgon {!hasTomorrow && '(ej tillgänglig)'}
      </button>
    </div>
  )
}

const CHART_OPTIONS = {
  responsive: true,
  maintainAspectRatio: true,
  animation: { duration: 300 },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#0c1a0f',
      borderColor: 'rgba(80, 155, 100, 0.22)',
      borderWidth: 1,
      titleColor: '#5d8a67',
      bodyColor: '#deeee2',
      bodyFont:  { family: "'IBM Plex Mono'", size: 13, weight: '500' },
      titleFont: { family: "'IBM Plex Mono'", size: 11 },
      padding: 10,
      callbacks: {
        title: items => `kl. ${String(items[0].label).padStart(2, '0')}:00`,
        label: item  => `${item.raw} öre/kWh`,
      },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      border: { display: false },
      ticks: {
        color: '#324939',
        font: { family: "'IBM Plex Mono'", size: 10 },
        maxRotation: 0,
        maxTicksLimit: 13,
      },
    },
    y: {
      grid: { color: 'rgba(80, 155, 100, 0.06)' },
      border: { display: false },
      ticks: {
        color: '#324939',
        font: { family: "'IBM Plex Mono'", size: 10 },
        maxTicksLimit: 5,
      },
    },
  },
}

function PriceChart({ data, day }) {
  if (!data || data.length === 0) return null

  const currentHour = new Date().getHours()
  const allOre = data.map(e => sekToOre(e.SEK_per_kWh))
  const sorted = [...allOre].sort((a, b) => a - b)
  const lowThresh  = sorted[Math.floor(sorted.length * 0.33)]
  const highThresh = sorted[Math.floor(sorted.length * 0.66)]

  const labels = data.map(e => new Date(e.time_start).getHours())

  const bgColors = allOre.map((ore, i) => {
    const isCurrent = day === 'today' && new Date(data[i].time_start).getHours() === currentHour
    if (isCurrent)         return 'rgba(238, 185, 43, 0.88)'
    if (ore <= lowThresh)  return 'rgba(74, 222, 128, 0.5)'
    if (ore <= highThresh) return 'rgba(238, 185, 43, 0.45)'
    return                        'rgba(251, 115, 64, 0.6)'
  })

  const borderColors = allOre.map((ore, i) => {
    const isCurrent = day === 'today' && new Date(data[i].time_start).getHours() === currentHour
    if (isCurrent)         return '#EEB92B'
    if (ore <= lowThresh)  return 'rgba(74, 222, 128, 0.75)'
    if (ore <= highThresh) return 'rgba(238, 185, 43, 0.65)'
    return                        'rgba(251, 115, 64, 0.8)'
  })

  const chartData = {
    labels,
    datasets: [{
      data: allOre,
      backgroundColor: bgColors,
      borderColor: borderColors,
      borderWidth: 1,
      borderRadius: 3,
      borderSkipped: false,
    }],
  }

  return (
    <div className="chart-card">
      <div className="section-header">
        <h2 className="section-label">Timpriser</h2>
        <div className="chart-legend">
          <span className="legend-item">
            <span className="legend-dot" style={{ background: 'var(--price-low)' }} />
            Lågt
          </span>
          <span className="legend-item">
            <span className="legend-dot" style={{ background: 'var(--price-mid)' }} />
            Normalt
          </span>
          <span className="legend-item">
            <span className="legend-dot" style={{ background: 'var(--price-high)' }} />
            Högt
          </span>
        </div>
      </div>
      <Bar data={chartData} options={CHART_OPTIONS} />
    </div>
  )
}

// ── Cost calculator ────────────────────────────────────────────────────────

function formatKr(kr) {
  if (kr < 0.005) return '<0,01 kr'
  return new Intl.NumberFormat('sv-SE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(kr) + ' kr'
}

function CostCards({ todayData }) {
  const [expanded, setExpanded] = useState(false)

  if (!todayData || todayData.length === 0) return null

  const allOre      = todayData.map(e => sekToOre(e.SEK_per_kWh))
  const currentHour = new Date().getHours()
  const currentEntry = todayData.find(e => new Date(e.time_start).getHours() === currentHour)
    ?? todayData[todayData.length - 1]
  const currentOre = sekToOre(currentEntry.SEK_per_kWh)
  const minOre     = Math.min(...allOre)
  const maxOre     = Math.max(...allOre)

  const visible = expanded ? APPLIANCES : APPLIANCES.slice(0, 4)

  return (
    <div className="cost-section">
      <h2 className="cost-title">Med elpriset idag kostar…</h2>
      <div className="cost-list">
        {visible.map(({ id, emoji, name, kwh }) => {
          const cost    = kwh * currentOre / 100
          const minCost = kwh * minOre / 100
          const maxCost = kwh * maxOre / 100
          return (
            <div key={id} className="cost-row">
              <div className="cost-left">
                <span className="cost-emoji">{emoji}</span>
                <div className="cost-info">
                  <div className="cost-name">{name}</div>
                  <div className="cost-range">
                    <span className="cost-cheap">↓ {formatKr(minCost)}</span>
                    <span className="cost-pricey">↑ {formatKr(maxCost)}</span>
                  </div>
                </div>
              </div>
              <div className="cost-price">{formatKr(cost)}</div>
            </div>
          )
        })}
        <button className="cost-expand-btn" onClick={() => setExpanded(v => !v)}>
          {expanded
            ? 'Visa mindre'
            : `Visa ${APPLIANCES.length - 4} till`}
        </button>
      </div>
    </div>
  )
}

// ── FAQ ────────────────────────────────────────────────────────────────────

const FAQ_ITEMS = [
  {
    q: 'Vad är spotpris el?',
    a: 'Spotpriset är det rörliga elpriset som sätts timme för timme på den nordiska elbörsen Nord Pool. Priset styrs av utbud och efterfrågan och varierar kraftigt beroende på väder, förbrukning och tillgång på el i Norden.',
  },
  {
    q: 'Hur sätts elpriset timme för timme?',
    a: 'Varje dag klockan 12–13 publicerar Nord Pool priserna för kommande dygn — ett pris per timme. Det är dessa priser du ser på Elpriset.se. Priserna för morgondagen brukar alltså finnas tillgängliga redan på eftermiddagen.',
  },
  {
    q: 'Vad är de svenska elområdena SE1–SE4?',
    a: 'Sverige är uppdelat i fyra elområden: SE1 (Luleå), SE2 (Sundsvall), SE3 (Stockholm) och SE4 (Malmö). Varje område har sitt eget spotpris beroende på lokal produktion och kapacitet i elnätet.',
  },
  {
    q: 'Varför skiljer sig priset mellan elområden?',
    a: 'Flaskhalsarna i stamnätet gör att el inte alltid kan transporteras fritt mellan norr och söder. I SE1 och SE2 produceras mycket vattenkraft, vilket ofta ger lägre priser. I SE3 och SE4 är förbrukningen hög och beroendet av import större.',
  },
  {
    q: 'När på dygnet är elen billigast?',
    a: 'Generellt är elen billigast mitt på natten (kl 00–06) och dyrast under morgon- och kvällstopparna (kl 07–09 och 17–20) då förbrukningen är som högst. Använd timprislistan för att se exakt när det är billigast just idag.',
  },
  {
    q: 'Vad ingår inte i spotpriset?',
    a: 'Spotpriset som visas här är enbart börspriset i öre/kWh. Det inkluderar inte nätavgift, elhandelspåslag, energiskatt eller moms. Din faktiska elkostnad är högre — ofta 2–4 gånger spotpriset beroende på din elleverantör.',
  },
]

function FAQ() {
  const [open, setOpen] = useState(null)

  return (
    <section className="faq-section" aria-label="Vanliga frågor om elpriser">
      <h2 className="faq-title">Vanliga frågor</h2>
      <div className="faq-list">
        {FAQ_ITEMS.map((item, i) => (
          <div key={i} className={`faq-item${open === i ? ' open' : ''}`}>
            <button
              className="faq-question"
              onClick={() => setOpen(open === i ? null : i)}
              aria-expanded={open === i}
            >
              <span>{item.q}</span>
              <svg className="faq-chevron" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M2.5 5L7 9.5L11.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {open === i && (
              <div className="faq-answer">{item.a}</div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

// ── Root App ───────────────────────────────────────────────────────────────

export default function App() {
  const [region,       setRegion]       = useState('SE3')
  const [day,          setDay]          = useState('today')
  const [todayData,    setTodayData]    = useState(null)
  const [tomorrowData, setTomorrowData] = useState(null)
  const [loading,      setLoading]      = useState(true)

  const activeData = day === 'today' ? todayData : tomorrowData

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      const today    = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const [td, tmd] = await Promise.all([
        fetchPrices(region, today),
        fetchPrices(region, tomorrow),
      ])

      if (cancelled) return
      setTodayData(td)
      setTomorrowData(tmd)
      setDay(prev => (prev === 'tomorrow' && !tmd) ? 'today' : prev)
      setLoading(false)
    }

    load()
    const interval = setInterval(load, 5 * 60 * 1000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [region])

  return (
    <>
      <div className="app">
        <header className="header">
          <img src={logo} alt="" className="brand-logo" />
          <h1 className="brand-text">
            <span className="brand-name">Elpriset</span>
            <span className="brand-tld">.se</span>
          </h1>
        </header>

        <RegionBar region={region} onSwitch={setRegion} />

        {loading ? (
          <div className="hero-card">
            <div className="loading-state">
              <div className="spinner" />
              Hämtar priser…
            </div>
          </div>
        ) : (
          <HeroCard data={activeData ?? todayData} day={loading ? 'today' : day} />
        )}

        <DayToggle
          day={day}
          hasTomorrow={!!tomorrowData}
          onSwitch={setDay}
        />

        {!loading && <PriceChart data={activeData} day={day} />}

        {!loading && <CostCards todayData={todayData} />}

        <FAQ />
      </div>

      <footer className="footer">
        <div className="about-card">
          <a href="https://produktionen.se" target="_blank" rel="noreferrer" className="about-company">Produktionen AB</a>
          <p className="about-text">
            Vi är webbutvecklare som älskar att bygga smarta, enkla verktyg — stora som små.
            Elpriset.se är ett av dem, helt kostnadsfritt att använda. Hoppas det hjälper!
          </p>
          <p className="about-contact">
            Gillar du vad vi gör?{' '}
            <a href="mailto:hej@produktionen.se" className="about-link">Hör av dig</a>
            {' '}— vi hjälper gärna med ditt nästa projekt.
          </p>
          <div className="about-tools">
            <div className="about-tools-label">Liknande verktyg</div>
            <a href="https://raknabilresa.se" target="_blank" rel="noreferrer" className="about-tool-link">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M2 10L10 2M10 2H4.5M10 2V7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              räknabilresa.se — Beräkna kostnaden för en bilresa
            </a>
            <a href="https://raknabil.se" target="_blank" rel="noreferrer" className="about-tool-link">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M2 10L10 2M10 2H4.5M10 2V7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              räknabil.se — Beräkna kostnaden för att köpa en bil
            </a>
          </div>
        </div>
        <div className="footer-inner">
          Data från{' '}
          <a href="https://www.elprisetjustnu.se" target="_blank" rel="noreferrer">
            elprisetjustnu.se
          </a>
          {' '}· Visar enbart spotpris exkl. nätavgift, skatt och moms
        </div>
      </footer>
    </>
  )
}
