'use client'

import ScrollReveal from './ScrollReveal'

const valueProps = [
  {
    title: 'Commercial Oriented',
    description:
      'Our curated collections are specifically designed for commercial environments, meeting the highest standards of durability, aesthetics, and performance for your architectural projects.',
  },
  {
    title: 'Customer Support',
    description:
      'Experience dedicated, personalized assistance from our team of industry experts, ready to support you from product selection through to successful project completion.',
  },
  {
    title: 'Sample Ordering',
    description:
      'Streamlined and efficient sample distribution ensures you have the right materials in hand quickly, empowering you to make confident design decisions without delay.',
  },
  {
    title: 'Resources',
    description:
      'Access comprehensive technical data, installation guidelines, and care instructions to guarantee your vision is executed flawlessly and maintained beautifully over time.',
  },
]

export default function ValueProps() {
  return (
    <section
      className="w-full py-section"
      aria-labelledby="value-props-heading"
    >
      <div className="max-w-container mx-auto px-container">
      <h2 id="value-props-heading" className="sr-only">
        Why choose GIO
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {valueProps.map((prop, i) => (
          <ScrollReveal key={prop.title} delay={i * 80}>
            <article className="bg-gio-grey p-[30px] flex flex-col gap-6 h-full">
              <div
                className="w-[38px] h-[38px] bg-gio-red flex-shrink-0"
                aria-hidden="true"
              />
              <h3 className="text-title">{prop.title}</h3>
              <p className="text-caption text-gio-black leading-[1.05]">
                {prop.description}
              </p>
            </article>
          </ScrollReveal>
        ))}
      </div>
      </div>
    </section>
  )
}
