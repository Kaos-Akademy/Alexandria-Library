# MoonPay Integration Setup

This document describes the environment variables and setup required for MoonPay integration.

## Environment Variables

### Frontend (Public - Safe to expose)

Add to your `.env.local` file or Vercel environment variables:

```bash
VITE_MOONPAY_API_KEY=pk_live_...  # Your MoonPay publishable API key
```

**Note**: Vite uses `VITE_` prefix for environment variables. If using Next.js, use `NEXT_PUBLIC_MOONPAY_API_KEY` instead.

### Backend (Secret - Never expose)

Add to Vercel environment variables (Settings → Environment Variables):

```bash
MOONPAY_SECRET_KEY=sk_live_...  # Your MoonPay secret key for URL signing
```

**Important**: The secret key must be kept server-side only. It's used by the `/api/moonpay/sign-url` endpoint to sign widget URLs.

## MoonPay Dashboard Setup

1. **Create MoonPay Account**: Sign up at https://dashboard.moonpay.com/signup

2. **Get API Keys**:
   - Navigate to Dashboard → Developers → API Keys
   - Copy your **Publishable Key** (`pk_live_...`) for frontend
   - Copy your **Secret Key** (`sk_live_...`) for backend

3. **Domain Whitelisting** (Required for iframe/overlay widget):
   - Navigate to Dashboard → Settings
   - Add your production domain(s) to the whitelist:
     - `alexandrialib.online` (without www and without trailing slash)
     - `www.alexandrialib.online` (if you use www subdomain)
     - Your Vercel preview URLs if testing: `*.vercel.app`
   - **Important**: Domain must match exactly - no trailing slashes, include both www and non-www if you use both
   - Without this, the widget will fail with CSP errors like: "Framing 'https://buy.moonpay.com/' violates the following Content Security Policy directive"

4. **Verify FLOW Support**:
   - Ensure FLOW token is enabled in your MoonPay account
   - Check currency code is `flow` (lowercase)

## Production Checklist

Before going live:

- [ ] MoonPay production account created
- [ ] Production API keys obtained (`pk_live_...` and `sk_live_...`)
- [ ] Production domain(s) whitelisted in MoonPay dashboard
- [ ] `VITE_MOONPAY_API_KEY` set in environment variables (frontend)
- [ ] `MOONPAY_SECRET_KEY` set in Vercel environment variables (backend)
- [ ] URL signing endpoint tested (`/api/moonpay/sign-url`)
- [ ] Widget tested with signed URLs
- [ ] FLOW currency code verified in MoonPay dashboard
- [ ] Library address (`0xfed1adffd14ea9d0`) verified as valid Flow address

## Testing

### Local Development

**Important**: API routes (`/api/moonpay/sign-url`) only work when:
- Deployed to Vercel (production/preview), OR
- Using `vercel dev` command (not `npm run dev`)

To test locally:
```bash
# Install Vercel CLI if needed
npm i -g vercel

# Link your project
vercel link

# Run dev server with API routes
vercel dev
```

This will start both your frontend and API routes locally.

### Sandbox Mode

For testing in sandbox mode, use:
- Publishable key: `pk_test_...`
- Secret key: `sk_test_...`

The widget will work the same way, but transactions will be on testnet.

## Troubleshooting

### Widget doesn't load
- Check domain is whitelisted in MoonPay dashboard
- Verify API key is correct
- Check browser console for errors
- Ensure URL signing endpoint is working

### URL signing fails
- Verify `MOONPAY_SECRET_KEY` is set in Vercel environment variables
- Check API endpoint logs for errors
- Ensure secret key matches the publishable key's account

### FLOW not available / "Coming soon to your region!"
- **Check FLOW availability**: Go to MoonPay Dashboard → Currencies → Search for "FLOW"
- **Verify FLOW is enabled**: Ensure FLOW is enabled for your account
- **Region restrictions**: FLOW may not be available in all regions. Check MoonPay's supported regions
- **Contact MoonPay support**: If FLOW should be available but shows "Coming soon", contact MoonPay support to enable it for your account/region
- **Currency code**: Ensure you're using `flow` (lowercase) as the currency code

### CSP (Content Security Policy) Errors
- **Error**: "Framing 'https://buy.moonpay.com/' violates the following Content Security Policy directive"
- **Fix**: 
  1. Go to MoonPay Dashboard → Settings → Domain Whitelist
  2. Add your exact domain: `alexandrialib.online` (no www, no trailing slash)
  3. If you use www, also add: `www.alexandrialib.online`
  4. Save and wait a few minutes for changes to propagate
  5. Clear browser cache and try again
