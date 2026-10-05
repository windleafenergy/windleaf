import { CONTACT, FOUNDER } from '@/content/site'

/**
 * The enquiry notification email.
 *
 * Kept out of the Server Action so the delivery logic stays readable and this
 * can be edited as what it is — a template.
 *
 * **HTML email is not the web.** The rules here are deliberate and not worth
 * "modernising":
 *
 * - Tables for layout. Outlook renders through Word's HTML engine, which has no
 *   flexbox and no grid, and collapses `<div>`-based columns into a single
 *   stack.
 * - Every style inline. `<style>` blocks are stripped by Gmail's web client and
 *   several others; a stylesheet would simply not arrive.
 * - No external images, so no logo file. Most clients block remote images until
 *   the reader clicks "show images", and a brand that depends on one shows up as
 *   a broken-image icon. The wordmark is set in type instead, which always
 *   renders.
 * - 600px maximum width — the long-standing safe width for desktop preview
 *   panes, and it scales down cleanly on a phone.
 * - `role="presentation"` on layout tables, so screen readers announce the
 *   content rather than "table, 4 columns".
 */

const NAVY = '#052f45'
const GREEN = '#2dbe60'
const TEAL = '#00c2a8'
const INK = '#26343a'
const MUTED = '#5a686e'
const HAIRLINE = '#e3ebee'
const MIST = '#f0f8fa'

/** Everything that reaches this file came from a public form. Escape it all. */
const esc = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

/** Preserve the line breaks someone typed into the textarea. */
const nl2br = (value: string) => esc(value).replace(/\r?\n/g, '<br />')

type Values = Record<string, string>

/**
 * Fields grouped by what the reader is looking for, rather than in the order
 * the form happens to ask for them. Whoever opens this wants to know who it is
 * and how to reach them first, then what the job is.
 */
const GROUPS: { heading: string; fields: [key: string, label: string][] }[] = [
  {
    heading: 'Contact',
    fields: [
      ['name', 'Name'],
      ['company', 'Company'],
      ['email', 'Email'],
      ['phone', 'Phone / WhatsApp'],
      ['country', 'Country'],
    ],
  },
  {
    heading: 'Project',
    fields: [
      ['area', 'Area of interest'],
      ['location', 'Wind farm / location'],
      ['turbine', 'Turbine & blade details'],
    ],
  },
]

function row(label: string, value: string, isLink?: 'email' | 'tel') {
  const inner =
    isLink === 'email'
      ? `<a href="mailto:${esc(value)}" style="color:${NAVY};text-decoration:underline">${esc(value)}</a>`
      : isLink === 'tel'
        ? `<a href="tel:${esc(value.replace(/[^\d+]/g, ''))}" style="color:${NAVY};text-decoration:underline">${esc(value)}</a>`
        : esc(value)

  return `<tr>
      <td style="padding:9px 16px 9px 0;vertical-align:top;font-size:13px;color:${MUTED};white-space:nowrap">${esc(label)}</td>
      <td style="padding:9px 0;vertical-align:top;font-size:14px;color:${INK};font-weight:600">${inner}</td>
    </tr>`
}

export function enquiryEmail(values: Values): {
  subject: string
  html: string
  text: string
} {
  const who = [values.name, values.company].filter(Boolean).join(' · ')

  const sections = GROUPS.map((group) => {
    const rows = group.fields
      .filter(([key]) => values[key])
      .map(([key, label]) =>
        row(label, values[key], key === 'email' ? 'email' : key === 'phone' ? 'tel' : undefined),
      )
      .join('')

    // A heading with nothing under it reads as missing data rather than as a
    // section that does not apply — Project is entirely optional fields.
    if (!rows) return ''

    return `<tr><td style="padding:26px 32px 0">
        <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:${TEAL}">${group.heading}</p>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">${rows}</table>
      </td></tr>`
  }).join('')

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>New website enquiry</title>
</head>
<body style="margin:0;padding:0;background:${MIST};-webkit-font-smoothing:antialiased">

  <!-- Preheader: the grey line a client previews next to the subject. Hidden in
       the body itself, or it would print twice. Without it the preview falls
       back to whatever text comes first, which is the heading. -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0">
    ${esc(who)} — ${esc((values.requirement ?? '').slice(0, 110))}
  </div>

  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${MIST};padding:28px 12px">
    <tr><td align="center">

      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px;max-width:100%;background:#ffffff;border:1px solid ${HAIRLINE};border-radius:14px;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">

        <!-- Header -->
        <tr><td style="background:${NAVY};padding:26px 32px">
          <p style="margin:0;font-size:17px;font-weight:700;letter-spacing:-0.2px;color:#ffffff">
            Windleaf <span style="color:${GREEN}">Energy Solutions</span>
          </p>
          <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.65)">
            New enquiry from the website contact form
          </p>
        </td></tr>

        ${sections}

        <!-- Requirement -->
        ${values.requirement
      ? `<tr><td style="padding:26px 32px 0">
                <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:${TEAL}">Requirement</p>
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr><td style="background:${MIST};border-left:3px solid ${GREEN};border-radius:0 8px 8px 0;padding:16px 18px;font-size:14px;line-height:1.65;color:${INK}">
                    ${nl2br(values.requirement)}
                  </td></tr>
                </table>
              </td></tr>`
      : ''
    }

        <!-- Reply button. A table cell with a background, not a styled <a>:
             Outlook ignores padding on an inline element and the button
             collapses to bare underlined text. -->
        ${values.email
      ? `<tr><td style="padding:26px 32px 0">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                  <tr><td style="background:${GREEN};border-radius:7px">
                    <a href="mailto:${esc(values.email)}?subject=${encodeURIComponent('Re: your Windleaf enquiry')}"
                       style="display:inline-block;padding:13px 26px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none">
                      Reply to ${esc(values.name || 'enquirer')}
                    </a>
                  </td></tr>
                </table>
                <p style="margin:10px 0 0;font-size:12px;color:${MUTED}">
                  Replying directly to this email also reaches them — Reply-To is set to their address.
                </p>
              </td></tr>`
      : ''
    }

        <!-- Footer -->
        <tr><td style="padding:26px 32px 30px">
          <div style="border-top:1px solid ${HAIRLINE};padding-top:18px">
            <p style="margin:0;font-size:12px;line-height:1.7;color:${MUTED}">
              <strong style="color:${INK}">${esc(FOUNDER.name)}</strong> · ${esc(FOUNDER.role)}<br />
              ${esc(CONTACT.email)} · ${esc(CONTACT.phone)}<br />
              Sent automatically by the Windleaf website. Do not reply to this address.
            </p>
          </div>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

  // Plain text alternative. Not optional: some clients and most notification
  // previews show it, and an HTML-only message scores worse with spam filters.
  const text = [
    'NEW WEBSITE ENQUIRY',
    '',
    ...GROUPS.flatMap((group) => {
      const lines = group.fields
        .filter(([key]) => values[key])
        .map(([key, label]) => `  ${label}: ${values[key]}`)
      return lines.length ? [group.heading.toUpperCase(), ...lines, ''] : []
    }),
    ...(values.requirement ? ['REQUIREMENT', values.requirement, ''] : []),
    '---',
    'Sent automatically by the Windleaf website.',
  ].join('\n')

  return {
    subject: `Website enquiry — ${who || 'new contact'}`,
    html,
    text,
  }
}
