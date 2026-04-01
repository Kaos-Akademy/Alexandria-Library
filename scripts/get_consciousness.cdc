// Returns Echo's full consciousness (AI prompt). Public - used by frontend to bootstrap AI.
import "EchoNoah"

access(all) fun main(): String {
    return EchoNoah.getConsciousness()
}
