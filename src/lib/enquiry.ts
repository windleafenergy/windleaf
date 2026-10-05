import { FORM_FIELDS } from '@/content/site'

/**
 * Enquiry form validation, shared by the browser and the server action.
 *
 * This file has no `'use client'` and imports nothing browser-only, so the same
 * rules run in both places. That is the point: the client checks are a courtesy
 * to whoever is typing, while the server action is a public POST endpoint that
 * anyone can hit directly with curl. If the two drifted, the form would either
 * accept something the mailer then rejects, or quietly email whatever an
 * attacker sent.
 */

/**
 * Length caps, by field.
 *
 * Validation rules, not copy, which is why they live here and not in
 * `site.ts` — a cap that disagreed with the validator would let someone fill a
 * field the form then refuses to accept.
 *
 * They are also a spam control. An uncapped textarea on a public form is an
 * invitation to paste a few hundred kilobytes into whatever inbox this posts to.
 */
export const MAX_LENGTH: Record<string, number> = {
  name: 80,
  company: 100,
  email: 120,
  phone: 20,
  location: 120,
  turbine: 160,
  requirement: 1500,
}

/**
 * Anything that is not a digit or the punctuation real phone numbers are
 * written with. Global, so it is only ever used with `replace` — `.test()` on
 * a global regex advances `lastIndex` between calls and starts returning false
 * for input it rejected a moment earlier.
 */
export const PHONE_STRIP = /[^\d\s+().-]/g

/**
 * Single source of truth for what makes one field invalid.
 *
 * The submit check, the live re-check and the server action all call this, so a
 * red border can never disagree with what submitting would actually say. Keep
 * new rules here rather than inline in a handler.
 */
export function fieldError(name: string, raw: string): boolean {
  const value = raw.trim()
  const field = FORM_FIELDS.find((f) => f.name === name)

  if (field?.required && !value) return true
  // Format rules only apply to something typed — an empty optional field is
  // not an error.
  if (!value) return false

  // Checked here as well as capped on the input, because `maxLength` is a
  // convenience for typing and nothing more: it does not survive a paste in
  // every browser, and it does not exist at all for anything POSTing directly.
  const limit = MAX_LENGTH[name]
  if (limit && value.length > limit) return true

  if (name === 'email') return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  if (name === 'phone') {
    // 7 digits is the shortest real subscriber number; the punctuation is not
    // counted towards it, so "+1 (555) 010-9999" passes on its digits alone.
    const digits = value.replace(/\D/g, '')
    if (digits.length < 7 || digits.length > 15) return true
    return value.replace(PHONE_STRIP, '') !== value
  }
  if (name === 'requirement') return value.length < 10

  return false
}

/**
 * Name of the honeypot input.
 *
 * A field no human sees, hidden from assistive tech and left out of the tab
 * order. Most form spam is a script that fills every input it finds, so a value
 * here means "not a person". Chosen to look worth filling in — a bot that
 * recognised `name="honeypot"` would skip it.
 */
export const HONEYPOT_FIELD = 'website'

export type EnquiryResult =
  | { ok: true }
  | { ok: false; error: string; fields?: string[] }
