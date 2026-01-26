import "Alexandria"

transaction(
    genre: String
    ) {
    /// Reference to the withdrawer's collection
    let AdminRef: auth(Alexandria.AdminActions) &Alexandria.Admin

    prepare (deployer: auth(BorrowValue) &Account) {
        // borrow a reference to the signer's NFT collection
        self.AdminRef = deployer.storage.borrow<auth(Alexandria.AdminActions) &Alexandria.Admin>(
                from: Alexandria.AdminStoragePath
        ) ?? panic("Account does not store an object at the specified path")

        let unused = self.AdminRef.addGenre(genre: genre) 
    }

} 