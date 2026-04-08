import Image from 'next/image'
import Link from 'next/link'

interface HeroCollection {
  _id: string
  title: string
  slug: string
  featured?: boolean
  imageUrl: string | null
}

interface HeroSectionProps {
  left: HeroCollection | null
  right: HeroCollection | null
}

export default function HeroSection({ left, right }: HeroSectionProps) {
  return (
    <section
      className="w-full"
      aria-label="Featured collections"
    >
      <div className="max-w-container mx-auto px-container flex flex-col lg:flex-row gap-3 h-auto lg:h-[calc(100vh-172px)]">
        {/* Left Column: smaller collection + Red CTA */}
        <div className="flex flex-col gap-3 w-full lg:w-[524px] lg:flex-shrink-0">
          {/* Left Collection Tile */}
          {left && (
            <Link
              href={`/collections/${left.slug}`}
              className="group relative flex-1 min-h-[280px] overflow-hidden bg-gio-grey"
            >
              {left.imageUrl && (
                <Image
                  src={left.imageUrl}
                  alt={`${left.title} collection — a featured tile collection from GIO`}
                  fill
                  sizes="(max-width: 1024px) 100vw, 524px"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  priority
                />
              )}
              {/* Badge + Title overlay */}
              <div className="absolute inset-0 flex flex-col justify-between p-[18px]">
                <div className="self-end">
                  {left.featured && (
                    <span className="bg-gio-black text-white text-small px-3.5 py-1.5 inline-block">
                      New
                    </span>
                  )}
                </div>
                <h3 className="text-title text-white drop-shadow-md">
                  {left.title}
                </h3>
              </div>
            </Link>
          )}

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

        {/* Right Column: large feature collection */}
        {right && (
          <Link
            href={`/collections/${right.slug}`}
            className="group relative w-full lg:flex-1 min-h-[400px] lg:min-h-0 overflow-hidden bg-gio-grey"
          >
            {right.imageUrl && (
              <Image
                src={right.imageUrl}
                alt={`${right.title} collection — featured tile collection from GIO`}
                fill
                sizes="(max-width: 1024px) 100vw, 880px"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                priority
              />
            )}
            <div className="absolute inset-0 flex flex-col justify-between p-[18px]">
              <div className="self-end">
                {right.featured && (
                  <span className="bg-gio-black text-white text-small px-3.5 py-1.5 inline-block">
                    New
                  </span>
                )}
              </div>
              <h2 className="text-title text-white drop-shadow-md">
                {right.title}
              </h2>
            </div>
          </Link>
        )}
      </div>
    </section>
  )
}
