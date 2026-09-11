import approval from '../../data/generated/approval.json'
import economic from '../../data/generated/economic.json'
import genericBallot from '../../data/generated/generic-ballot.json'

interface IndicatorCardProps {
  title: string
  value: string
  asOf: string
  source: string
  sourceUrl?: string
}

function IndicatorCard({ title, value, asOf, source, sourceUrl }: IndicatorCardProps) {
  return (
    <div className="rounded border border-gray-300 dark:border-gray-700 p-3 flex-1 min-w-[160px]">
      <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {title}
      </div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
      <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
        {asOf} &middot;{' '}
        {sourceUrl ? (
          <a href={sourceUrl} target="_blank" rel="noreferrer" className="underline">
            {source}
          </a>
        ) : (
          source
        )}
      </div>
    </div>
  )
}

export function IndicatorWidgets() {
  return (
    <div className="flex flex-wrap gap-3">
      <IndicatorCard
        title="Generic Ballot"
        value={genericBallot.marginText}
        asOf={genericBallot.asOf}
        source="Wikipedia poll average"
        sourceUrl={genericBallot.sourceUrl}
      />
      <IndicatorCard
        title="Presidential Approval"
        value={`${approval.approvePercent}%`}
        asOf={approval.asOf}
        source="Wikipedia poll average"
        sourceUrl={approval.sourceUrl}
      />
      <IndicatorCard
        title="Inflation (CPI YoY)"
        value={economic.cpi.yoyPercent === null ? '—' : `${economic.cpi.yoyPercent}%`}
        asOf={economic.cpi.asOf}
        source="FRED"
        sourceUrl={economic.sourceUrl}
      />
      <IndicatorCard
        title="Unemployment"
        value={`${economic.unemployment.ratePercent}%`}
        asOf={economic.unemployment.asOf}
        source="FRED"
        sourceUrl={economic.sourceUrl}
      />
    </div>
  )
}
