// The Alexandria Library - Preserving Knowledge Forever
//
// The ancient Library of Alexandria was one of the largest and most significant libraries 
// of the ancient world, dedicated to the Muses and housing the greatest collection of 
// knowledge in human history. Its tragic destruction represented an immeasurable loss 
// to humanity's collective wisdom.
//
// This smart contract honors that legacy by creating a decentralized, immutable library 
// on the Flow blockchain. By leveraging blockchain technology, we ensure that knowledge 
// and literature can never be lost, censored, or destroyed - preserving humanity's 
// cultural heritage and making it freely accessible to all, forever.
//
// Written by: @NoahOverflow
// 
// License: MIT

access(all)
contract Alexandria {
    // -----------------------------------------------------------------------
	// Alexandria Contract-level information
	// -----------------------------------------------------------------------
	access(self) let libraryInfo: {String: AnyStruct}
    access(self) let titles: {String: String}
    access(self) let authors: {String: [String]}
    access(self) let genres: {String: [String]}
    // Paths
    access(all) let AdminStoragePath: StoragePath
    access(all) let LibrarianStoragePath: StoragePath
    access(all) let UserPreferenceStorage: StoragePath
    access(all) let UserPreferencePublic: PublicPath
    // Events
    access(all) event ContractInitialized()
    access(all) event BookAdded(title: String, author: String, genre: String)
    access(all) event ChapterNameAdded(bookTitle: String, chapterTitle: String)
    access(all) event ChapterAdded(bookTitle: String, chapterTitle: String)
    access(all) event ChapterRemoved(bookTitle: String, chapterTitle: String)
    access(all) event ChapterSubmitted(bookTitle: String, chapterTitle: String, librarian: Address)
    // -----------------------------------------------------------------------
	// Alexandria Book Resource
	// -----------------------------------------------------------------------
    access(all)
    resource Book {
        access(all) let Title: String
        access(all) let Author: String
        access(all) let Genre: String
        access(all) let Summary: String
        access(all) let Edition: String
        // This is a mapping of chapterName -> 
        access(all) let Chapters: {String: Chapter?}
        // Dictionary of chapter names
        access(all) let chapterNames: {String: Bool}
        // Dictionary of Chapters submitted by Librarians
        // these Chapters are not automatically added to the book
        // They go through a review process and then, if approved, they get
        // added to the book
        // This is a mapping from chapterName -> Librarian.address -> Chapter
        access(all) let pendingReview: {String: {Address: Chapter?}}
        access(all) let extra: {String: AnyStruct}

        init(
            _ title: String,
            _ author: String,
            _ genre: String,
            _ edition: String,
            _ summary: String,
        ) {
            self.Title = title
            self.Author = author
            self.Genre = genre
            self.Summary = summary
            self.Edition = edition
            self.Chapters = {}
            self.chapterNames = {}
            self.pendingReview = {}
            self.extra = {}
        }
        // Add a chapter name to the list of chapters
        // this will be helpful to guide Librarians on what has been submitted
        // or is still missing
        access(all)
        fun addChapterName(chapterName: String): [String] {
            pre {
                self.chapterNames[chapterName] == nil: "This chapter already exists"
            }
            self.chapterNames[chapterName] = true
            
            emit ChapterNameAdded(bookTitle: self.Title, chapterTitle: chapterName)

            return self.Chapters.keys
        }
        // Add a Chapter directly into the book
        // this function is used only by the Admin
        access(all)
        fun addChapter(chapterName: String, chapter: Chapter): [String] {
            pre {
                // Check that the 
                self.chapterNames[chapterName] != nil : "This chapter doesn't exists"
            }
            self.Chapters[chapterName] = chapter

            return self.Chapters.keys
        }
        // This is the function that a Librarian uses
        // in order to submit a Chapter for review
        access(all)
        fun submitChapter(chapterName: String, chapter: Chapter, librarian: Address) {
            pre {
                self.chapterNames[chapterName] != nil: "This chapter doesn't exists"
            }

            self.pendingReview[chapterName] = {librarian : chapter}
        }
        // This function is used by the Admin to
        // approve Chapter submissions
        access(all)
        fun approveChapter(chapterName: String, librarian: Address) {
            pre {
                self.Chapters[chapterName] != nil: "This chapter doesn't exists"
                self.pendingReview[chapterName]![librarian] != nil: "There are no Chapters submitted by this Librarian: ".concat(librarian.toString())
            }
            // Remove chapter from the Pending list
            let chapter = self.pendingReview[chapterName]!.remove(key: librarian)!
            // Add the Chapter to the approved mapping
            self.Chapters[chapterName] = chapter
            // Send Karma and FlowToken to the Librarian's account

        }
        // Get Chapter
        access(all)
        fun getChapter(chapterTitle: String): Chapter? {
            return self.Chapters[chapterTitle]!
        }
     access(all)
        fun removeLastChapter(): String {
            let chapterTitle = self.Chapters.keys.removeLast()
            let chapter = self.Chapters.remove(key: chapterTitle) as! Chapter
            

            return chapterTitle
        }
    }

    access(all)
    struct Chapter {
        access(all) let bookTitle: String
        access(all) let chapterTitle: String
        access(all) let index: Int
        access(all) let paragraphs: [String]
        access(all) let extra: {String: AnyStruct}

        init(
            _ bookTitle: String,
            _ chapterTitle: String,
            _ index: Int,
            _ paragraphs: [String]
        ) {
            self.bookTitle = bookTitle
            self.chapterTitle = chapterTitle
            self.index = index
            self.paragraphs = paragraphs
            self.extra = {}
        }
    }
    // -----------------------------------------------------------------------
	// User Preferences Resource
	// -----------------------------------------------------------------------
    
    // Public interface to get a user's favorites and bookmarks
    access(all) resource interface UserPreferencesPublic {
        access(all) fun getFavorites(): [String]
        access(all) fun getBookmarks(): [String]
    }

    access(all)
    resource UserPreferences {
        access(all) var favorites: {String: Bool} 
        access(all) var bookmarks: {String: Bool} 
        access(all) var extra: {String: AnyStruct}

        init() {
            self.favorites = {}
            self.bookmarks = {}
            self.extra = {}
        }
        // Add a favorite book
        access(all)
        fun addFavorite(bookName: String) {
            pre {
                self.favorites[bookName] == nil: "This book is already in your favorites"
                Alexandria.titles[bookName] != nil: "This book is not part of the library"
            }

            self.favorites[bookName] = true       
        }
        // Remove a favorite book
        access(all)
        fun removeFavorite(bookName: String) {
            pre {
                self.favorites[bookName] == nil: "This book is not in your favorites"
                Alexandria.titles[bookName] != nil: "This book is not part of the library"
            }

            let bookName = self.favorites.remove(key: bookName)
        }
        // Bookmark a book
        access(all)
        fun addBookmark(bookName: String) {
            pre {
                self.bookmarks[bookName] == nil: "This book is already in your bookmarks"
                Alexandria.titles[bookName] != nil: "This book is not part of the library"
            }

            self.bookmarks[bookName] = true       
        }
        // Remove a bookmark
        access(all)
        fun removeBookmark(bookName: String) {
            pre {
                self.bookmarks[bookName] == nil: "This book is not in your bookmarks"
                Alexandria.titles[bookName] != nil: "This book is not part of the library"
            }

            let bookName = self.bookmarks.remove(key: bookName)
        }
        // Function to get all favorites
        access(all)
        fun getFavorites(): [String] {
            return self.favorites.keys
        }
        // Function to get all bookmarks
        access(all)
        fun getBookmarks(): [String] {
            return self.bookmarks.keys
        }
    }

    // -----------------------------------------------------------------------
	// Alexandria Admin Resource
	// -----------------------------------------------------------------------

    access(all)
    resource Admin {
        // Function to add a book to the library
        access(all)
        fun addBook(
            title: String,
            author: String,
            genre: String,
            edition: String,
            summary: String,
        ) {
            pre {
                Alexandria.titles[title] == nil: "This book is already in the Library."
            }
            // create new book resource
            let newBook <- create Book(title, author, genre, edition, summary)
            // create new path identifier for book
            let identifier = "Alexandria_Library_".concat(Alexandria.account.address.toString()).concat("_".concat(title))
            // Add the book's details to the library's catalog
            Alexandria.titles[title] = newBook.Title
            // Check if this Author already exists
            if Alexandria.authors[author] == nil {
                // create new list of titles under this author
                Alexandria.authors[author] = []
                // add this title to the list
                Alexandria.authors[author]!.append(title)  
            } else {
                // Add title to the list of titles under this author
                Alexandria.authors[author]!.append(title)    
            }
            Alexandria.titles[author] = newBook.Author
            // Check if this Genre already exists
            if Alexandria.genres[genre] == nil {
                Alexandria.genres[genre] = []
                Alexandria.genres[genre]!.append(title)    
            } else {
                Alexandria.genres[genre]!.append(title)    
            }
            // add new book to the library
		    Alexandria.account.storage.save(<- newBook, to: StoragePath(identifier: identifier)!)
            // Emit book added event
            emit BookAdded(title: title, author: author, genre: genre)

        }
        // Add a chapter to a book
        access(all)
        fun addChapter(bookTitle: String, chapter: Chapter): [String] { 
            pre {
                Alexandria.titles[bookTitle] != nil: "This book doesn't exist in the Library."
            }
            // create book path identifier based on title
            let identifier = "Alexandria_Library_".concat(Alexandria.account.address.toString()).concat("_".concat(bookTitle))
            // fetch book
            let book = Alexandria.account.storage.borrow<&Alexandria.Book>(from: StoragePath(identifier: identifier)!)!
            // Emit event
            emit ChapterAdded(bookTitle: bookTitle, chapterTitle: chapter.chapterTitle)
            // add chapter to book and
            // return the current number of chapters in this book 
            return book.addChapter(chapterName: chapter.chapterTitle, chapter: chapter)
        }
        // Add a chapter title to a book
        access(all)
        fun addChapterName(bookTitle: String, chapterName: String) {
            // create book path identifier based on title
            let identifier = "Alexandria_Library_".concat(Alexandria.account.address.toString()).concat("_".concat(bookTitle))
            // fetch book
            let book = Alexandria.account.storage.borrow<&Alexandria.Book>(from: StoragePath(identifier: identifier)!)!    
            // Emit event
            // emit ChapterAdded(bookTitle: bookTitle, chapterTitle: chapter.chapterTitle)
            // add chapter name to book
            let newChapterTitle = book.addChapterName(chapterName: chapterName)        
            // return newChapterTitle
        }
        // Remove the last chapter from a book
        access(all)
        fun removeLastChapter(bookTitle: String) {
            pre {
                Alexandria.titles[bookTitle] != nil: "This book doesn't exist in the Library."
            }
            // create book path identifier based on title
            let identifier = "Alexandria_Library_".concat(Alexandria.account.address.toString()).concat("_".concat(bookTitle))
            // fetch book
            let book = Alexandria.account.storage.borrow<&Alexandria.Book>(from: StoragePath(identifier: identifier)!)!
            // remove last chapter from book
            let chapterTitle = book.removeLastChapter()
            // Emit event
            emit ChapterRemoved(bookTitle: bookTitle, chapterTitle: chapterTitle)
        }
        // create a new Admin resource
		access(all)
        fun createAdmin(): @Admin {
			return <- create Admin()
		}
		// change Alexandria of library info
		access(all)
        fun changeField(key: String, value: AnyStruct) {
			Alexandria.libraryInfo[key] = value
		}
    }
    // -----------------------------------------------------------------------
	// Alexandria Librarian Resource
	// -----------------------------------------------------------------------
    
    // Librarians are users that are contributing to the creation of the Library
    // by submitting book chapters to be reviewed, and then added to the storage
    // upon approval

    access(all)
    resource Librarian {
        // The reputation of this librarian
        access(all) let karma: UFix64
        // A list of chapters submitted by this Librarian
        // that have been approved, and the book they belong to
        access(all) let approvedChapters: {String: [Chapter]}
        // A list of chapters that pending for approval
        access(all) let pendingChapters: {String: [Chapter]}
        access(all) let extra: {String: AnyStruct}

        init() {
            self.karma = 0.0
            self.approvedChapters = {}
            self.pendingChapters = {}
            self.extra = {}
        }
        // Function used to submit a Chapter to a book
        access(all)
        fun submitChapter(bookTitle: String, chapter: Chapter) {
            pre {
                Alexandria.titles[bookTitle] != nil: "This book doesn't exist in the Library."
            }
            // create book path identifier based on title
            let identifier = "Alexandria_Library_".concat(Alexandria.account.address.toString()).concat("_".concat(bookTitle))
            // fetch book
            let book = Alexandria.account.storage.borrow<&Alexandria.Book>(from: StoragePath(identifier: identifier)!)!
            // Emit event
            emit ChapterSubmitted(bookTitle: bookTitle, chapterTitle: chapter.chapterTitle, librarian: self.owner!.address)
            // return the current number of chapters in this book 
            book.submitChapter(chapterName: chapter.chapterTitle, chapter: chapter, librarian: self.owner!.address)
        }
    } 

    // -----------------------------------------------------------------------
	// Alexandria Public Services
	// -----------------------------------------------------------------------

    access(all)
    fun createEmptyPreferences(): @Alexandria.UserPreferences {
        return <- create UserPreferences()
    }
    // Fetch one book
    access(all)
    fun getBook(bookTitle: String): &Book {
        pre {
            Alexandria.titles[bookTitle] != nil: "This book doesn't exist in the Library."
        }
        // create book path identifier based on title
        let identifier = "Alexandria_Library_".concat(Alexandria.account.address.toString()).concat("_".concat(bookTitle))
        let book = Alexandria.account.storage.borrow<&Alexandria.Book>(from: StoragePath(identifier: identifier)!)!
        return book
    }
    // Fetch a book's chapter
    access(all)
    fun getBookChapter(bookTitle: String, chapterTitle: String): Chapter? {
        let identifier = "Alexandria_Library_".concat(Alexandria.account.address.toString()).concat("_".concat(bookTitle))
        let book = Alexandria.account.storage.borrow<&Alexandria.Book>(from: StoragePath(identifier: identifier)!)!
        return book.getChapter(chapterTitle: chapterTitle)
    }
    // Fetch all registered authors
    access(all)
    fun getAuthors(): [String]? {
        return self.authors.keys
    }
    // Fetch all registered genres
    access(all)
    fun getAllGenres(): [String] {
        return self.genres.keys
    }
    // Fetch all titles under a genre
    access(all)
    fun getGenre(genre: String): [String]? {
        return self.genres[genre]
    }
    // Fetch all titles under an author
    access(all)
    fun getAuthor(author: String): [String]? {
        return self.authors[author]
    }
    init() {
        let identifier = "Alexandria_Library_".concat(self.account.address.toString())

        self.AdminStoragePath = StoragePath(identifier: identifier.concat("Admin"))!
        self.LibrarianStoragePath = StoragePath(identifier: identifier.concat("Librarian"))!
        self.UserPreferenceStorage = StoragePath(identifier: identifier.concat("User_Preferences"))!
        self.UserPreferencePublic = PublicPath(identifier: identifier.concat("User_Preferences_Public"))!

        self.libraryInfo = {}
        self.titles = {}
        self.authors = {}
        self.genres = {
            "Adventure": [],
            "Biography": [],
            "Realism": [],
            "Dystopian": [],
            "Fantasy": [],
            "Horror": [],
            "Mistery": [],
            "History": [],
            "Romance": [],
            "Thriller": [],
            "Fiction": [],
            "Science Fiction": [],
            "Western": [],
            "Philosophy": [],
            "Psychology": [],
            "Literature": [],
            "Feminist Literature": []
            }

		// Create a Admin resource and save it to Alexandria account storage
		let Admin <- create Admin()
		self.account.storage.save(<- Admin, to: self.AdminStoragePath)

		// Create a UserPreference resource and save it to Alexandria account storage
        let UserPreference <- create UserPreferences()
        self.account.storage.save(<- UserPreference, to: self.UserPreferenceStorage)

        // create a public capability for the user preferences
	    let storageCap = self.account.capabilities.storage.issue<&{Alexandria.UserPreferencesPublic}>(self.UserPreferenceStorage)
		self.account.capabilities.publish(storageCap, at: self.UserPreferencePublic)

        emit ContractInitialized()
    }
}