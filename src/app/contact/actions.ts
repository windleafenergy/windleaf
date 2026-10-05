'use server'

import { Resend } from 'resend'
import { FORM_FIELDS, CONTACT } from '@/content/site'
import {
  fieldError,
  HONEYPOT_FIELD,
  MAX_LENGTH,
  type EnquiryResult,
} from '@/lib/enquiry'
import { enquiryEmail } from '@/lib/enquiry-email'

/**
 * Enquiry delivery via Resend.
 *
 * A Server Action rather than a Route Handler: this is a form mutation, it is
 * the path Next 16 is built around, and — the reason that matters — the API key
 * never leaves the server. `RESEND_API_KEY` has no `NEXT_PUBLIC_` prefix
 * precisely so it cannot be inlined into the browser bundle. Never add one.
 *
 * Environment:
 *   RESEND_API_KEY   required — from resend.com/api-keys
 *   ENQUIRY_TO       where enquiries land. Defaults to CONTACT.email.
 *   ENQUIRY_FROM     the From address. MUST be on a domain verified in Resend.
 *
 * `ENQUIRY_FROM` is the one that catches people out: Resend will not send from
 * an address it cannot prove you own. Until the real domain is verified, use
 * `onboarding@resend.dev`, which Resend provides for exactly this and which can
 * only deliver to the account owner's own address.
 */

/** Lazily constructed so a missing key is a handled error, not a module crash. */
function client(): Resend | null {
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  return new Resend(key)
}

export async function sendEnquiry(formData: FormData): Promise<EnquiryResult> {
  // A filled honeypot is a bot. Reported as success so the script has nothing
  // to learn from the response and does not come back with the field blank.
  if (String(formData.get(HONEYPOT_FIELD) ?? '').trim() !== '') {
    return { ok: true }
  }

  // Re-validate everything. The client already did this, but a Server Action is
  // a public POST endpoint — the browser is not the only thing that can call it.
  const values: Record<string, string> = {}
  const invalid: string[] = []

  for (const field of FORM_FIELDS) {
    const raw = String(formData.get(field.name) ?? '').trim()
    // Truncate rather than trust the cap the input claimed to enforce.
    values[field.name] = raw.slice(0, MAX_LENGTH[field.name] ?? 200)
    if (fieldError(field.name, values[field.name])) invalid.push(field.name)
  }

  if (invalid.length > 0) {
    return {
      ok: false,
      error: 'Please check the highlighted fields and make sure all required information is valid.',
      fields: invalid,
    }
  }

  const resend = client()
  if (!resend) {
    console.error('[enquiry] RESEND_API_KEY is not set — enquiry was not sent.')
    return {
      ok: false,
      error: `Our enquiry form is temporarily unavailable. Please email us directly at ${CONTACT.email}.`,
    }
  }

  const { subject, html, text } = enquiryEmail(values)

  try {
    const { error } = await resend.emails.send({
      from: process.env.ENQUIRY_FROM ?? 'Windleaf Website <onboarding@resend.dev>',
      to: process.env.ENQUIRY_TO ?? CONTACT.email,
      // So hitting Reply in the mail client goes to the enquirer, not to the
      // sending address. The single most useful line in the file day to day.
      replyTo: values.email,
      subject,
      html,
      text,
    })

    if (error) {
      // Resend reports delivery problems in the body, not by throwing — an
      // unverified `from` domain comes back here with a 200 and would otherwise
      // be reported to the user as a successful send.
      console.error('[enquiry] Resend rejected the message:', error)
      return {
        ok: false,
        error: `We could not send your enquiry just now. Please email us directly at ${CONTACT.email}.`,
      }
    }

    return { ok: true }
  } catch (cause) {
    console.error('[enquiry] Unexpected failure sending enquiry:', cause)
    return {
      ok: false,
      error: `We could not send your enquiry just now. Please email us directly at ${CONTACT.email}.`,
    }
  }
}
