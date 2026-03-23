import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { name, email, company, message } = await request.json()

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // TODO: Connect to email service (SendGrid, Resend, etc.)
    // For now, log the submission and return success
    console.log('Contact form submission:', { name, email, company, message })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
