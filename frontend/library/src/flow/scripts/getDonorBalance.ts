export const getDonorBalance = () => `
import FlowToken from 0x1654653399040a61

access(all) fun main(): UFix64 {
    let account = getAccount(0xfed1adffd14ea9d0)
    
    let balanceRef = account.capabilities.borrow<&FlowToken.Vault>(/public/flowTokenBalance)
        ?? panic("Could not borrow FlowToken balance reference")
    
    return balanceRef.balance
}
`

