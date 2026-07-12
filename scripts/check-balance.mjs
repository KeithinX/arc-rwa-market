#!/usr/bin/env node
// 查询部署者钱包 + 任意地址的 RWA 代币和 USDC 余额
import fs from "node:fs";
import path from "node:path";
import { createPublicClient, http, formatUnits, defineChain } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const ROOT = path.resolve(import.meta.dirname, "..");
const RPC = "https://rpc.testnet.arc.network";
const USDC = "0x3600000000000000000000000000000000000000";

const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: { default: { http: [RPC] } },
});

const env = fs.readFileSync(path.join(ROOT, ".env.local"), "utf8");
const get = (k) => env.match(new RegExp(`${k}=(0x[a-fA-F0-9]+)`))?.[1];
const MP = get("NEXT_PUBLIC_MARKETPLACE_ADDRESS");
const TOKENS = [
  { sym: "aTREAS", addr: get("NEXT_PUBLIC_TOKEN_TREASURY") },
  { sym: "aMOT", addr: get("NEXT_PUBLIC_TOKEN_REALESTATE") },
  { sym: "aVCC", addr: get("NEXT_PUBLIC_TOKEN_CARBON") },
];

const pk = fs.readFileSync(path.join(ROOT, ".deployer-key"), "utf8").trim();
const deployer = privateKeyToAccount(pk);

const client = createPublicClient({ chain: arcTestnet, transport: http(RPC) });
const ERC20 = [
  { type: "function", name: "balanceOf", inputs: [{ name: "a", type: "address" }], outputs: [{ name: "", type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "totalSupply", inputs: [], outputs: [{ name: "", type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "decimals", inputs: [], outputs: [{ name: "", type: "uint8" }], stateMutability: "view" },
];

async function bal(token, who) {
  const b = await client.readContract({ address: token, abi: ERC20, functionName: "balanceOf", args: [who] });
  return b;
}

// 要查的地址：部署者 + 命令行传入的任意地址
const addrs = [deployer.address, ...process.argv.slice(2)];

console.log("Marketplace:", MP);
console.log("Deployer:", deployer.address);
console.log("\n--- USDC (native gas) ---");
const native = await client.getBalance({ address: deployer.address });
console.log("Deployer native:", formatUnits(native, 18));
const usdc = await bal(USDC, deployer.address);
console.log("Deployer USDC:", formatUnits(usdc, 6));

for (const t of TOKENS) {
  console.log(`\n--- ${t.sym} (${t.addr}) ---`);
  for (const who of addrs) {
    const b = await bal(t.addr, who);
    console.log(`  ${who.slice(0,10)}... : ${formatUnits(b, 18)}`);
  }
  const ts = await client.readContract({ address: t.addr, abi: ERC20, functionName: "totalSupply" });
  console.log("  totalSupply:", formatUnits(ts, 18));
}
