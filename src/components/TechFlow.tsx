import type { ReactElement } from 'react'
import { TECH_FLOW } from '@/content/site'
import { TechFlowTimeline } from './TechFlowTimeline'

const ICONS: Record<string, ReactElement> = {
  // 01: Wind turbine blade
  '01': (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="11" r="2" />
      <path d="M12 9V2.5c1.4 2 1.6 4.5 0 6.5z" />
      <path d="M10.3 12L4.5 15.3c1.7-1.4 4.1-2.2 5.8-3.3z" />
      <path d="M13.7 12l5.8 3.3c-1.7-1.4-4.1-2.2-5.8-3.3z" />
      <path d="M11.5 13.5l-1 8.5M12.5 13.5l1 8.5M9 22h6" />
    </svg>
  ),
  // 02: Inspection & Data (Visual • NDT • Robotics • Field Data)
  '02': (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7V5a2 2 0 0 1 2-2h2" />
      <path d="M17 3h2a2 2 0 0 1 2 2v2" />
      <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
      <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 4.5V7M12 17v2.5M4.5 12H7M17 12h2.5" />
    </svg>
  ),
  // 03: Engineering Analysis (Structural • Manufacturing • Quality • Defects)
  '03': (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 20h18" />
      <path d="M6 20v-5" />
      <path d="M10 20v-9" />
      <path d="M14 20v-13" />
      <path d="M18 20v-7" />
      <path d="M6 14l4-4 4-4 4 4" />
      <circle cx="18" cy="10" r="1.5" fill="currentColor" />
    </svg>
  ),
  // 04: Technical Assessment (Risk • Root Cause • Integrity • Performance)
  '04': (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l7 3.5v6c0 5-3.5 9-7 10.5-3.5-1.5-7-5.5-7-10.5v-6L12 2z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  ),
  // 05: Windleaf Engineering (Independent Engineering Judgement)
  '05': (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9.5" cy="7" r="3.5" />
      <path d="M3 19v-1.5a5.5 5.5 0 0 1 11 0V19" />
      <circle cx="17.5" cy="13.5" r="3.5" />
      <path d="M16 13.5l1 1 2-2" />
    </svg>
  ),
  // 06: Engineering Solution (Repair • Corrective Action • Life Extension • Recommendation)
  '06': (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      <path d="M4 14l3 3" />
    </svg>
  ),
}

/** Every node uses the same teal; the connector carries the dark navy. */
const NODE_COLOUR = '#00c2a8'
const LINE_COLOUR = '#052f45'

/** Compact inline list for the home page preview. */
function CompactFlow() {
  return (
    <ol className="flex flex-col">
      {TECH_FLOW.map((step, i) => {
        const isLast = i === TECH_FLOW.length - 1

        return (
          <li key={step.num} className="flex items-stretch gap-4">
            {/* All six nodes read identically; the connector is the dark
                navy so the chain between them is clearly visible. */}
            <div className="flex w-10 shrink-0 flex-col items-center">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white"
                style={{
                  backgroundColor: NODE_COLOUR,
                  boxShadow: `0 0 0 4px ${NODE_COLOUR}22`,
                }}
              >
                {ICONS[step.num]}
              </span>
              {!isLast && (
                <span
                  aria-hidden="true"
                  className="w-[3px] flex-1 rounded-full"
                  style={{
                    minHeight: 20,
                    // Solid here, unlike the Technology timeline. The nodes sit
                    // close together in this compact list, so a dotted rule
                    // rendered as two or three stray dots per gap and read as
                    // broken rather than continuous.
                    backgroundColor: NODE_COLOUR,
                  }}
                />
              )}
            </div>

            <div className="pb-6 pt-1.5">
              <span
                className="font-display text-[11px] font-bold tracking-[0.18em]"
                style={{ color: LINE_COLOUR, opacity: 0.45 }}
              >
                {step.num}
              </span>
              <p className="font-display text-base font-semibold leading-tight text-navy">
                {step.title}
              </p>
              {step.body && (
                <p className="mt-1 text-xs text-charcoal/70">
                  {step.body}
                </p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

/** Full roadmap view — alternating milestones that draw themselves on scroll. */
export function TechFlow({ variant = 'full' }: { variant?: 'full' | 'compact' }) {
  if (variant === 'compact') return <CompactFlow />

  // The icons live here, in a server component, and are handed to the client
  // timeline as props so this SVG markup stays out of the client bundle.
  return <TechFlowTimeline icons={ICONS} colours={TECH_FLOW.map(() => NODE_COLOUR)} />
}
