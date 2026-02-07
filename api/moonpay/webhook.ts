import type { VercelRequest, VercelResponse } from '@vercel/node'
import crypto from 'crypto'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get webhook secret from environment variable
    const webhookSecret = process.env.MOONPAY_WEBHOOK_SECRET

    if (!webhookSecret) {
      console.error('MOONPAY_WEBHOOK_SECRET is not set')
      return res.status(500).json({ error: 'Server configuration error' })
    }

    // Get signature from header
    const signatureHeader = req.headers['moonpay-signature-v2'] as string

    if (!signatureHeader) {
      return res.status(400).json({ error: 'Missing Moonpay-Signature-V2 header' })
    }

    // Parse signature header: format is "t=<timestamp>,s=<signature>"
    const parts = signatureHeader.split(',')
    const timestampMatch = parts.find((p) => p.startsWith('t='))
    const signatureMatch = parts.find((p) => p.startsWith('s='))

    if (!timestampMatch || !signatureMatch) {
      return res.status(400).json({ error: 'Invalid signature format' })
    }

    const timestamp = timestampMatch.split('=')[1]
    const receivedSignature = signatureMatch.split('=')[1]

    // Get raw body (Vercel provides this as a string)
    const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body)

    // Create signed payload: timestamp + '.' + body
    const signedPayload = `${timestamp}.${rawBody}`

    // Compute HMAC-SHA256 signature
    const computedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(signedPayload)
      .digest('hex')

    // Compare signatures (use timing-safe comparison in production)
    if (computedSignature !== receivedSignature) {
      console.error('Webhook signature verification failed', {
        computed: computedSignature,
        received: receivedSignature,
      })
      return res.status(401).json({ error: 'Invalid signature' })
    }

    // Signature verified - process webhook
    const webhookData = typeof req.body === 'object' ? req.body : JSON.parse(rawBody)

    // Log webhook event for debugging
    console.log('MoonPay webhook received:', {
      type: webhookData.type,
      data: webhookData.data,
      timestamp,
    })

    // Handle different webhook event types
    // See: https://dev.moonpay.com/docs/using-webhooks
    switch (webhookData.type) {
      case 'transaction_updated':
        // Transaction status changed
        // You can update your database, send notifications, etc.
        console.log('Transaction updated:', webhookData.data)
        break

      case 'transaction_created':
        // New transaction created
        console.log('Transaction created:', webhookData.data)
        break

      default:
        console.log('Unknown webhook type:', webhookData.type)
    }

    // Always return 200 to acknowledge receipt
    return res.status(200).json({ received: true })
  } catch (error) {
    console.error('Error processing MoonPay webhook:', error)
    return res.status(500).json({ error: 'Failed to process webhook' })
  }
}
