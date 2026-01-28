import "Donations_Alexandria"

access(all) fun main(): {Address: UFix64} {
    return Donations_Alexandria.getDonations()
}