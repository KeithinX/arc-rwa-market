"use client";

import { WagmiProvider, createConfig, http } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { injected } from "wagmi/connectors";
import { arcTestnet } from "@/lib/arc";
import { TabProvider } from "@/components/AppNav";

const config = createConfig({
  chains: [arcTestnet],
  connectors: [injected({ target: "metaMask" })],
  transports: {
    [arcTestnet.id]: http(),
  },
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <TabProvider>{children}</TabProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
