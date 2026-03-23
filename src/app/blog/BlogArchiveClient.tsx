'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { urlFor } from '@/lib/sanity'
import type { Post, Category } from '@/lib/sanity'
import ScrollReveal from '@/components/ScrollReveal'

interface Props {
  posts: Post[]
  categories: Category[]
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function BlogArchiveClient({ posts, categories }: Props) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const filteredPosts = useMemo(() => {
    if (!activeCategory) return posts
    return posts.filter((post) =>
      post.categories?.some((cat) => cat.slug.current === activeCategory)
    )
  }, [posts, activeCategory])

  // Get first post as featured (if no category filter)
  const featuredPost = !activeCategory && filteredPosts.length > 0 ? filteredPosts[0] : null
  const gridPosts = featuredPost ? filteredPosts.slice(1) : filteredPosts

  return (
    <section className="pb-section">
      <div className="container-gio">
        {/* Category filter pills */}
        <div className="flex flex-wrap gap-2 mb-12">
          <button
            onClick={() => setActiveCategory(null)}
            className={`toggle-btn ${!activeCategory ? 'toggle-btn-active' : 'toggle-btn-inactive'}`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() =>
                setActiveCategory(
                  activeCategory === cat.slug.current ? null : cat.slug.current
                )
              }
              className={`toggle-btn ${
                activeCategory === cat.slug.current
                  ? 'toggle-btn-active'
                  : 'toggle-btn-inactive'
              }`}
            >
              {cat.title}
            </button>
          ))}
        </div>

        {/* Featured post (only when showing all) */}
        {featuredPost && (
          <ScrollReveal className="mb-16">
            <Link
              href={`/blog/${featuredPost.slug.current}`}
              className="group grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-gio-grey">
                {featuredPost.mainImage ? (
                  <Image
                    src={urlFor(featuredPost.mainImage).width(960).height(600).url()}
                    alt={featuredPost.title}
                    fill
                    className="object-cover img-zoom"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority
                  />
                ) : (
                  <div className="absolute inset-0 bg-gio-grey" />
                )}
              </div>
              <div className="flex flex-col justify-center">
                {featuredPost.categories?.[0] && (
                  <span className="text-small tracking-[0.1em] uppercase text-gio-black/35 mb-4">
                    {featuredPost.categories[0].title}
                  </span>
                )}
                <h2 className="text-headline text-gio-black group-hover:text-gio-red transition-colors duration-300 mb-4">
                  {featuredPost.title}
                </h2>
                {featuredPost.excerpt && (
                  <p className="text-body-lg line-clamp-3 mb-6">
                    {featuredPost.excerpt}
                  </p>
                )}
                <div className="flex items-center gap-3 text-caption text-gio-black/35">
                  {featuredPost.author?.name && (
                    <>
                      <span>{featuredPost.author.name}</span>
                      <span className="text-gio-black/15">/</span>
                    </>
                  )}
                  <time dateTime={featuredPost.publishedAt}>
                    {formatDate(featuredPost.publishedAt)}
                  </time>
                </div>
              </div>
            </Link>
          </ScrollReveal>
        )}

        {/* Post grid */}
        {filteredPosts.length === 0 ? (
          <p className="text-body text-gio-black/40 py-20 text-center">
            No posts found in this category.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12">
            {gridPosts.map((post, i) => (
              <ScrollReveal key={post._id} delay={i % 3 * 80}>
                <Link
                  href={`/blog/${post.slug.current}`}
                  className="group block"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-gio-grey mb-5">
                    {post.mainImage ? (
                      <Image
                        src={urlFor(post.mainImage).width(640).height(400).url()}
                        alt={post.title}
                        fill
                        className="object-cover img-zoom"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gio-grey" />
                    )}
                  </div>
                  {post.categories?.[0] && (
                    <span className="text-small tracking-[0.1em] uppercase text-gio-black/30 mb-2.5 block">
                      {post.categories[0].title}
                    </span>
                  )}
                  <h3 className="text-title text-gio-black group-hover:text-gio-red transition-colors duration-300 mb-2.5 line-clamp-2">
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p className="text-caption text-gio-black/45 line-clamp-2 mb-3">
                      {post.excerpt}
                    </p>
                  )}
                  <time
                    dateTime={post.publishedAt}
                    className="text-small text-gio-black/25"
                  >
                    {formatDate(post.publishedAt)}
                  </time>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
