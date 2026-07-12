import { http, createConfig } from "wagmi";
import { injected, metaMask } from "wagmi/connectors";
import { arcTestnet, ARC_RPC_URL } from "./arc";

export const wagmiConfig = createConfig({
  chains: [arcTestnet],
  connectors: [metaMask(), injected()],
  transports: {
    [arcTestnet.id]: http(ARC_RPC_URL),
  },
  ssr: true,
});
