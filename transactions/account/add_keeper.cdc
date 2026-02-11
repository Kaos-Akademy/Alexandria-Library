// add_keeper.cdc

import "Alexandria"

transaction(
    bookTitle: String,
    keeper: Address
) {
    /// Reference to the withdrawer's collection
 //   let accountRef: auth(Alexandria.AccountActions) &Alexandria.Account

    prepare (deployer: auth(BorrowValue) &Account) {
        // call function from Alexandria contract
        Alexandria.addKeeper(bookTitle: bookTitle, keeper: keeper) 
       
    }

    execute {
       // self.accountRef.addKeeper(bookTitle: bookTitle, keeper: keeper)
    }
}