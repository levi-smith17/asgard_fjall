import * as lucide from 'lucide-react'

interface RunBadgeProps {
  run: { name: string; color: string; icon?: string | null }
}

export function RunBadge({ run }: RunBadgeProps) {
  const Icon = run.icon
    ? ((lucide as unknown as Record<string, lucide.LucideIcon>)[run.icon] as lucide.LucideIcon | undefined)
    : null

  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: `${run.color}20`, color: run.color }}>
      {Icon ? <Icon className="h-3 w-3" /> : null}
      {run.name}
    </span>
  )
}
