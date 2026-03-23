import Image from 'next/image'
import Link from 'next/link'

export default function HeroSection() {
  return (
    <section
      className="w-full"
      aria-label="Featured collections"
    >
      <div className="max-w-container mx-auto px-container flex flex-col lg:flex-row gap-3 h-auto lg:h-[calc(100vh-172px)]">
        {/* Left Column: Blendstone + Red CTA */}
        <div className="flex flex-col gap-3 w-full lg:w-[524px] lg:flex-shrink-0">
          {/* Blendstone Tile Image */}
          <Link
            href="/collections/blendstone"
            className="group relative flex-1 min-h-[280px] overflow-hidden"
          >
            <Image
              src="/images/hero-blendstone.png"
              alt="Blendstone collection — a new tile collection from GIO"
              fill
              sizes="(max-width: 1024px) 100vw, 524px"
              className="object-cover object-right-bottom transition-transform duration-500 group-hover:scale-[1.03]"
              priority
            />
            {/* Badge + Title overlay */}
            <div className="absolute inset-0 flex flex-col justify-between p-[18px]">
              <div className="self-end">
                <span className="bg-gio-black text-white text-small px-3.5 py-1.5 inline-block">
                  New
                </span>
              </div>
              <h3 className="text-title text-white">Blendstone</h3>
            </div>
          </Link>

          {/* Red CTA Block */}
          <div className="bg-gio-red flex-1 flex flex-col justify-between p-[30px] min-h-[300px]">
            <p className="text-[26px] tracking-[-0.02em] leading-none text-white">
              Welcome to Gio.
            </p>
            <h1 className="text-display text-white">
              Tile Collections Curated Expressly for Commercial Specifications
            </h1>
          </div>
        </div>

        {/* Right Column: Salento Feature Image */}
        <Link
          href="/collections/salento"
          className="group relative w-full lg:flex-1 min-h-[400px] lg:min-h-0 overflow-hidden"
        >
          <Image
            src="/images/hero-salento.png"
            alt="Salento collection — featured tile collection from GIO"
            fill
            sizes="(max-width: 1024px) 100vw, 880px"
            className="object-cover object-right-bottom transition-transform duration-500 group-hover:scale-[1.03]"
            priority
          />
          <div className="absolute inset-0 flex flex-col justify-between p-[18px]">
            <div className="self-end">
              <span className="bg-gio-black text-white text-small px-3.5 py-1.5 inline-block">
                New
              </span>
            </div>
            <h2 className="text-title text-white">Salento</h2>
          </div>
        </Link>
      </div>
    </section>
  )
}
