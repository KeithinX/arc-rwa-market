"use client";

import { useWriteContract, useConfig } from "wagmi";
import { waitForTransactionReceipt } from "wagmi/actions";
import { type Address, type Abi } from "viem";

export function useArcWrite() {
  const { writeContractAsync, isPending } = useWriteContract();
  const config = useConfig();

  async function writeAndWait(args: {
    address: Address | string;
    abi: Abi;
    functionName: string;
    args?: readonly unknown[];
    value?: bigint;
  }): Promise<`0x${string}`> {
    // wagmi 泛型过严，这里用宽松断言保证可写任意合约方法
    const hash = await writeContractAsync({
      address: args.address as Address,
      abi: args.abi,
      functionName: args.functionName,
      args: args.args,
      value: args.value,
    } as Parameters<typeof writeContractAsync>[0]);
    await waitForTransactionReceipt(config, { hash, confirmations: 1 });
    return hash;
  }

  return { writeAndWait, isPending };
}
