export const createOriginal = (
  MnemeContractAddress: string | undefined,
  MnemeContractName: string | undefined,
  _MetadataViewsContractAddress: string | undefined,
  _NonFungibleTokenContractAddress: string | undefined,
) => {
  return `
  import ${MnemeContractName} from ${MnemeContractAddress}
  // This transaction is for the admin to create a new original resource
  // and store it in the Mneme smart contract storage

transaction(
    name: String,
    description: String,
    thumbnail: String,
    price: UFix64,
    artistAddress: Address,
    metadata: {String: String}) {

    let Administrator: &${MnemeContractName}.Administrator 

    prepare(admin: auth(BorrowValue) &Account) {
        self.Administrator = admin.storage.borrow<&${MnemeContractName}.Administrator>(from: ${MnemeContractName}.AdministratorStoragePath)!
    } 
    execute {
        let newCardID = self.Administrator.createOriginal(    
            name: name,
            description: description,
            thumbnail: thumbnail,
            artistAddress: artistAddress,
            price: price,
            metadata: metadata) 
        }
}
        `
}
