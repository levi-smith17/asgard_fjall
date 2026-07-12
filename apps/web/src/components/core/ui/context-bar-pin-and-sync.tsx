import { ContextBarInspectorPin } from '@/components/core/ui/context-bar-inspector-pin'

/** Inspector pin button. Cache-sync is not present in Fjall (direct Cairn API, no BFF cache). */
export function ContextBarPinAndSync({
  pinned,
  onPinnedChange,
}: {
  pinned: boolean
  onPinnedChange: (pinned: boolean) => void
}) {
  return <ContextBarInspectorPin pinned={pinned} onPinnedChange={onPinnedChange} />
}
