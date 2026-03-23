import type { Metadata } from 'next'
import ContactForm from './ContactForm'
import ScrollReveal from '@/components/ScrollReveal'

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Get in touch with GIO Architectural Tile & Stone. Questions about products, samples, or specifications.',
}

export default function ContactPage() {
  return (
    <article>
      <section className="pt-section pb-12">
        <div className="container-gio">
          <h1 className="heading-page text-balance">Contact</h1>
          <p className="text-subtitle mt-4 max-w-2xl">
            Questions about our products, samples, or specifications?
            We&apos;d love to hear from you.
          </p>
        </div>
      </section>

      <section className="pb-section">
        <div className="container-gio">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <ScrollReveal>
              <ContactForm />
            </ScrollReveal>

            <ScrollReveal delay={120}>
              <div className="space-y-10">
                <div>
                  <h2 className="heading-section mb-4">General Inquiries</h2>
                  <p className="text-body-lg">
                    <a
                      href="mailto:info@giotile.com"
                      className="text-gio-red hover:text-gio-black transition-colors"
                    >
                      info@giotile.com
                    </a>
                  </p>
                </div>

                <div>
                  <h2 className="heading-section mb-4">Samples</h2>
                  <p className="text-body-lg">
                    Browse our collections and add samples to your request list,
                    or contact us directly for custom sample orders.
                  </p>
                </div>

                <div>
                  <h2 className="heading-section mb-4">Specifications</h2>
                  <p className="text-body-lg">
                    For technical specifications, CAD files, or spec support,
                    reach out to our team.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'GIO Architectural Tile & Stone',
            url: 'https://giotile.com',
            contactPoint: {
              '@type': 'ContactPoint',
              email: 'info@giotile.com',
              contactType: 'customer service',
            },
          }),
        }}
      />
    </article>
  )
}
