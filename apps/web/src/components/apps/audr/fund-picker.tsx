import { useQuery } from '@tanstack/react-query'
import { Select } from '@/components/core/ui/select'
import { fetchCairnSjodr } from '@/lib/data-api'
import { resolveSjodrColor } from '@/lib/sjodr-color'
import { useTerms } from '@/hooks/use-terminology'

export function FundPicker({
  value,
  onChange,
}: {
  value: string | null
  onChange: (fundId: string | null) => void
}) {
  const terms = useTerms()
  const sjodrQuery = useQuery({
    queryKey: ['cairn-sjodr'],
    queryFn: fetchCairnSjodr,
  })
  const funds = sjodrQuery.data ?? []

  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-muted-foreground">{terms.sjodrSingular}</span>
      <Select
        value={value ?? ''}
        onChange={(next) => onChange(next || null)}
        placeholder={`No ${terms.sjodrSingular.toLowerCase()}`}
        options={[
          { value: '', label: `No ${terms.sjodrSingular.toLowerCase()}` },
          ...funds.map((fund) => ({
            value: fund.id,
            label: fund.name,
            color: resolveSjodrColor(fund.id, fund.color),
          })),
        ]}
      />
    </label>
  )
}
