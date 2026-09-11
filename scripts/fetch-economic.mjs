import { writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

// FRED's plain CSV export needs no API key, unlike its JSON API.
const FRED_CSV = (seriesId) => `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${seriesId}`

async function fetchSeries(seriesId) {
  const res = await fetch(FRED_CSV(seriesId))
  if (!res.ok) throw new Error(`FRED ${res.status} for ${seriesId}`)
  const csv = await res.text()
  const rows = csv
    .trim()
    .split('\n')
    .slice(1)
    .map((line) => {
      const [date, value] = line.split(',')
      return { date, value: Number(value) }
    })
    .filter((r) => !Number.isNaN(r.value))
  return rows
}

export async function fetchEconomic() {
  // CPIAUCNS: CPI-U, not seasonally adjusted — matches BLS's standard "12-month change" headline inflation figure.
  const cpi = await fetchSeries('CPIAUCNS')
  const latestCpi = cpi[cpi.length - 1]
  const yearAgoCpi = cpi.find((r) => r.date === shiftYear(latestCpi.date, -1))
  const cpiYoYPercent = yearAgoCpi
    ? ((latestCpi.value - yearAgoCpi.value) / yearAgoCpi.value) * 100
    : null

  const unrate = await fetchSeries('UNRATE')
  const latestUnrate = unrate[unrate.length - 1]

  const result = {
    fetchedAt: new Date().toISOString(),
    cpi: {
      asOf: latestCpi.date,
      yoyPercent: cpiYoYPercent === null ? null : Math.round(cpiYoYPercent * 10) / 10,
    },
    unemployment: {
      asOf: latestUnrate.date,
      ratePercent: latestUnrate.value,
    },
    source: 'FRED (Federal Reserve Economic Data): CPIAUCNS, UNRATE',
    sourceUrl: 'https://fred.stlouisfed.org/',
  }

  writeFileSync(
    new URL('../src/data/generated/economic.json', import.meta.url),
    JSON.stringify(result, null, 2) + '\n',
  )

  console.log(`economic: CPI YoY ${result.cpi.yoyPercent}% (as of ${result.cpi.asOf}), unemployment ${result.unemployment.ratePercent}% (as of ${result.unemployment.asOf})`)
  return result
}

function shiftYear(isoDate, deltaYears) {
  const [y, m, d] = isoDate.split('-').map(Number)
  return `${y + deltaYears}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  fetchEconomic().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
