/**
 * Returns the Cadence script to fetch Echo's consciousness from the contract.
 */
export const getConsciousnessScript = (EchoNoahContractAddress: string) => {
  return `
import EchoNoah from ${EchoNoahContractAddress}

access(all) fun main(): String {
    return EchoNoah.getConsciousness()
}
`
}
