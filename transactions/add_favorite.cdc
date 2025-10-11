import Alexandria from "../contracts/Alexandria.cdc"

transaction(title: String) {
    /// Reference to the withdrawer's collection
    let userPreferenceRef: &Alexandria.UserPreferences

    prepare (signer: auth(BorrowValue, IssueStorageCapabilityController, PublishCapability, SaveValue, UnpublishCapability) &Account) {
        // Check if the account already has a receipt storage
        if signer.storage.type(at: Alexandria.UserPreferenceStorage) == nil {
            let storage <- Alexandria.createEmptyPreferences()
            signer.storage.save(<- storage, to: Alexandria.UserPreferenceStorage)
            // create a public capability for the storage
            let storageCap = signer.capabilities.storage.issue<&{Alexandria.UserPreferencesPublic}>(Alexandria.UserPreferenceStorage)
            signer.capabilities.publish(storageCap, at: Alexandria.UserPreferencePublic)
        }
        // borrow a reference to the signer's NFT collection
        self.userPreferenceRef = signer.storage.borrow<&Alexandria.UserPreferences>(
                from: Alexandria.UserPreferenceStorage
        ) ?? panic("Account does not store an object at the specified path")

    }

  execute {
        self.userPreferenceRef.addFavorite(bookName: title)
  }
}