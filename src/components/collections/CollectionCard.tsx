import Image from 'next/image'
import Link from 'next/link'
import MetaSpans from './MetaSpans'

interface CollectionCardProps {
  collection: any
  /** Link base path, defaults to /collections */
  basePath?: string
}

export default function CollectionCard({ collection, basePath = '/collections' }: CollectionCardProps) {
  return (
    <Link
      href={`${basePath}/${collection.slug.current}`}
      className="group block"
    >
      <article className="relative bg-gio-grey overflow-hidden aspect-[4/5]">
        {/* Image — fills entire card */}
        {collection.heroImageUrl && (
          <Image
            src={collection.heroImageUrl}
            alt={collection.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        )}

        {/* Header bar — slides out top on hover */}
        <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between min-h-[55px] px-[15px] py-3.5 bg-gio-grey transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-full group-hover:opacity-0">
          <span className="flex-1 text-body text-gio-black tracking-[-0.02em]">
            {collection.title}
          </span>
          {collection.featured && (
            <span className="bg-gio-black text-white text-small px-3.5 py-1.5 flex-shrink-0">
              New
            </span>
          )}
        </div>

        {/* Red info overlay — slides up from bottom on hover */}
        <div className="absolute inset-x-0 bottom-0 z-10 bg-gio-red translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] p-5 flex flex-col gap-1.5">
          <h3 className="text-[20px] tracking-[-0.02em] leading-none text-white">
            {collection.title}
          </h3>
          <div className="text-caption text-white/80">
            <MetaSpans collection={collection} />
          </div>
          {collection.technicalSummary && (
            <p className="text-small text-white/60 mt-1 leading-relaxed line-clamp-2">
              {collection.technicalSummary}
            </p>
          )}
        </div>
      </article>
    </Link>
  )
}
