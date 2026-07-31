import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";

const contractAddress = "0xcd0eA9F2e9058998d0e7D6C81c520CDEd522bF1C";
const account = "0x95803126315A05E642D8E46CE1d77eA2199a2A6E";
const client = createClient({ chain: studionet });

const [profile, balance] = await Promise.all([
  client.readContract({
    address: contractAddress,
    functionName: "get_profile",
    args: [account],
    jsonSafeReturn: true,
  }),
  client.getBalance({ address: contractAddress }),
]);

console.log(
  JSON.stringify(
    { contractAddress, account, profile, balance },
    (_key, value) => (typeof value === "bigint" ? value.toString() : value),
    2,
  ),
);
