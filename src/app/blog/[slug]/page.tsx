import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getPostBySlug, getAllPostSlugs, getRecentPosts, urlFor } from '@/lib/sanity'
import type { Post } from '@/lib/sanity'
import PortableTextRenderer from '@/components/PortableTextRenderer'
import ScrollReveal from '@/components/ScrollReveal'

export const revalidate = 3600

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const slugs = await getAllPostSlugs()
  return slugs.map((s: { slug: string }) => ({ slug: s.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post: Post | null = await getPostBySlug(slug)
  if (!post) return { title: 'Post Not Found' }

  const title = post.seoTitle || post.title
  const description =
    post.seoDescription || post.excerpt || `Read ${post.title} on the GIO Tile blog.`
  const image = post.mainImage ? urlFor(post.mainImage).width(1200).height(630).url() : undefined

  return {
    title,
    description,
    openGraph: {
      title: `${title} | GIO Tile`,
      description,
      type: 'article',
      publishedTime: post.publishedAt,
      authors: post.author?.name ? [post.author.name] : undefined,
      ...(image ? { images: [{ url: image, width: 1200, height: 630 }] } : {}),
    },
    alternates: {
      canonical: `/blog/${slug}`,
    },
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const [post, recentPosts] = await Promise.all([
    getPostBySlug(slug),
    getRecentPosts(4),
  ])

  if (!post) notFound()

  // Filter out current post from recent
  const relatedPosts = (recentPosts as Post[])
    .filter((p) => p._id !== post._id)
    .slice(0, 3)

  return (
    <article>
      {/* Post header */}
      <header className="pt-section pb-10">
        <div className="container-gio max-w-4xl mx-auto px-container">
          {/* Category breadcrumb */}
          <div className="flex items-center gap-2 text-small tracking-[0.1em] uppercase text-gio-black/30 mb-6">
            <Link
              href="/blog"
              className="hover:text-gio-red transition-colors"
            >
              Blog
            </Link>
            {post.categories?.[0] && (
              <>
                <span>/</span>
                <span>{post.categories[0].title}</span>
              </>
            )}
          </div>

          <h1 className="heading-page text-balance mb-6">{post.title}</h1>

          {/* Meta line */}
          <div className="flex flex-wrap items-center gap-3 text-caption text-gio-black/35">
            {post.author?.name && (
              <>
                <span>{post.author.name}</span>
                <span className="text-gio-black/15">/</span>
              </>
            )}
            <time dateTime={post.publishedAt}>
              {formatDate(post.publishedAt)}
            </time>
          </div>
        </div>
      </header>

      {/* Hero image */}
      {post.mainImage && (
        <ScrollReveal className="container-gio mb-12">
          <div className="relative aspect-[21/9] max-h-[560px] overflow-hidden bg-gio-grey">
            <Image
              src={urlFor(post.mainImage).width(1600).height(686).url()}
              alt={(post.mainImage as any)?.alt || post.title}
              fill
              className="object-cover"
              sizes="100vw"
              priority
            />
          </div>
        </ScrollReveal>
      )}

      {/* Body content */}
      <div className="container-gio">
        <div className="max-w-3xl mx-auto">
          <ScrollReveal>
            <PortableTextRenderer value={post.body || []} />
          </ScrollReveal>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="mt-14 pt-8 border-t border-gio-black/5">
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag: { _id: string; title: string; slug: { current: string } }) => (
                  <span
                    key={tag._id}
                    className="text-small bg-gio-grey text-gio-black/45 px-3 py-1.5 rounded-full"
                  >
                    {tag.title}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Related posts */}
      {relatedPosts.length > 0 && (
        <section className="mt-section pb-section border-t border-gio-black/5">
          <div className="container-gio pt-section">
            <h2 className="heading-section mb-10">More from the Blog</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-10">
              {relatedPosts.map((relPost, i) => (
                <ScrollReveal key={relPost._id} delay={i * 80}>
                  <Link
                    href={`/blog/${relPost.slug.current}`}
                    className="group block"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden bg-gio-grey mb-4">
                      {relPost.mainImage ? (
                        <Image
                          src={urlFor(relPost.mainImage)
                            .width(480)
                            .height(300)
                            .url()}
                          alt={relPost.title}
                          fill
                          className="object-cover img-zoom"
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gio-grey" />
                      )}
                    </div>
                    <h3 className="text-title text-gio-black group-hover:text-gio-red transition-colors duration-300 line-clamp-2 mb-2">
                      {relPost.title}
                    </h3>
                    <time
                      dateTime={relPost.publishedAt}
                      className="text-small text-gio-black/25"
                    >
                      {formatDate(relPost.publishedAt)}
                    </time>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: post.title,
            datePublished: post.publishedAt,
            author: post.author?.name
              ? { '@type': 'Person', name: post.author.name }
              : undefined,
            publisher: {
              '@type': 'Organization',
              name: 'GIO Architectural Tile & Stone',
              url: 'https://giotile.com',
            },
            image: post.mainImage
              ? urlFor(post.mainImage).width(1200).height(630).url()
              : undefined,
            description:
              post.seoDescription || post.excerpt || `${post.title} - GIO Tile Blog`,
          }),
        }}
      />
    </article>
  )
}
