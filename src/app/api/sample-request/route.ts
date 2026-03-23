import { NextResponse } from 'next/server'
import { createClient } from '@sanity/client'

const writeClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-03-15',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, phone, company, address, city, state, zip, notes, items } = body

    const doc = {
      _type: 'sampleRequest',
      name,
      email,
      phone: phone || '',
      company: company || '',
      shippingAddress: [address, city, state, zip].filter(Boolean).join(', '),
      notes: notes || '',
      items: items.map((item: any, i: number) => ({
        _key: `item-${i}`,
        _type: 'sampleItem',
        collectionTitle: item.collectionTitle,
        colorName: item.colorName,
        size: item.size,
        sku: item.sku,
        product: item.productId
          ? { _type: 'reference', _ref: item.productId }
          : undefined,
      })),
      status: 'pending',
      submittedAt: new Date().toISOString(),
    }

    await writeClient.create(doc)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Sample request error:', error)
    return NextResponse.json(
      { error: 'Failed to submit request' },
      { status: 500 }
    )
  }
}
