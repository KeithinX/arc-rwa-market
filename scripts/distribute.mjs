#!/usr/bin/env node
// 把 RWA 代币 + USDC 从部署者钱包转一部分到目标地址
// 用法: node scripts/distribute.mjs <目标地址>
import fs from "node:fs";
import path from "node:path";
import { createWalletClient, createPublicClient, http, formatUnits, parseUnits, defineChain } from "viem";
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
const TOKENS = [
  { sym: "aTREAS", addr: get("NEXT_PUBLIC_TOKEN_TREASURY") },
  { sym: "aMOT", addr: get("NEXT_PUBLIC_TOKEN_REALESTATE") },
  { sym: "aVCC", addr: get("NEXT_PUBLIC_TOKEN_CARBON") },
];

const target = process.argv[2];
if (!target || !target.startsWith("0x")) {
  console.error("用法: node scripts/distribute.mjs <目标地址>");
  process.exit(1);
}

const pk = fs.readFileSync(path.join(ROOT, ".deployer-key"), "utf8").trim();
const account = privateKeyToAccount(pk);
const wallet = createWalletClient({ account, chain: arcTestnet, transport: http(RPC) });
const publicClient = createPublicClient({ chain: arcTestnet, transport: http(RPC) });

const ERC20_ABI = [
  { type: "function", name: "transfer", inputs: [{ name: "to", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ name: "", type: "bool" }], stateMutability: "nonpayable" },
];

console.log("From deployer:", account.address);
console.log("To target:    ", target);

// 1) 转 USDC (native) 给目标地址当 gas + 交易用
const USDC_AMOUNT = "10"; // 10 USDC
console.log(`\nSending ${USDC_AMOUNT} USDC (native gas)...`);
const value = parseUnits(USDC_AMOUNT, 18);
const tx1 = await wallet.sendTransaction({ to: target, value });
await publicClient.waitForTransactionReceipt({ hash: tx1 });
console.log("  done:", tx1);

// 2) 每种 RWA 代币转 100,000 个
const TOKEN_AMOUNT = "100000";
for (const t of TOKENS) {
  console.log(`\nSending ${TOKEN_AMOUNT} ${t.sym}...`);
  const amt = parseUnits(TOKEN_AMOUNT, 18);
  const tx = await wallet.writeContract({ address: t.addr, abi: ERC20_ABI, functionName: "transfer", args: [target, amt] });
  await publicClient.waitForTransactionReceipt({ hash: tx });
  console.log("  done:", tx);
}

console.log("\n========================================");
console.log("  分发完成!");
console.log("========================================");
console.log(`\n${target} 现在持有:`);
console.log(`  ${USDC_AMOUNT} USDC (gas + 交易)`);
console.log(`  ${TOKEN_AMOUNT} 个每种 RWA 代币 (aTREAS / aMOT / aVCC)`);
console.log("\n用这个地址在网站连接钱包即可 Sell + Buy。");
