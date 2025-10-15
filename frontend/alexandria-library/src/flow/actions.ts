import { getGenres } from "./scripts/getGenres"
import * as fcl from '@onflow/fcl';

fcl.config({
  'discovery.wallet': 'https://fcl-discovery.onflow.org/authn', // Endpoint set to Mainnet
  'accessNode.api': 'https://mainnet.onflow.org',
});

export const useGetGenres = async () => {
    const response = await fcl.query({
        cadence: getGenres(),
        args: () => [],
    });
    console.log(response)
    return response;
};