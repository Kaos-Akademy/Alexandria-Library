export const adminMintCertificate = (
  MnemeContractAddress: string | undefined,
  MnemeContractName: string | undefined,
) => {
  return `
      
      import ${MnemeContractName} from ${MnemeContractAddress}
// This transaction is to mint a new certificate NFT
// 

    transaction(
        artistAddress: Address,
        editionId: UInt64,
        thumbnail: String) {

    let Administrator: &${MnemeContractName}.Administrator

    prepare(admin: auth(BorrowValue) &Account) {
        self.Administrator = admin.storage.borrow<auth(${MnemeContractName}.MintCertificateNFT) &${MnemeContractName}.Administrator>(from: ${MnemeContractName}.AdministratorStoragePath)!
    }
    execute {
        let newCardID = self.Administrator.mintCertificateNFT(
            artistAddress: artistAddress,
            editionId: editionId,
            thumbnail: thumbnail)   
    }
}
            `
}
