import "FungibleToken"
import "Alexandria"

access(all) contract AlexandriaDAO {
    // -----------------------------------------------------------------------
    // Alexandria_AlexandriaDAO contract-level fields.
    // These contain actual values that are stored in the smart contract.
    // -----------------------------------------------------------------------
    // Topics dictionary
    access(all) let topics: {UInt64: Topic}
    // String universal identifier for paths
    access(all) let identifier: String
    // The ID that is used to create Topics. 
    // Every time a Topic is created, topicID is assigned 
    // to the new Topic's ID and then is incremented by 1.
    access(all) var nextTopicID: UInt64

    // -----------------------------------------------------------------------
    // Alexandria_AlexandriaDAO account paths
    // -----------------------------------------------------------------------
    
	access(all) let AdministratorStoragePath: StoragePath
    // -----------------------------------------------------------------------
    // Alexandria_AlexandriaDAO contract Events
    // -----------------------------------------------------------------------
    access(all) event ContractInitialized()
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

    init() {
        self.topics = {}
        self.nextTopicID = 1
        self.identifier = "Alexandria_AlexandriaDAO_".concat(self.account.address.toString())
		self.AdministratorStoragePath = StoragePath(identifier: self.identifier.concat("Administrator"))!

    	// Create a Administrator resource and save it to Alexandria account storage
		let administrator <- create Administrator()
		self.account.storage.save(<- administrator, to: self.AdministratorStoragePath)

        // Emit contract init event
		emit ContractInitialized()
    }
}