import crypto from 'crypto'

export async function POST(request: Request) {
  const webhookSecret = process.env.MOONPAY_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('MOONPAY_WEBHOOK_SECRET is not set')
    return Response.json(
      { error: 'Server configuration error' },
      { status: 500 }
    )
  }

  const signatureHeader = request.headers.get('moonpay-signature-v2')
  if (!signatureHeader) {
    return Response.json(
      { error: 'Missing Moonpay-Signature-V2 header' },
      { status: 400 }
    )
  }

  const parts = signatureHeader.split(',')
  const timestampMatch = parts.find((p) => p.startsWith('t='))
  const signatureMatch = parts.find((p) => p.startsWith('s='))

  if (!timestampMatch || !signatureMatch) {
    return Response.json(
      { error: 'Invalid signature format' },
      { status: 400 }
    )
  }

  const timestamp = timestampMatch.split('=')[1]
  const receivedSignature = signatureMatch.split('=')[1]

  const rawBody = await request.text()
  const signedPayload = `${timestamp}.${rawBody}`

  const computedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(signedPayload)
    .digest('hex')

  if (computedSignature !== receivedSignature) {
    console.error('Webhook signature verification failed')
    return Response.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let webhookData: { type?: string; data?: unknown }
  try {
    webhookData = JSON.parse(rawBody)
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  console.log('MoonPay webhook received:', {
    type: webhookData.type,
    data: webhookData.data,
    timestamp,
  })

  switch (webhookData.type) {
    case 'transaction_updated':
      console.log('Transaction updated:', webhookData.data)
      break
    case 'transaction_created':
      console.log('Transaction created:', webhookData.data)
      break
    default:
      console.log('Unknown webhook type:', webhookData.type)
  }

  return Response.json({ received: true }, { status: 200 })
}
