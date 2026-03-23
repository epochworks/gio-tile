import Image from 'next/image'
import Link from 'next/link'
import { urlFor } from '@/lib/sanity'
import type { SanityImageSource } from '@sanity/image-url/lib/types/types'

interface ProductCardProps {
  title: string
  slug: string
  image: SanityImageSource
  isNew?: boolean
  colors?: { hex: string }[]
  technicalSummary?: string
}

export default function ProductCard({
  title,
  slug,
  image,
  isNew = false,
  colors = [],
  technicalSummary,
}: ProductCardProps) {
  return (
    <Link href={`/collections/${slug}`} className="group block">
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-gio-grey mb-4">
        {/* New Badge */}
        {isNew && (
          <span className="badge absolute top-3 right-3 z-10">New</span>
        )}

        {/* Image */}
        <Image
          src={urlFor(image).width(600).height(600).url()}
          alt={title}
          fill
          className="object-cover img-zoom"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gio-black/0 group-hover:bg-gio-black/10 transition-colors duration-300" />
      </div>

      {/* Title */}
      <h3 className="text-body font-medium text-gio-black group-hover:text-gio-red transition-colors">
        {title}
      </h3>

      {/* Technical Summary - shows on hover */}
      {technicalSummary && (
        <p className="text-small text-gio-black/60 mt-1 line-clamp-1">
          {technicalSummary}
        </p>
      )}

      {/* Color Dots */}
      {colors.length > 0 && (
        <div className="flex items-center gap-1.5 mt-3">
          {colors.slice(0, 4).map((color, index) => (
            <span
              key={index}
              className="color-dot"
              style={{ backgroundColor: color.hex }}
              aria-label={`Available in ${color.hex}`}
            />
          ))}
          {colors.length > 4 && (
            <span className="text-small text-gio-black/40">+{colors.length - 4}</span>
          )}
        </div>
      )}
    </Link>
  )
}
