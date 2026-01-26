import "FungibleToken"
import "NonFungibleToken"
import "MetadataViews" 
// import "Alexandria"
import "ViewResolver"
import "FlowToken"

access(all) contract AlexandriaDAO: NonFungibleToken, ViewResolver {
    // -----------------------------------------------------------------------
    // Alexandria_AlexandriaDAO contract-level fields.
    // These contain actual values that are stored in the smart contract.
    // -----------------------------------------------------------------------
    access(all) let collectionInfo: {String: AnyStruct}
    // Topics dictionary
    access(all) let topics: {UInt64: Topic}
    // String universal identifier for paths
    access(all) let identifier: String
    // The ID that is used to create Topics. 
    // Every time a Topic is created, topicID is assigned 
    // to the new Topic's ID and then is incremented by 1.
    access(all) var nextTopicID: UInt64
    // The ID that is used to create Librarian NFTs. 
    access(all) var nextNFTID: UInt64
    // -----------------------------------------------------------------------
    // Alexandria_AlexandriaDAO account paths
    // -----------------------------------------------------------------------
    access(all) let CollectionStoragePath: StoragePath
	access(all) let CollectionPublicPath: PublicPath
	access(all) let AdministratorStoragePath: StoragePath
    // -----------------------------------------------------------------------
    // Alexandria_AlexandriaDAO contract Events
    // -----------------------------------------------------------------------
    access(all) event ContractInitialized()
    access(all) event Withdraw(id: UInt64, from: Address?)
	access(all) event Deposit(id: UInt64, to: Address?)
    access(all) event NewTopic(topicID: UInt64, topicTitle: String, minimumVotes: Int, endAt: UFix64)
    access(all) event VoteSubmitted(topicID: UInt64, option: String, voter: Address)

    // -----------------------------------------------------------------------
    // Alexandria_AlexandriaDAO contract-level Composite Type definitions
    // -----------------------------------------------------------------------

    // Topic struct that contains the votes
    access(all) struct Topic {
        // Unique identifier for each Topic
        access(all) let id: UInt64
        // Topic's title
        access(all) let title: String
        // Topic's description
        access(all) let description: String
        // Minimnum amount of votes to pass this Topic
        access(all) let minimumVotes: Int
        // Vote options
        access(all) let options: [String]
        // Amount of votes for each option
        access(all) let votes: {String: Int}
        // Dictionary of all voters
        // get list with listVoters.keys
        access(all) let listVoters: {String: Bool}
        // Number of votes coming from each region
        // This is for global topics mostly
        access(all) let regionsVotes: {String: Int}
        // Boolean that determines if this topic is global
        access(all) let isGlobal: Bool
        // End date for the voting round
        access(all) var endAt: UFix64
        // Winner of the vote
        // this should be calculated by a public fun
        // that determinites which option got the most votes

        init(
            _ title: String,
            _ description: String,
            _ minimumVote: Int,
            _ options: [String],
            isGlobal: Bool) {
            self.id = AlexandriaDAO.nextTopicID
            self.title = title
            self.description = description
            self.minimumVotes = minimumVote
            self.options = options
            self.listVoters = {}
            self.regionsVotes = {}
            self.endAt = getCurrentBlock().timestamp + 86400.0 * 3.0 // Set top lock in 3 days
            self.votes = {}
            self.isGlobal = isGlobal

            var counter = 0
            while counter < options.length {
                self.votes[options[counter]] = 0
                counter = counter + 1
            }
            // Increase nextTopic ID
            AlexandriaDAO.nextTopicID = AlexandriaDAO.nextTopicID + 1
            // Emit New Topic event
            emit NewTopic(topicID: self.id, topicTitle: self.title,  minimumVotes: self.minimumVotes, endAt: self.endAt)
        }

        access(account) view fun hasVoted(account: Address): Bool {
            if self.listVoters[account.toString()] != nil {
                return true
            }
            return false
        }
        // Vote Function
        access(all) fun vote(account: Address, option: String, voterRegion: String) {
            pre {
                self.hasVoted(account: account) == false: "This account has already voted"
                self.votes[option] != nil: "This is not an option for this vote"
            }

            self.votes[option] = self.votes[option]! + 1
            self.listVoters[account.toString()] = true

            if self.regionsVotes[voterRegion] == nil {
                self.regionsVotes[voterRegion] = 1
            } else {
                self.regionsVotes[voterRegion] = self.regionsVotes[voterRegion]! + 1
            }

            emit VoteSubmitted(topicID: self.id, option: option, voter: account)
        }
        // Global Topics functions
        // this functions are only used by the "Pais" region
        // and account for the citizens in all regions
        access(all) fun addOption(optionName: String) {
            pre {
                self.options.contains(optionName) == false: "This option is already in the list"
            }
            // Add the new option
            self.options.append(optionName)
            // Count the vote for the option
            self.votes[optionName] = 1

        }
    }

    // -----------------------------------------------------------------------
    // Alexandria_AlexandriaDAO Administrator Resource
    // -----------------------------------------------------------------------
    /// The resource that represents a Librarian NFT
	access(all) resource NFT: NonFungibleToken.NFT {
        access(all) let id: UInt64
        access(all) let extra: {String: AnyStruct}
        access(all) let name: String
        access(all) let description: String
        access(all) let image: String

        
        init() {
            self.id = AlexandriaDAO.nextNFTID
            self.extra = {}
            self.name = "AlexandriaDAO NFT"
            self.description = "AlexandriaDAO NFT"
            self.image = "https://assets.website-files.com/5f6294c0c7a8cdd643b1c820/5f6294c0c7a8cda55cb1c936_Flow_Wordmark.svg"
            AlexandriaDAO.nextNFTID = AlexandriaDAO.nextNFTID + 1
        }

        /// createEmptyCollection creates an empty Collection
        /// and returns it to the caller so that they can own NFTs
        /// @{NonFungibleToken.Collection}
        access(all) fun createEmptyCollection(): @{NonFungibleToken.Collection} {
            return <-AlexandriaDAO.createEmptyCollection(nftType: Type<@AlexandriaDAO.NFT>())
        }

		access(all) view fun getViews(): [Type] {

			return [
                Type<MetadataViews.Display>(),
                Type<MetadataViews.Royalties>(),
                Type<MetadataViews.Editions>(),
                Type<MetadataViews.ExternalURL>(),
                Type<MetadataViews.NFTCollectionData>(),
                Type<MetadataViews.NFTCollectionDisplay>(),
                Type<MetadataViews.Serial>(),
                Type<MetadataViews.Traits>(),
                Type<MetadataViews.EVMBridgedMetadata>()
			]
		}

		access(all) fun resolveView(_ view: Type): AnyStruct? {
            // let data = AlexandriaDAO.getCardMetadata(cardID: UInt32(self.id), cardType: self.cardType) as! cardType
			switch view {
				case Type<MetadataViews.Display>():
					return MetadataViews.Display(
						name: self.name,
						description:  self.description,
						thumbnail: MetadataViews.HTTPFile( 
            				url: self.image
            			),
                        
					)
				case Type<MetadataViews.Traits>():
					return MetadataViews.dictToTraits(dict: self.extra, excludedNames: nil)
				case Type<MetadataViews.NFTView>():
					return MetadataViews.NFTView(
						id: self.id,
						uuid: self.uuid,
						display: self.resolveView(Type<MetadataViews.Display>()) as! MetadataViews.Display?,
						externalURL: self.resolveView(Type<MetadataViews.ExternalURL>()) as! MetadataViews.ExternalURL?,
						collectionData: self.resolveView(Type<MetadataViews.NFTCollectionData>()) as! MetadataViews.NFTCollectionData?,
						collectionDisplay: self.resolveView(Type<MetadataViews.NFTCollectionDisplay>()) as! MetadataViews.NFTCollectionDisplay?,
						royalties: self.resolveView(Type<MetadataViews.Royalties>()) as! MetadataViews.Royalties?,
						traits: self.resolveView(Type<MetadataViews.Traits>()) as! MetadataViews.Traits?
					)
				case Type<MetadataViews.NFTCollectionData>():
					return AlexandriaDAO.resolveContractView(resourceType: Type<@AlexandriaDAO.NFT>(), viewType: Type<MetadataViews.NFTCollectionData>())
        		case Type<MetadataViews.ExternalURL>():
        			return AlexandriaDAO.getCollectionAttribute(key: "website") as! MetadataViews.ExternalURL
		        case Type<MetadataViews.NFTCollectionDisplay>():
					return AlexandriaDAO.resolveContractView(resourceType: Type<@AlexandriaDAO.NFT>(), viewType: Type<MetadataViews.NFTCollectionDisplay>())
				case Type<MetadataViews.Medias>():
                // ????
                    let metadata = 10
					if metadata != nil {
						return MetadataViews.Medias(
							[
								MetadataViews.Media(
									file: MetadataViews.HTTPFile(
										url: self.image
									),
									mediaType: "jpg"
								)
							]
						)
					}
        		case Type<MetadataViews.Royalties>():
          			return MetadataViews.Royalties([
            			MetadataViews.Royalty(
              				receiver: getAccount(AlexandriaDAO.account.address).capabilities.get<&FlowToken.Vault>(/public/flowTokenReceiver),
              				cut: 0.5, // 5% royalty on secondary sales
              				description: "The deployer gets 5% of every secondary sale."
            			)
          			])
				case Type<MetadataViews.Serial>():
					return MetadataViews.Serial(
						self.id
					)
			}
			return nil
		}

	}
    

    access(all) resource Collection: NonFungibleToken.Collection {
        access(all) var ownedNFTs: @{UInt64: {NonFungibleToken.NFT}}

        init() {
            self.ownedNFTs <- {}
        }
        // *** Collection Functions *** //

        /// Returns a list of NFT types that this receiver accepts
        access(all) view fun getSupportedNFTTypes(): {Type: Bool} {
            let supportedTypes: {Type: Bool} = {}
            supportedTypes[Type<@AlexandriaDAO.NFT>()] = true
            return supportedTypes
        }
                /// Returns whether or not the given type is accepted by the collection
        /// A collection that can accept any type should just return true by default
        access(all) view fun isSupportedNFTType(type: Type): Bool {
            return type == Type<@AlexandriaDAO.NFT>()
        }
		// Withdraw removes a AlexandriaDAO NFT from the collection and moves it to the caller(for Trading)
		access(NonFungibleToken.Withdraw) fun withdraw(withdrawID: UInt64): @{NonFungibleToken.NFT} {
            pre {
                false : "These NFTs are Soul-Bound and cannot be withdrawn"
            }
			let token <- self.ownedNFTs.remove(key: withdrawID) 
                ?? panic("This Collection doesn't own a AlexandriaDAO NFT by id: ".concat(withdrawID.toString()))

            emit Withdraw(id: token.id, from: self.owner?.address)

			return <-token
		}
        		// Deposit takes a DAONFT and adds it to the collections dictionary
		// and adds the ID to the id array
		access(all) fun deposit(token: @{NonFungibleToken.NFT}) {
			let newAlexandriaDAO <- token as! @NFT
			let id: UInt64 = newAlexandriaDAO.id
			// Add the new DAONFT to the dictionary
            let oldAlexandriaDAO <- self.ownedNFTs[id] <- newAlexandriaDAO
            // Destroy old AlexandriaDAO in that slot
            destroy oldAlexandriaDAO

			emit Deposit(id: id, to: self.owner?.address)
		}

		// GetIDs returns an array of the IDs that are in the collection
		access(all) view fun getIDs(): [UInt64] {
			return self.ownedNFTs.keys
		}
        /// Gets the amount of NFTs stored in the collection
        access(all) view fun getLength(): Int {
            return self.ownedNFTs.length
        }

		// BorrowNFT gets a reference to an NFT in the collection
		access(all) view fun borrowNFT(_ id: UInt64): &{NonFungibleToken.NFT}? {
			return &self.ownedNFTs[id]
		}
		// BorrowNFT gets a reference to an NFT in the collection
        access(all) fun borrowDAONFT(id: UInt64): &AlexandriaDAO.NFT? {
            if self.ownedNFTs[id] != nil {
                // Create an authorized reference to allow downcasting
                let ref = (&self.ownedNFTs[id] as  &{NonFungibleToken.NFT}?)!
                return ref as! &AlexandriaDAO.NFT
            }

            return nil
        }
		access(all) view fun borrowViewResolver(id: UInt64): &{ViewResolver.Resolver}? {
            if let nft = &self.ownedNFTs[id] as &{NonFungibleToken.NFT}? {
                return nft as &{ViewResolver.Resolver}
            }
            return nil
		}
        /// createEmptyCollection creates an empty Collection of the same type
        /// and returns it to the caller
        /// @return A an empty collection of the same type
        access(all) fun createEmptyCollection(): @{NonFungibleToken.Collection} {
            return <-AlexandriaDAO.createEmptyCollection(nftType: Type<@AlexandriaDAO.NFT>())
        }
    }
    // Admin is a special authorization resource that 
    // allows the owner to perform important functions to modify the 
    // various aspects of the DAO, like creating and magaging Topics
    //
    access(all) resource Administrator {
        // createTopic creates a new Topic struct 
        // and stores it in the TopicStorage resource inside the Alexandria_AlexandriaDAO account
        //
        // Returns: the ID of the new Topic object
        //
        access(all) 
        fun createTopic(
            regionPath: StoragePath,
            title: String,
            description: String,
            minimumVotes: Int,
            options: [String],
            isGlobal: Bool): UInt64 {
                // Load the TopicStorage from the Alexandria account
                
                // Create the Topic struct
                let topic = Topic(title, description, minimumVotes, options, isGlobal: isGlobal)
                // save the ID
                let id = topic.id
                // add Topic to the Storage
                let topicID = topic.id
                // return ID
                return id
            }
    }

    // -----------------------------------------------------------------------
    // AlexandriaDAO public functions
    // -----------------------------------------------------------------------

    // Public function to get list of Topics
    access(all) 
    view fun getTopics(regionPath: StoragePath): {UInt64: Topic} {
        // Load the region from the Alexandria account
        
        // return topics
        return self.topics
    }
    // Public function to get the list of options
    // and their vote count on a Topic
    access(all)
    view fun getVotes(regionPath: StoragePath, topicID: UInt64): {String: Int} {
        // Load the region from the Alexandria account
        let region = self.topics[topicID]!
        return region.votes
    }
    /// Function that returns all the Metadata Views implemented by a Non Fungible Token
    ///
    /// @return An array of Types defining the implemented views. This value will be used by
    ///         developers to know which parameter to pass to the resolveView() method.
    ///
    access(all) view fun getContractViews(resourceType: Type?): [Type] {
        return [
            Type<MetadataViews.NFTCollectionData>(),
            Type<MetadataViews.NFTCollectionDisplay>()
        //    Type<MetadataViews.EVMBridgedMetadata>()
        ]
    }
    access(all) fun resolveContractView(resourceType: Type?, viewType: Type): AnyStruct? {
        switch viewType {
            case Type<MetadataViews.NFTCollectionData>():
                let collectionData = MetadataViews.NFTCollectionData(
                    storagePath: self.CollectionStoragePath,
                    publicPath: self.CollectionPublicPath,
                    publicCollection: Type<&AlexandriaDAO.Collection>(),
                    publicLinkedType: Type<&AlexandriaDAO.Collection>(),
                    createEmptyCollectionFunction: (fun (): @{NonFungibleToken.Collection} {
                        return <-AlexandriaDAO.createEmptyCollection(nftType: Type<@AlexandriaDAO.NFT>())
                    })
                )
                return collectionData
            case Type<MetadataViews.NFTCollectionDisplay>():
                let media = AlexandriaDAO.getCollectionAttribute(key: "image") as! MetadataViews.Media
                return MetadataViews.NFTCollectionDisplay(
                    name: "AlexandriaDAO",
                    description: "AlexandriaDAOs and Telegram governance.",
                    externalURL: MetadataViews.ExternalURL("https://AlexandriaDAO.gg/"),
                    squareImage: media,
                    bannerImage: media,
                    socials: {
                        "twitter": MetadataViews.ExternalURL("https://twitter.com/AlexandriaDAO")
                    }
                )
        }
        return nil
    }
    // Public function to fetch a collection attribute
    access(all) fun getCollectionAttribute(key: String): AnyStruct {
		return self.collectionInfo[key] ?? panic(key.concat(" is not an attribute in this collection."))
	}
    /// createEmptyCollection creates an empty Collection for the specified NFT type
    /// and returns it to the caller so that they can own NFTs
    access(all) fun createEmptyCollection(nftType: Type): @{NonFungibleToken.Collection} {
        return <- create Collection()
    }
    // Initialize the DAO contract
    init() {
        self.collectionInfo = {}
        self.topics = {}
        self.nextTopicID = 1
        self.identifier = "Alexandria_AlexandriaDAO_".concat(self.account.address.toString())
		self.AdministratorStoragePath = StoragePath(identifier: self.identifier.concat("Administrator"))!
        self.CollectionStoragePath = StoragePath(identifier: self.identifier.concat("Collection"))!
        self.CollectionPublicPath = PublicPath(identifier: self.identifier.concat("Collection_Public"))!
        self.nextNFTID = 1
    	// Create a Administrator resource and save it to Alexandria account storage
		let administrator <- create Administrator()
		self.account.storage.save(<- administrator, to: self.AdministratorStoragePath)

        // Emit contract init event
		emit ContractInitialized()
    }
}