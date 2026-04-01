/**
 * Flow contract addresses. Librarian (Alexandria) and EchoNoah (portfolio).
 */

const LIBRARIAN_ADDRESS =
  process.env.LIBRARIAN_ADDRESS || '0x6d96bf7d95a8b595'

const ECHO_NOAH_ADDRESS =
  process.env.ECHO_NOAH_CONTRACT_ADDRESS || '0x6d96bf7d95a8b595'

export function getLibrarianAddress(): string {
  return LIBRARIAN_ADDRESS
}

export function getEchoNoahAddress(): string {
  return ECHO_NOAH_ADDRESS
}

export const flowAddresses = {
  Librarian: LIBRARIAN_ADDRESS,
  EchoNoah: ECHO_NOAH_ADDRESS,
}
