import { NextResponse } from 'next/server'
import { client } from '@/lib/sanity'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')

  if (!q || q.length < 2) {
    return NextResponse.json({ products: [] })
  }

  const products = await client.fetch(
    `*[_type == "product" && (colorName match $query + "*" || title match $query + "*")] | order(colorName asc)[0...20] {
      _id,
      title,
      colorName,
      collection->{title, slug},
      finishes[] {
        skus[] { code, size }
      }
    }`,
    { query: q } as Record<string, string>
  )

  return NextResponse.json({ products })
}
