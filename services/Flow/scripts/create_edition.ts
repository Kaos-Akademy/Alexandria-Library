export const createEdition = (
  MnemeContractAddress: string | undefined,
  MnemeContractName: string | undefined,
  _MetadataViewsContractAddress: string | undefined,
  _NonFungibleTokenContractAddress: string | undefined,
) => {
  return `

  import ${MnemeContractName} from ${MnemeContractAddress}
    // This transaction is for the admin to create a new edition resource
    // and store it in the Mneme smart contract storage

transaction(
    originalId: UInt64,
    name: String,
    price: UFix64,
    type: String,
    story: String,
    dimensions: {String: String},
    reprintLimit: Int64,
    artistAddress: Address,
    multipliers: [UFix64],
    profitSplitAddresses: [Address],
    profitSplitPercentages: [UFix64]) {

    let Administrator: &${MnemeContractName}.Administrator 

    prepare(admin: auth(BorrowValue) &Account) {
        self.Administrator = admin.storage.borrow<&${MnemeContractName}.Administrator>(from: ${MnemeContractName}.AdministratorStoragePath)!
    } 
    execute {
        // Check that both arrays have the same length
        assert(profitSplitAddresses.length == profitSplitPercentages.length, message: "profitSplitAddresses and profitSplitPercentages must have the same length")
        
        // Create the profit split map from the two arrays
        var profitSplit: {Address: UFix64} = {}
        var i: Int = 0
        while i < profitSplitAddresses.length {
            profitSplit[profitSplitAddresses[i]] = profitSplitPercentages[i]
            i = i + 1
        }
        
        let newCardID = self.Administrator.createEdition(    
            originalId: originalId,
            name: name,
            price: price,
            type: type,
            story: story,
            dimensions: dimensions,
            reprintLimit: reprintLimit,
            artistAddress: artistAddress,
            multipliers: multipliers,
            profitSplit: profitSplit) 
    }
}
        `
}
