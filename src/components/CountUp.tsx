'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Counts a stat up from zero the first time it scrolls into view.
 *
 * Accepts the display string straight from content (`"17"`, `"11"`), so any
 * prefix/suffix is preserved and only the numeric part animates.
 *
 * **The real number is the resting state, and zero is only ever a frame of an
 * animation in progress.** This used to initialise to 0, which meant the
 * server-rendered HTML said `0` and stayed there until JavaScript had
 * downloaded, hydrated and an observer had fired. On a slow connection the page
 * advertised "0 countries" and "0 years of experience" for as long as that
 * took, and with JavaScript blocked it never recovered. Any future change here
 * has to keep the truthful value in the markup.
 */
export function CountUp({
  value,
  duration = 1400,
  className = '',
}: {
  value: string
  duration?: number
  className?: string
}) {
  const match = value.match(/^(\D*)(\d+)(.*)$/)
  const prefix = match?.[1] ?? ''
  const target = match ? Number(match[2]) : 0
  const suffix = match?.[3] ?? ''
  // `match` is a fresh array on every render, so it must never reach the
  // effect's dependency array — doing so tears the animation down and restarts
  // it on each frame's re-render, leaving the counter stuck near zero.
  const isNumeric = match !== null

  const ref = useRef<HTMLSpanElement>(null)
  // Starts at the truth, not at zero — see the note above.
  const [display, setDisplay] = useState(target)

  useEffect(() => {
    if (!isNumeric) return
    const el = ref.current
    if (!el) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    // Don't spend a device's budget on decoration when it has told us it is
    // struggling. Data Saver, a 2G-class connection or a low-core device all
    // leave the number sitting at its real value, which is the point of the
    // component anyway.
    const connection = (
      navigator as Navigator & {
        connection?: { saveData?: boolean; effectiveType?: string }
        deviceMemory?: number
      }
    ).connection
    const effective = connection?.effectiveType ?? ''
    if (connection?.saveData || effective === 'slow-2g' || effective === '2g') return
    if ((navigator.hardwareConcurrency ?? 8) <= 2) return

    let frame = 0
    let start = 0
    let settled = false

    const tick = (now: number) => {
      if (!start) start = now
      const t = Math.min(1, (now - start) / duration)
      // easeOutExpo — fast out of the gate, gentle settle on the final number.
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
      setDisplay(Math.round(eased * target))
      if (t < 1) frame = requestAnimationFrame(tick)
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        // IntersectionObserver reports the current state the moment you
        // observe. If the stat is already on screen there is nothing to count
        // up *to* — resetting to zero and animating would be a visible flicker
        // on a number the reader is already looking at. Leave it alone.
        if (!settled) {
          settled = true
          if (entry.isIntersecting) observer.disconnect()
          return
        }
        if (!entry.isIntersecting) return
        observer.disconnect()
        // Zero only here: the element is arriving from off-screen, so nobody
        // sees the reset.
        setDisplay(0)
        frame = requestAnimationFrame(tick)
      },
      { threshold: 0.4 },
    )
    observer.observe(el)

    return () => {
      observer.disconnect()
      if (frame) cancelAnimationFrame(frame)
    }
    // Primitives only — see the note on `isNumeric` above.
  }, [isNumeric, target, duration])

  // Non-numeric values render untouched.
  if (!isNumeric) return <span className={className}>{value}</span>

  return (
    <span ref={ref} className={className}>
      {prefix}
      {display}
      {suffix}
    </span>
  )
}
