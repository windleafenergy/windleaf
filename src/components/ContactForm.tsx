'use client'

import { useState, useTransition, type FormEvent } from 'react'
import {
  FORM_FIELDS,
  AREA_OF_INTEREST,
  FORM_COUNTRIES,
  DIAL_CODES,
} from '@/content/site'
import { SectionHeading } from '@/components/ui'
import { sendEnquiry } from '@/app/contact/actions'
import {
  fieldError,
  HONEYPOT_FIELD,
  MAX_LENGTH,
  PHONE_STRIP,
} from '@/lib/enquiry'

type Status = 'idle' | 'success' | 'error'

/** Lets the browser fill known details rather than making people retype them. */
const AUTOCOMPLETE: Record<string, string> = {
  name: 'name',
  company: 'organization',
  email: 'email',
  phone: 'tel',
}

export function ContactForm() {
  const [status, setStatus] = useState<Status>('idle')
  const [errors, setErrors] = useState<Record<string, boolean>>({})
  const [message, setMessage] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  /**
   * Dialling code for the country currently selected, shown as a fixed prefix
   * on the phone field. Empty until a country is chosen, in which case the
   * field behaves exactly as it did before and the enquirer can type their own
   * `+code` — better than guessing a default and silently mislabelling a
   * number as Indian.
   */
  const [dial, setDial] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const form = event.currentTarget
    const data = new FormData(form)

    // Fold the prefix into the submitted value, so what reaches the inbox is a
    // number someone can dial. The prefix is presentation — it lives outside
    // the input, so it is not in the FormData on its own.
    const typed = String(data.get('phone') ?? '').trim()
    if (dial && typed) {
      const bare = typed.replace(/^\+/, '').trim()
      // Guard against "+968 +968 …": some people type the code anyway, and the
      // prefix sits right next to the caret inviting exactly that.
      const local = bare.startsWith(dial.slice(1))
        ? bare.slice(dial.length - 1).trim()
        : bare
      data.set('phone', `${dial} ${local}`)
    }

    const nextErrors: Record<string, boolean> = {}

    for (const field of FORM_FIELDS) {
      if (fieldError(field.name, String(data.get(field.name) ?? ''))) {
        nextErrors[field.name] = true
      }
    }

    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      setStatus('error')
      setMessage(null)
      return
    }

    // The form is only reset once the server confirms delivery. Clearing it
    // optimistically would throw away everything the person typed if the send
    // then failed, leaving them to write it all again.
    startTransition(async () => {
      const result = await sendEnquiry(data)

      if (result.ok) {
        setStatus('success')
        setErrors({})
        setMessage(null)
        form.reset()
        return
      }

      setStatus('error')
      setMessage(result.error)
      // The server re-validates independently, so trust its verdict over the
      // one the client just computed.
      if (result.fields) {
        setErrors(Object.fromEntries(result.fields.map((name) => [name, true])))
      }
    })
  }

  /**
   * Clear a field's red border as soon as it becomes valid again.
   *
   * The inputs are uncontrolled, so without this nothing re-reads them between
   * submits and a corrected field kept its error styling until the form was
   * submitted a second time. Bound once on the <form>, because change events
   * bubble — every input, select and textarea inside is covered, including any
   * added later.
   */
  function handleFieldEdit(event: FormEvent<HTMLFormElement>) {
    const target = event.target as
      | HTMLInputElement
      | HTMLSelectElement
      | HTMLTextAreaElement

    const { name } = target
    if (!name) return

    // Picking a country sets the phone prefix. Change events bubble to the
    // form, so this is caught here rather than needing the select to be
    // controlled — which would mean managing its value too.
    if (name === 'country') setDial(DIAL_CODES[target.value] ?? '')

    // Strip anything that is not part of a phone number, in place. `type="tel"`
    // deliberately does not restrict input — it only hints at a keypad — so
    // without this a phone field happily accepts letters and then fails
    // validation on submit, which is a worse experience than not accepting
    // them at all. Only touched when it actually changes, so the caret is not
    // disturbed while typing valid characters.
    if (name === 'phone') {
      const cleaned = target.value.replace(PHONE_STRIP, '').slice(0, MAX_LENGTH.phone)
      if (cleaned !== target.value) target.value = cleaned
    }

    const value = target.value
    // Still wrong — keep the border up rather than flickering it off per
    // keystroke and back on at submit.
    if (!errors[name] || fieldError(name, value)) return

    const next = { ...errors }
    delete next[name]
    setErrors(next)

    // Last one fixed: retire the summary message too, or it sits there
    // claiming there are highlighted fields when none are left.
    if (Object.keys(next).length === 0) setStatus('idle')
  }

  const inputCls = (name: string) =>
    `w-full rounded-md border bg-white px-4 py-3 text-sm text-charcoal outline-none transition-colors placeholder:text-charcoal/40 focus:border-green ${
      errors[name] ? 'border-red-400' : 'border-hairline'
    }`

  return (
    <div>
      <SectionHeading
        eyebrow="Enquiry Form"
        title="Send Us Your Enquiry"
      />

      {status === 'success' ? (
        <div className="mt-8 rounded-2xl border border-green/40 bg-green/8 p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green text-white">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M5 13l4 4L19 7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <h3 className="mt-4 text-xl font-semibold text-navy">
            Thank you
          </h3>

          <p className="mt-2 text-charcoal/70">
            Your enquiry has been received and our team will be in touch.
          </p>

          <button
            type="button"
            onClick={() => setStatus('idle')}
            className="mt-5 text-sm font-semibold text-green hover:text-forest"
          >
            Send another enquiry →
          </button>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          onChange={handleFieldEdit}
          noValidate
          className="mt-8"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            {FORM_FIELDS.map((field) => {
              const fullWidth =
                field.name === 'name' ||
                field.name === 'requirement'

              return (
                <div
                  key={field.name}
                  className={fullWidth ? 'sm:col-span-2' : ''}
                >
                  <label
                    htmlFor={field.name}
                    className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-navy/70"
                  >
                    {field.label}

                    {field.required && (
                      <span className="text-green"> *</span>
                    )}
                  </label>

                  {/* Country */}
                  {field.name === 'country' && (
                    <select
                      id={field.name}
                      name={field.name}
                      defaultValue=""
                      aria-invalid={
                        errors[field.name] ? true : undefined
                      }
                      className={inputCls(field.name)}
                    >
                      <option value="" disabled>
                        {field.placeholder}
                      </option>

                      {FORM_COUNTRIES.map((country) => (
                        <option
                          key={country}
                          value={country}
                        >
                          {country}
                        </option>
                      ))}
                    </select>
                  )}

                  {/* Area of Interest */}
                  {field.name === 'area' && (
                    <select
                      id={field.name}
                      name={field.name}
                      defaultValue=""
                      aria-invalid={
                        errors[field.name] ? true : undefined
                      }
                      className={inputCls(field.name)}
                    >
                      <option value="">
                        {field.placeholder}
                      </option>

                      {AREA_OF_INTEREST.map((area) => (
                        <option
                          key={area}
                          value={area}
                        >
                          {area}
                        </option>
                      ))}
                    </select>
                  )}

                  {/* Requirement */}
                  {field.name === 'requirement' && (
                    <textarea
                      id={field.name}
                      name={field.name}
                      rows={5}
                      placeholder={field.placeholder}
                      maxLength={MAX_LENGTH[field.name]}
                      aria-invalid={
                        errors[field.name] ? true : undefined
                      }
                      aria-describedby={`${field.name}-limit`}
                      className={inputCls(field.name)}
                    />
                  )}

                  {/* The only field where the cap is worth showing: it is the
                      one somebody might write enough in to hit. */}
                  {field.name === 'requirement' && (
                    <p
                      id={`${field.name}-limit`}
                      className="mt-1.5 text-right text-xs text-charcoal/45"
                    >
                      Up to {MAX_LENGTH.requirement.toLocaleString()} characters
                    </p>
                  )}

                  {/* Normal inputs */}
                  {field.name !== 'country' &&
                    field.name !== 'area' &&
                    field.name !== 'requirement' && (
                      // The phone field gets the dialling code as a fixed
                      // prefix once a country is picked. It sits outside the
                      // input — not as placeholder or pre-filled text — so it
                      // cannot be half-deleted while typing, and the border is
                      // moved to this wrapper so the two read as one control.
                      <div
                        className={
                          field.name === 'phone' && dial
                            ? `flex items-stretch overflow-hidden rounded-md border bg-white transition-colors focus-within:border-green ${errors[field.name] ? 'border-red-400' : 'border-hairline'
                            }`
                            : undefined
                        }
                      >
                        {field.name === 'phone' && dial && (
                          <span className="flex shrink-0 select-none items-center border-r border-hairline bg-mist px-3 text-sm font-semibold text-navy">
                            {dial}
                          </span>
                        )}

                        <input
                          id={field.name}
                          name={field.name}
                          type={field.type}
                          placeholder={
                            field.name === 'phone' && dial
                              ? 'Number without country code'
                              : field.placeholder
                          }
                          maxLength={MAX_LENGTH[field.name]}
                          // A numeric keypad on phones, and the browser's own
                          // autofill for the rest. `type` alone gets neither.
                          inputMode={
                            field.name === 'phone'
                              ? 'tel'
                              : field.name === 'email'
                                ? 'email'
                                : undefined
                          }
                          autoComplete={AUTOCOMPLETE[field.name]}
                          aria-invalid={
                            errors[field.name]
                              ? true
                              : undefined
                          }
                          aria-describedby={
                            field.name === 'phone' && dial ? 'phone-dial' : undefined
                          }
                          className={
                            field.name === 'phone' && dial
                              ? 'w-full min-w-0 bg-transparent px-4 py-3 text-sm text-charcoal outline-none placeholder:text-charcoal/40'
                              : inputCls(field.name)
                          }
                        />
                      </div>
                    )}

                  {field.name === 'phone' && dial && (
                    <p id="phone-dial" className="mt-1.5 text-xs text-charcoal/45">
                      Country code {dial} is added automatically.
                    </p>
                  )}
                </div>
              )
            })}
          </div>

          {/* Honeypot. Hidden from sight, from assistive tech and from the tab
              order — a human cannot reach it, so anything in it came from a
              script filling every input it found. `position:absolute` with
              `left:-9999px` rather than `display:none`, because some bots skip
              fields that are explicitly not displayed. */}
          <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
            <label htmlFor={HONEYPOT_FIELD}>Website</label>
            <input
              id={HONEYPOT_FIELD}
              name={HONEYPOT_FIELD}
              type="text"
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          {status === 'error' && (
            <p
              role="alert"
              className="mt-5 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-600"
            >
              {message ??
                'Please check the highlighted fields and make sure all required information is valid.'}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="group mt-6 inline-flex items-center gap-2 rounded-md bg-navy px-7 py-4 text-base font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-green disabled:pointer-events-none disabled:opacity-60"
          >
            {pending ? 'Sending…' : 'Send Enquiry'}

            {pending ? (
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
                className="animate-spin"
              >
                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" opacity="0.3" />
                <path
                  d="M14 8a6 6 0 0 0-6-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M3 8h9M8 4l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        </form>
      )}
    </div>
  )
}