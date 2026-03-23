'use client'

import { PortableText, type PortableTextComponents } from '@portabletext/react'
import Image from 'next/image'
import Link from 'next/link'
import { urlFor } from '@/lib/sanity'

interface PortableTextRendererProps {
  value: any[]
}

const components: PortableTextComponents = {
  block: {
    normal: ({ children }) => (
      <p className="text-[clamp(1rem,1.15vw,1.1rem)] leading-[1.7] tracking-[-0.02em] text-gio-black/70 mb-6">
        {children}
      </p>
    ),
    h2: ({ children, value }) => {
      const id = value._key
      return (
        <h2
          id={id}
          className="text-headline text-gio-black mt-14 mb-5 scroll-mt-24"
        >
          {children}
        </h2>
      )
    },
    h3: ({ children, value }) => {
      const id = value._key
      return (
        <h3
          id={id}
          className="text-title text-gio-black mt-10 mb-4 scroll-mt-24"
        >
          {children}
        </h3>
      )
    },
    h4: ({ children, value }) => (
      <h4 className="text-body text-gio-black mt-8 mb-3">
        {children}
      </h4>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-2 border-gio-red pl-6 my-8 text-[clamp(1.05rem,1.2vw,1.15rem)] leading-[1.65] text-gio-black/55 italic">
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className="list-disc pl-6 mb-6 space-y-2 text-[clamp(1rem,1.15vw,1.1rem)] leading-[1.65] text-gio-black/70">
        {children}
      </ul>
    ),
    number: ({ children }) => (
      <ol className="list-decimal pl-6 mb-6 space-y-2 text-[clamp(1rem,1.15vw,1.1rem)] leading-[1.65] text-gio-black/70">
        {children}
      </ol>
    ),
  },
  listItem: {
    bullet: ({ children }) => <li>{children}</li>,
    number: ({ children }) => <li>{children}</li>,
  },
  marks: {
    strong: ({ children }) => (
      <span className="text-gio-black/90">{children}</span>
    ),
    em: ({ children }) => <em>{children}</em>,
    underline: ({ children }) => <span className="underline">{children}</span>,
    link: ({ value, children }) => {
      const href = value?.href || '#'
      const isExternal = href.startsWith('http') && !href.includes('giotile.com')
      return (
        <Link
          href={href}
          className="text-gio-red hover:text-gio-black transition-colors duration-300 underline underline-offset-2 decoration-gio-red/30 hover:decoration-gio-black/30"
          {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        >
          {children}
        </Link>
      )
    },
  },
  types: {
    image: ({ value }) => {
      if (!value?.asset) return null

      const imageUrl = urlFor(value).width(1200).url()

      return (
        <figure className="my-10">
          <div className="relative w-full overflow-hidden bg-gio-grey">
            <Image
              src={imageUrl}
              alt={value.alt || ''}
              width={1200}
              height={675}
              className="w-full h-auto"
              sizes="(max-width: 768px) 100vw, 800px"
            />
          </div>
          {value.caption && (
            <figcaption className="mt-3 text-small text-gio-black/40 tracking-[-0.01em]">
              {value.caption}
            </figcaption>
          )}
        </figure>
      )
    },
    youtube: ({ value }) => {
      if (!value?.url) return null

      // Extract video ID from various YouTube URL formats
      let videoId = ''
      try {
        const url = new URL(value.url)
        if (url.hostname.includes('youtube.com')) {
          videoId = url.searchParams.get('v') || ''
        } else if (url.hostname.includes('youtu.be')) {
          videoId = url.pathname.slice(1)
        }
      } catch {
        return null
      }

      if (!videoId) return null

      return (
        <div className="my-10 relative w-full overflow-hidden bg-gio-black" style={{ paddingBottom: '56.25%' }}>
          <iframe
            className="absolute inset-0 w-full h-full"
            src={`https://www.youtube.com/embed/${videoId}`}
            title="YouTube video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )
    },
  },
}

export default function PortableTextRenderer({ value }: PortableTextRendererProps) {
  if (!value || value.length === 0) return null

  return (
    <div className="portable-text">
      <PortableText value={value} components={components} />
    </div>
  )
}
