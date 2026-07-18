/** Targets that should not dismiss an open inspector when clicked on the canvas. */
export const INSPECTOR_DISMISS_IGNORE_SELECTOR = [
  'a',
  'button',
  'input',
  'select',
  'textarea',
  'label',
  '[data-inspectable]',
  '[data-inspector-dismiss-ignore]',
  '[data-studio-portal]',
  '[role="listbox"]',
  '[role="option"]',
].join(', ')

export function shouldIgnoreInspectorDismiss(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false
  return Boolean(target.closest(INSPECTOR_DISMISS_IGNORE_SELECTOR))
}
