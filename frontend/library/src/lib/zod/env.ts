/**
 * Environment variables for Flow services.
 * Re-exports from env for compatibility with @/lib/zod/env imports.
 */

export const env = {
  get BLOCKCHAIN_API_URL() {
    return process.env.BLOCKCHAIN_API_URL
  },
  get LIBRARIAN_ADDRESS() {
    return process.env.LIBRARIAN_ADDRESS || '0x6d96bf7d95a8b595'
  },
}
