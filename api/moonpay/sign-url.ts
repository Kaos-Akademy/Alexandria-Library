import type { VercelRequest, VercelResponse } from '@vercel/node'
import crypto from 'crypto'

// #region agent log
const logDebug = (message: string, data: any) => {
  const logEntry = {
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    location: 'api/moonpay/sign-url.ts',
    message,
    data,
    runId: 'production-debug',
    hypothesisId: 'A'
  }
  console.log('[DEBUG]', JSON.stringify(logEntry))
}
// #endregion agent log

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // #region agent log
  logDebug('Request entry', {
    method: req.method,
    url: req.url,
    headers: Object.keys(req.headers),
    hasBody: !!req.body,
    origin: req.headers.origin,
    referer: req.headers.referer,
  })
  // #endregion agent log

  // Set CORS headers
  const origin = req.headers.origin || req.headers.referer
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Access-Control-Max-Age', '86400')

  // Handle OPTIONS preflight request
  if (req.method === 'OPTIONS') {
    // #region agent log
    logDebug('OPTIONS preflight handled', { origin })
    // #endregion agent log
    return res.status(200).end()
  }

  // Log request for debugging
  console.log('[MoonPay Sign URL] Request received:', {
    method: req.method,
    url: req.url,
    hasBody: !!req.body,
    envKeySet: !!process.env.MOONPAY_SECRET_KEY,
  })

  // Only allow POST requests
  if (req.method !== 'POST') {
    // #region agent log
    logDebug('Method not allowed', { method: req.method, expected: 'POST' })
    // #endregion agent log
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // #region agent log
    logDebug('Parsing request body', { bodyType: typeof req.body, bodyKeys: req.body ? Object.keys(req.body) : null })
    // #endregion agent log

    const { url } = req.body

    // #region agent log
    logDebug('URL extracted from body', { url: url ? `${url.substring(0, 50)}...` : null, urlType: typeof url })
    // #endregion agent log

    if (!url || typeof url !== 'string') {
      // #region agent log
      logDebug('URL validation failed', { url, urlType: typeof url })
      // #endregion agent log
      return res.status(400).json({ error: 'URL is required' })
    }

    // Get secret key from environment variable
    const secretKey = process.env.MOONPAY_SECRET_KEY

    // #region agent log
    logDebug('Secret key check', { hasKey: !!secretKey, keyLength: secretKey ? secretKey.length : 0 })
    // #endregion agent log

    if (!secretKey) {
      console.error('[MoonPay Sign URL] MOONPAY_SECRET_KEY is not set')
      console.error('[MoonPay Sign URL] Available env vars:', Object.keys(process.env).filter(k => k.includes('MOONPAY')))
      // #region agent log
      logDebug('Secret key missing', { availableEnvVars: Object.keys(process.env).filter(k => k.includes('MOONPAY')) })
      // #endregion agent log
      return res.status(500).json({ error: 'Server configuration error: MOONPAY_SECRET_KEY not set' })
    }

    // Parse the URL to get the query string
    const urlObj = new URL(url)
    const queryString = urlObj.search

    // #region agent log
    logDebug('URL parsed', { hasQueryString: !!queryString, queryStringLength: queryString.length })
    // #endregion agent log

    if (!queryString) {
      // #region agent log
      logDebug('Query string validation failed', { url, queryString })
      // #endregion agent log
      return res.status(400).json({ error: 'URL must contain query parameters' })
    }

    // Generate HMAC-SHA256 signature
    const signature = crypto
      .createHmac('sha256', secretKey)
      .update(queryString)
      .digest('base64')

    // #region agent log
    logDebug('Signature generated', { signatureLength: signature.length })
    // #endregion agent log

    // Return the signature (not URL-encoded, as the SDK handles encoding)
    return res.status(200).json({ signature })
  } catch (error) {
    // #region agent log
    logDebug('Error caught', { 
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined
    })
    // #endregion agent log
    console.error('Error signing MoonPay URL:', error)
    return res.status(500).json({ error: 'Failed to sign URL' })
  }
}
