import type { Metadata } from 'next'
import SampleOrderForm from '@/components/samples/SampleOrderForm'

export const metadata: Metadata = {
  title: 'Request Samples | GIO Architectural Tile & Stone',
  description:
    'Request up to 5 complimentary tile samples. Shipped next day with quick access to technical specifications.',
}

export default function SamplesPage() {
  return (
    <div className="max-w-container mx-auto px-container pt-10 lg:pt-16 pb-20 lg:pb-24">
      <h1 className="text-[clamp(2rem,3.6vw,3.25rem)] leading-[1] tracking-[-0.04em] text-gio-black mb-4">
        Request Samples
      </h1>
      <p className="text-[clamp(0.9rem,1.1vw,1.05rem)] leading-[1.5] text-gio-black/45 mb-12 max-w-xl">
        Complimentary samples shipped next day. Add up to 5 samples, then fill
        out the form below.
      </p>
      <SampleOrderForm />
    </div>
  )
}
