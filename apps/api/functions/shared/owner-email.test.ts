import { describe, expect, it } from 'vitest'
import { OWNER_ACCOUNT_EMAIL, resolveOwnerAccountEmail } from './owner-email.js'

describe('resolveOwnerAccountEmail', () => {
  it('maps legacy addresses to the canonical owner email', () => {
    expect(resolveOwnerAccountEmail('levi@cairn.ing')).toBe(OWNER_ACCOUNT_EMAIL)
    expect(resolveOwnerAccountEmail('levi_smith17@icloud.com')).toBe(OWNER_ACCOUNT_EMAIL)
    expect(resolveOwnerAccountEmail(null)).toBe(OWNER_ACCOUNT_EMAIL)
    expect(resolveOwnerAccountEmail('')).toBe(OWNER_ACCOUNT_EMAIL)
  })

  it('keeps a non-legacy stored email', () => {
    expect(resolveOwnerAccountEmail('other@example.com')).toBe('other@example.com')
    expect(resolveOwnerAccountEmail(OWNER_ACCOUNT_EMAIL)).toBe(OWNER_ACCOUNT_EMAIL)
  })
})
