import type { Project } from '@/content/site'

/**
 * One delivered project.
 *
 * Extracted so the phone and desktop layouts on `/services` can share a single
 * definition. They are genuinely different layouts, not one responsive one — a
 * stacked list below `sm`, a horizontal rail above it — and duplicating ~70
 * lines of markup to achieve that is how the two drift apart.
 *
 * `className` carries only the width and flow concerns the parent owns.
 */
export function ProjectCard({
  project,
  className = '',
  style,
}: {
  project: Project
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <article
      className={`overflow-hidden rounded-2xl border border-hairline bg-white transition-shadow duration-300 hover:shadow-lg hover:shadow-navy/10 ${className}`}
      style={style}
    >
      {/* Header */}
      <div className="bg-navy px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <span className="text-xs font-bold tracking-widest text-leaf">{project.number}</span>
          {/* Wraps rather than being pushed off the edge: "Global Wind Projects"
              next to the number left no room on a 360px card and the country
              was clipped mid-word. */}
          <span className="text-right text-xs font-medium text-white/60">{project.country}</span>
        </div>

        <h3 className="mt-2 font-display text-lg font-semibold text-white">{project.title}</h3>

        <p className="mt-1 text-xs leading-relaxed text-white/60">{project.service}</p>

        {/* Capacity / site line, where one is known. Optional — most projects
            have no public figure to quote, and an empty rule under the header
            reads as missing data rather than none. */}
        {project.context && (
          <p className="mt-3 border-t border-white/15 pt-3 text-[11px] font-medium leading-relaxed text-leaf">
            {project.context}
          </p>
        )}
      </div>

      {/* Content */}
      <div className="divide-y divide-hairline">
        <div className="px-6 py-5">
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-teal">
            Project Need
          </span>
          <p className="mt-2 text-sm leading-relaxed text-charcoal/75">{project.need}</p>
        </div>

        <div className="px-6 py-5">
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-teal">
            Windleaf Support
          </span>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {project.support.map((item) => (
              <span
                key={item}
                className="rounded-md border border-teal/20 bg-teal/[0.06] px-2.5 py-1 text-[11px] font-medium text-[#0d6d70]"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="px-6 py-5">
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-teal">
            Value Delivered
          </span>
          <p className="mt-2 text-sm leading-relaxed text-charcoal/75">{project.outcome}</p>
        </div>
      </div>
    </article>
  )
}
