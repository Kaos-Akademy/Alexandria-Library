## 📚 Alexandria's Library

### Mission

Alexandria's Library is a decentralized, immutable library on the Flow blockchain that preserves humanity's literary heritage forever. Inspired by the ancient Library of Alexandria—one of the greatest repositories of knowledge in history—this project ensures that books, chapters, and cultural works can never be lost, censored, or destroyed.

By leveraging blockchain technology, Alexandria's Library:
- **Preserves knowledge permanently** - Once added to the blockchain, content is immutable and cannot be altered or removed
- **Enables decentralized curation** - Librarians can submit chapters for review, creating a community-driven library
- **Provides free access** - All content is publicly accessible to anyone on the Flow network
- **Supports user preferences** - Readers can bookmark favorites and track their reading progress

## 👋 Welcome Flow Developer!

This project demonstrates how to build a decentralized library system on the Flow Blockchain using Cadence smart contracts. It includes contracts, scripts, transactions, and a governance DAO system.

## 🔨 Getting Started

Here are some essential resources to help you hit the ground running:

- **[Flow Documentation](https://developers.flow.com/)** - The official Flow Documentation is a great starting point to start learning about [building](https://developers.flow.com/build/flow) on Flow.
- **[Cadence Documentation](https://cadence-lang.org/docs/language)** - Cadence is the native language for the Flow Blockchain. It is a resource-oriented programming language that is designed for developing smart contracts.  The documentation is a great place to start learning about the language.
- **[Visual Studio Code](https://code.visualstudio.com/)** and the **[Cadence Extension](https://marketplace.visualstudio.com/items?itemName=onflow.cadence)** - It is recommended to use the Visual Studio Code IDE with the Cadence extension installed.  This will provide syntax highlighting, code completion, and other features to support Cadence development.
- **[Flow Clients](https://developers.flow.com/tools/clients)** - There are clients available in multiple languages to interact with the Flow Blockchain.  You can use these clients to interact with your smart contracts, run transactions, and query data from the network.
- **[Block Explorers](https://developers.flow.com/ecosystem/block-explorers)** - Block explorers are tools that allow you to explore on-chain data.  You can use them to view transactions, accounts, events, and other information.  [Flowser](https://flowser.dev/) is a powerful block explorer for local development on the Flow Emulator.

## 📦 Project Structure

Your project has been set up with the following structure:

- `flow.json` - This is the configuration file for your project (analogous to a `package.json` file for NPM).  It has been initialized with a basic configuration to get started.
- `/contracts` - This folder contains your Cadence contracts (these are deployed to the network and contain the business logic for your application)
  - `Alexandria.cdc` - Main library contract managing books, chapters, and user preferences
  - `DAO.cdc` - Governance contract for decentralized decision-making
  - `AlexandriaToken.cdc` - Token contract for the library ecosystem
- `/scripts` - This folder contains your Cadence scripts (read-only operations)
  - `get_book.cdc` - Retrieve a book by title
  - `get_book_chapter.cdc` - Get a specific chapter from a book
  - `get_books_by_author.cdc` - List all books by an author
  - `get_books_by_genre.cdc` - List all books in a genre
  - `get_genres.cdc` - Get all available genres
  - `get_authors.cdc` - Get all registered authors
- `/transactions` - This folder contains your Cadence transactions (state-changing operations)
  - `/Admin` - Admin-only transactions
    - `add_book.cdc` - Add a new book to the library
    - `add_chapter.cdc` - Add a chapter to a book
    - `add_chapter_name.cdc` - Add a chapter name (for Librarians to submit content)
    - `remove_chapter.cdc` - Remove a chapter from a book
  - `/Librerian` - Librarian transactions
    - `submit_chapter.cdc` - Submit a chapter for review
  - User transactions
    - `add_favorite.cdc` - Add a book to favorites
    - `remove_favorite.cdc` - Remove a book from favorites
    - `add_bookmark.cdc` - Bookmark a book
    - `remove_bookmark.cdc` - Remove a bookmark

## 📖 Documentation

### Contracts

#### Alexandria.cdc

The main library contract that manages the entire library system. It contains several key resources:

**Book Resource**
- Stores book metadata (title, author, genre, summary, edition)
- Manages chapters in a dictionary mapping chapter names to Chapter structs
- Tracks pending chapter submissions from Librarians
- Provides functions to add/remove chapters and manage chapter names

**Chapter Struct**
- Contains chapter metadata (book title, chapter title, index)
- Stores paragraphs as an array of strings
- Each paragraph is stored on a single line for efficient storage

**UserPreferences Resource**
- Manages user-specific data (favorites and bookmarks)
- Allows users to save their reading preferences on-chain
- Provides public interface for reading preferences

**Admin Resource**
- Exclusive access to library management functions
- Can add books, chapters, and approve Librarian submissions
- Manages the library catalog (titles, authors, genres)

**Librarian Resource**
- Allows users to submit chapters for review
- Tracks karma (reputation) and approved/pending chapters
- Chapters submitted by Librarians go through an approval process

**Public Functions**
- `getBook(bookTitle: String)` - Retrieve a book reference
- `getBookChapter(bookTitle: String, chapterTitle: String)` - Get a specific chapter
- `getAuthors()` - Get all registered authors
- `getAllGenres()` - Get all available genres
- `getGenre(genre: String)` - Get all books in a genre
- `getAuthor(author: String)` - Get all books by an author

#### DAO.cdc

The governance contract for decentralized decision-making:

**Topic Struct**
- Represents a voting topic with options and vote counts
- Supports global and regional voting
- Tracks voters to prevent double-voting
- Has a time-based expiration (default: 3 days)

**Administrator Resource**
- Creates new voting topics
- Manages governance proposals

**NFT Resource**
- Soul-bound NFTs representing Librarian status
- Cannot be transferred (soul-bound)
- Implements Flow's MetadataViews standard

### Transactions

Transactions modify the state of the blockchain. All transactions follow a standard pattern with `prepare` and `execute` phases.

**Admin Transactions** (`/transactions/Admin/`)
- Require Admin resource access
- Used for library management operations
- Examples:
  - `add_book.cdc` - Creates a new book in the library
  - `add_chapter.cdc` - Adds a chapter directly to a book (bypasses review)
  - `add_chapter_name.cdc` - Adds a chapter name, allowing Librarians to submit content
  - `remove_chapter.cdc` - Removes a chapter from a book

**Librarian Transactions** (`/transactions/Librerian/`)
- Require Librarian resource access
- Used for community contributions
- `submit_chapter.cdc` - Submits a chapter for Admin review and approval

**User Transactions**
- Available to all users
- Manage personal preferences
- Examples:
  - `add_favorite.cdc` - Adds a book to user's favorites
  - `add_bookmark.cdc` - Bookmarks a book for later reading
  - `remove_favorite.cdc` / `remove_bookmark.cdc` - Removes preferences

**Transaction Flow:**
1. **Prepare Phase**: Accesses account storage, borrows resources, sets up references
2. **Execute Phase**: Performs the actual state changes using borrowed references

### Scripts

Scripts are read-only operations that query data from the blockchain without modifying state. They don't require any authorization and can be executed by anyone.

**Available Scripts:**
- `get_book.cdc` - Returns a book reference by title
- `get_book_chapter.cdc` - Returns a specific chapter from a book
- `get_books_by_author.cdc` - Returns all books written by an author
- `get_books_by_genre.cdc` - Returns all books in a specific genre
- `get_genres.cdc` - Returns all available genres in the library
- `get_authors.cdc` - Returns all registered authors

**Script Execution:**
Scripts are executed using the Flow CLI:
```shell
flow scripts execute scripts/get_book.cdc --args-json '{"bookTitle": "The Great Gatsby"}'
```

## Running the Existing Project

### Executing Scripts

To query data from the library, use scripts. For example, to get a book:

```shell
flow scripts execute scripts/get_book.cdc --args-json '{"bookTitle": "The Great Gatsby"}'
```

To get all genres:

```shell
flow scripts execute scripts/get_genres.cdc
```

To get all books by an author:

```shell
flow scripts execute scripts/get_books_by_author.cdc --args-json '{"author": "F. Scott Fitzgerald"}'
```

### Sending Transactions

To add a book to your favorites (requires user account):

```shell
flow transactions send transactions/add_favorite.cdc --args-json '{"title": "The Great Gatsby"}' --signer user
```

To add a new book to the library (requires Admin access):

```shell
flow transactions send transactions/Admin/add_book.cdc \
  --args-json '{
    "title": "1984",
    "author": "George Orwell",
    "genre": "Dystopian",
    "edition": "First Edition",
    "summary": "A dystopian novel about totalitarian surveillance"
  }' \
  --signer admin
```

To learn more about using the CLI, check out the [Flow CLI Documentation](https://developers.flow.com/tools/flow-cli).

## 👨‍💻 Start Developing

### Creating a New Contract

To add a new contract to your project, run the following command:

```shell
flow generate contract
```

This command will create a new contract file and add it to the `flow.json` configuration file.

### Creating a New Script

To add a new script to your project, run the following command:

```shell
flow generate script
```

This command will create a new script file.  Scripts are used to read data from the blockchain and do not modify state (i.e. get the current balance of an account, get a user's NFTs, etc).

You can import any of your own contracts or installed dependencies in your script file using the `import` keyword.  For example:

```cadence
import "Counter"
```

### Creating a New Transaction

To add a new transaction to your project you can use the following command:

```shell
flow generate transaction
```

This command will create a new transaction file.  Transactions are used to modify the state of the blockchain (i.e purchase an NFT, transfer tokens, etc).

You can import any dependencies as you would in a script file.

### Creating a New Test

To add a new test to your project you can use the following command:

```shell
flow generate test
```

This command will create a new test file.  Tests are used to verify that your contracts, scripts, and transactions are working as expected.

### Installing External Dependencies

If you want to use external contract dependencies (such as NonFungibleToken, FlowToken, FungibleToken, etc.) you can install them using [Flow CLI Dependency Manager](https://developers.flow.com/tools/flow-cli/dependency-manager).

For example, to install the NonFungibleToken contract you can use the following command:

```shell
flow deps add mainnet://1d7e57aa55817448.NonFungibleToken
```

Contracts can be found using [ContractBrowser](https://contractbrowser.com/), but be sure to verify the authenticity before using third-party contracts in your project.

## 🧪 Testing

To verify that your project is working as expected you can run the tests using the following command:

```shell
flow test
```

This command will run all tests with the `_test.cdc` suffix (these can be found in the `cadence/tests` folder). You can add more tests here using the `flow generate test` command (or by creating them manually).

To learn more about testing in Cadence, check out the [Cadence Test Framework Documentation](https://cadence-lang.org/docs/testing-framework).

## 🚀 Deploying Your Project

To deploy your project to the Flow network, you must first have a Flow account and have configured your deployment targets in the `flow.json` configuration file.

You can create a new Flow account using the following command:

```shell
flow accounts create
```

Learn more about setting up deployment targets in the [Flow CLI documentation](https://developers.flow.com/tools/flow-cli/deployment/project-contracts).

### Deploying to the Flow Emulator

To deploy your project to the Flow Emulator, start the emulator using the following command:

```shell
flow emulator --start
```

To deploy your project, run the following command:

```shell
flow project deploy --network=emulator
```

This command will start the Flow Emulator and deploy your project to it. You can now interact with your project using the Flow CLI or alternate [client](https://developers.flow.com/tools/clients).

### Deploying to Flow Testnet

To deploy your project to Flow Testnet you can use the following command:

```shell
flow project deploy --network=testnet
```

This command will deploy your project to Flow Testnet. You can now interact with your project on this network using the Flow CLI or any other Flow client.

### Deploying to Flow Mainnet

To deploy your project to Flow Mainnet you can use the following command:

```shell
flow project deploy --network=mainnet
```

This command will deploy your project to Flow Mainnet. You can now interact with your project using the Flow CLI or alternate [client](https://developers.flow.com/tools/clients).

## 📚 Other Resources

- [Cadence Design Patterns](https://cadence-lang.org/docs/design-patterns)
- [Cadence Anti-Patterns](https://cadence-lang.org/docs/anti-patterns)
- [Flow Core Contracts](https://developers.flow.com/build/core-contracts)

## 🤝 Community
- [Flow Community Forum](https://forum.flow.com/)
- [Flow Discord](https://discord.gg/flow)
- [Flow Twitter](https://x.com/flow_blockchain)
