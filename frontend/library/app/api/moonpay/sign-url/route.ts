import crypto from 'crypto'

function corsHeaders(origin: string | null): Record<string, string> {
  const h: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  }
  if (origin) h['Access-Control-Allow-Origin'] = origin
  return h
}

export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin') || request.headers.get('referer')
  return new Response(null, { status: 200, headers: corsHeaders(origin) })
}

export async function POST(request: Request) {
  const origin = request.headers.get('origin') || request.headers.get('referer')

  const secretKey = process.env.MOONPAY_SECRET_KEY
  if (!secretKey) {
    console.error('[MoonPay Sign URL] MOONPAY_SECRET_KEY is not set')
    return Response.json(
      { error: 'Server configuration error: MOONPAY_SECRET_KEY not set' },
      { status: 500, headers: corsHeaders(origin) }
    )
  }

  let body: { url?: string }
  try {
    body = await request.json()
  } catch {
    return Response.json(
      { error: 'Invalid JSON body' },
      { status: 400, headers: corsHeaders(origin) }
    )
  }

  const { url } = body ?? {}
  if (!url || typeof url !== 'string') {
    return Response.json(
      { error: 'URL is required' },
      { status: 400, headers: corsHeaders(origin) }
    )
  }

  const urlObj = new URL(url)
  const queryString = urlObj.search
  if (!queryString) {
    return Response.json(
      { error: 'URL must contain query parameters' },
      { status: 400, headers: corsHeaders(origin) }
    )
  }

  const signature = crypto
    .createHmac('sha256', secretKey)
    .update(queryString)
    .digest('base64')

  return Response.json({ signature }, { status: 200, headers: corsHeaders(origin) })
}
