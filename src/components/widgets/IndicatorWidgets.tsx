interface IndicatorCardProps {
  title: string
  value: string
  asOf: string
  source: string
}

function IndicatorCard({ title, value, asOf, source }: IndicatorCardProps) {
  return (
    <div className="rounded border border-gray-300 dark:border-gray-700 p-3 flex-1 min-w-[160px]">
      <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {title}
      </div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
      <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
        {asOf} &middot; {source}
      </div>
    </div>
  )
}

/**
 * Placeholder values. Phase 2 wires these to:
 * - Generic ballot: scraped public polling average
 * - Approval: scraped public polling average
 * - Inflation / Unemployment: FRED API (CPI, UNRATE) — free, no scraping needed
 */
export function IndicatorWidgets() {
  return (
    <div className="flex flex-wrap gap-3">
      <IndicatorCard title="Generic Ballot" value="D +2.1" asOf="placeholder" source="TBD" />
      <IndicatorCard title="Presidential Approval" value="42%" asOf="placeholder" source="TBD" />
      <IndicatorCard title="Inflation (CPI YoY)" value="—" asOf="placeholder" source="FRED" />
      <IndicatorCard title="Unemployment" value="—" asOf="placeholder" source="FRED" />
    </div>
  )
}
