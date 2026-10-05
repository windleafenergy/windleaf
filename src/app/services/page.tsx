import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import {
  SEO,
  SERVICES,
  GALLERY,
  DESIGN_BOXES,
  COUNTRY_COUNT,
  PROJECTS,
} from '@/content/site'
import { Button, Section, SectionHeading, stagger } from '@/components/ui'
import { PageHero, ClosingCTA } from '@/components/sections'
import ServiceQuickLinks from '@/components/ServiceQuickLinks'
import { ScrollRail } from '@/components/ScrollRail'
import { ProjectCard } from '@/components/ProjectCard'
export const metadata: Metadata = {
  title: SEO.services.title,
  description: SEO.services.description,
  alternates: { canonical: '/services' },
}

export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="Lifecycle Expertise"
        title="Blade Engineering Services Across the Lifecycle"
        sub="Independent, Expert support for Wind Farm Owners, IPPs, Investors and OEMs — from design and manufacturing to inspection, repair and training."
        bgImg="/services-wind-farm-sunset.jpg"
      />

      {/* Quick links — one scrollable rail with snap points and fades at both
          ends so it's obvious there is more to the right. */}
      <div className="sticky top-[68px] z-30 border-y border-hairline bg-white/90 backdrop-blur-md">
        <div className="relative mx-auto w-full max-w-7xl">
          <ServiceQuickLinks />
        </div>
      </div>

      {/* Projects */}
      <Section tone="white" id="work">
        <div className="reveal-up">
          <SectionHeading
            eyebrow="Field Experience"
            title="Our Work in Practice"
            sub={`Hands-on blade engineering experience across manufacturing facilities, wind projects and field inspections in ${COUNTRY_COUNT} countries.`}
          />
        </div>
        <p className="reveal-up mt-6 max-w-3xl text-lg leading-relaxed text-charcoal/75">
          Across 17 years, our work has covered blade manufacturing, technical training, project delivery, technical due diligence, process and manufacturing audits, manufacturing surveillance, blade inspection, repair analysis and technical knowledge transfer.
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {GALLERY.map((item, i) => (
            <figure
              key={item.caption}
              className="reveal group overflow-hidden rounded-2xl border border-hairline bg-soft"
              style={stagger(i % 3)}
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-soft">
                <Image
                  src={item.img}
                  alt={item.alt}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <figcaption className="p-4 text-sm font-semibold text-navy">{item.caption}</figcaption>
            </figure>
          ))}
        </div>


        {/* Phones get a plain stacked list, not the rail.
            A rail card was `w-[88vw]` inside a container that also reserves a
            36px arrow gutter on each side, so on a 360px screen the card was
            always wider than the space it had — the right-hand edge of every
            card was cut off and no amount of swiping reached it. Below `sm`
            there is no room for a side-scrolling card that is readable, so the
            cards simply stack at full width. */}
        <div className="mt-10 space-y-6 sm:hidden">
          {PROJECTS.map((project, n) => (
            <ProjectCard
              key={project.number}
              project={project}
              className="reveal-up w-full"
              style={stagger(n)}
            />
          ))}
        </div>

        {/* Tablet and up: the rail, where there is width for it and the
            interaction matches the service chips above. */}
        <div className="hidden sm:block">
          <ScrollRail label="projects" step={520} className="mt-10">
            {PROJECTS.map((project, n) => (
              <ProjectCard
                key={project.number}
                project={project}
                className="reveal-up w-[70vw] max-w-[560px] shrink-0 snap-start lg:w-[calc(50%-0.75rem)]"
                style={stagger(n)}
              />
            ))}
          </ScrollRail>
        </div>

        <div className="mt-8">
          <Button to="/contact" className="group">
            Discuss a Similar Project
          </Button>
        </div>
      </Section>

      {/* 8 services */}
      {SERVICES.map((service, idx) => (
        <Section key={service.id} id={service.id} tone={idx % 2 === 0 ? 'mist' : 'white'}>
          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">
            {/* The reveal must not live on the sticky element itself: once
                pinned it stops moving through the viewport, so its entry
                timeline never advances and the animation never plays. */}
            <div className="lg:sticky lg:top-32 lg:self-start">
              <div className="reveal-left">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-green">
                  {service.n}
                </span>
                <h2 className="mt-3 text-4xl font-semibold sm:text-5xl md:leading-[1.08]">{service.title}</h2>
                <p className="mt-4 text-lg font-medium leading-relaxed text-green">{service.sub}</p>
                <p className="mt-4 leading-relaxed text-charcoal/75">{service.text}</p>

                {service.id === 'design-engineering' && (
                  <div className="mt-6 space-y-4">
                    {DESIGN_BOXES.map((box) => (
                      <div key={box.title} className="rounded-xl border border-hairline bg-white p-5">
                        <h4 className="font-semibold text-navy">{box.title}</h4>
                        <p className="mt-1.5 text-sm leading-relaxed text-charcoal/70">{box.body}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-6">
                  <Button to="/contact" className="group">
                    {service.cta}
                  </Button>
                </div>
              </div>
            </div>

            <div className="reveal-right">
              <div className="rounded-2xl border border-hairline bg-white p-8">
                <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-navy/60">
                  {service.id === 'design-engineering' ? 'We Can Support' : 'What We Do'}
                </h3>
                <ul className="mt-5 grid gap-x-8 gap-y-3 sm:grid-cols-2">
                  {service.list.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-charcoal/80">
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 20 20"
                        fill="none"
                        className="mt-0.5 shrink-0 text-green"
                        aria-hidden="true"
                      >
                        <path
                          d="M4 10.5l4 4 8-9"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6 rounded-2xl border-l-4 border-green bg-mist p-6">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-green">
                  Experience behind it
                </span>
                <p className="mt-2 font-medium leading-relaxed text-navy">{service.experience}</p>
              </div>
            </div>
          </div>
        </Section>
      ))}

      <ClosingCTA
        eyebrow="Expert Guidance"
        title="Not Sure Which Service You Need?"
        text="Tell us about your blade challenge and we will help you find the right support."
        buttonLabel="Start the Conversation"
      />
    </>
  )
}
