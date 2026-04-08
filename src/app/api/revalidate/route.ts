import { revalidatePath } from 'next/cache'
import { type NextRequest, NextResponse } from 'next/server'

/**
 * Sanity webhook → on-demand revalidation
 *
 * Configure in Sanity Studio (Manage → API → Webhooks):
 *   URL:     https://giotile.epochworks.co/api/revalidate
 *   Dataset: production
 *   Trigger: Create, Update, Delete
 *   Filter:  _type in ["collection", "product", "post", "page", "category", "tag", "author", "look", "style", "color", "finish", "sizeType", "siteSettings"]
 *   HTTP method: POST
 *   Headers: x-revalidate-secret = <value of SANITY_REVALIDATE_SECRET env var>
 *   Projection:
 *     {
 *       _type,
 *       "slug": slug.current,
 *       "collectionSlug": collection->slug.current
 *     }
 */
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-revalidate-secret')
  if (!process.env.SANITY_REVALIDATE_SECRET) {
    return NextResponse.json(
      { error: 'SANITY_REVALIDATE_SECRET not configured on server' },
      { status: 500 }
    )
  }
  if (secret !== process.env.SANITY_REVALIDATE_SECRET) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 })
  }

  let body: any = {}
  try {
    body = await req.json()
  } catch {
    // empty body is fine — we'll revalidate everything
  }

  const { _type, slug, collectionSlug } = body || {}
  const paths = new Set<string>(['/'])

  switch (_type) {
    case 'collection':
      paths.add('/collections')
      paths.add('/tile-stone')
      if (slug) paths.add(`/collections/${slug}`)
      break
    case 'product':
      paths.add('/tile-stone')
      if (collectionSlug) paths.add(`/collections/${collectionSlug}`)
      break
    case 'post':
      paths.add('/blog')
      if (slug) paths.add(`/blog/${slug}`)
      break
    case 'page':
      if (slug) paths.add(`/${slug}`)
      break
    case 'category':
    case 'tag':
    case 'author':
      paths.add('/blog')
      break
    case 'look':
    case 'style':
    case 'color':
    case 'finish':
    case 'sizeType':
      paths.add('/collections')
      paths.add('/tile-stone')
      break
    default:
      // Unknown type — revalidate the big pages as a safety net
      paths.add('/collections')
      paths.add('/tile-stone')
      paths.add('/blog')
  }

  const pathList = Array.from(paths)
  pathList.forEach((p) => revalidatePath(p))

  return NextResponse.json({
    revalidated: true,
    type: _type || 'unknown',
    paths: pathList,
    now: Date.now(),
  })
}

// Health check (GET) — handy for sanity-checking the endpoint is live
export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: '/api/revalidate',
    method: 'POST',
    configured: Boolean(process.env.SANITY_REVALIDATE_SECRET),
  })
}
