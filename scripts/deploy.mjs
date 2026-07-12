#!/usr/bin/env node
// 一键部署 RWA 合约到 Arc Testnet
// 用法: node scripts/deploy.mjs
// 流程: 生成钱包 -> 查余额 -> 没钱就显示地址让你去领 -> 有钱就自动部署 4 个合约 -> 写 .env.local

import fs from "node:fs";
import path from "node:path";
import { createPublicClient, createWalletClient, http, formatUnits, encodeDeployData, defineChain } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import pkg from "solc";
const solc = pkg;

const ROOT = path.resolve(import.meta.dirname, "..");
const RPC = "https://rpc.testnet.arc.network";
const USDC = "0x3600000000000000000000000000000000000000";
const KEY_FILE = path.join(ROOT, ".deployer-key");
const ENV_FILE = path.join(ROOT, ".env.local");

const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: { default: { http: [RPC] } },
});

// ---------- 1. 钱包 ----------
let pk;
if (fs.existsSync(KEY_FILE)) {
  pk = fs.readFileSync(KEY_FILE, "utf8").trim();
  console.log("Reusing existing deployer wallet");
} else {
  pk = generatePrivateKey();
  fs.writeFileSync(KEY_FILE, pk, { mode: 0o600 });
  console.log("Generated new deployer wallet (saved to .deployer-key)");
}
const account = privateKeyToAccount(pk);
console.log("Deployer address:", account.address);

// ---------- 2. 编译合约 ----------
console.log("\nCompiling contracts...");
const src = fs.readFileSync(path.join(ROOT, "contracts/src/Standalone.sol"), "utf8");
const input = {
  language: "Solidity",
  sources: { "Standalone.sol": { content: src } },
  settings: { optimizer: { enabled: true, runs: 200 }, evmVersion: "paris", outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } } },
};
const out = JSON.parse(solc.compile(JSON.stringify(input)));
if (out.errors?.some((e) => e.severity === "error")) {
  console.error(out.errors.filter((e) => e.severity === "error").map((e) => e.formattedMessage).join("\n"));
  process.exit(1);
}
const pick = (n) => out.contracts["Standalone.sol"][n];
const Market = pick("RWAMarketplace");
const Token = pick("RWAToken");
const Prediction = pick("RWAPredictionMarket");
console.log("Compiled OK");

// ---------- 3. 连 RPC + 查余额 ----------
const publicClient = createPublicClient({ chain: arcTestnet, transport: http(RPC) });
const walletClient = createWalletClient({ account, chain: arcTestnet, transport: http(RPC) });

// Arc native currency 是 USDC (18 decimals 用于 gas)
let balance;
try {
  balance = await publicClient.getBalance({ address: account.address });
} catch (e) {
  console.error("\n无法连接 Arc RPC:", e.message);
  console.error("请检查网络后重试: node scripts/deploy.mjs");
  process.exit(1);
}
console.log("\nNative balance:", formatUnits(balance, 18));

if (balance === 0n) {
  console.log("\n========================================");
  console.log("  钱包余额为 0，需要先领取测试 USDC");
  console.log("========================================");
  console.log("\n部署者地址 (复制这个去领 USDC):");
  console.log("  " + account.address);
  console.log("\n领 USDC: https://faucet.circle.com  (选 Arc Testnet)");
  console.log("或者:    https://faucet.testnet.arc.network");
  console.log("\n领完后重新运行: node scripts/deploy.mjs");
  process.exit(0);
}

// ---------- 4. 部署 ----------
const ASSETS = [
  { name: "Arc Treasury Bond 2026", symbol: "aTREAS", type: "Government Bond", uri: "Tokenized U.S. Treasury bonds held by a regulated custodian, 1:1 backed.", value: 10_000_000 },
  { name: "Manhattan Office Tower", symbol: "aMOT", type: "Commercial Real Estate", uri: "Tokenized income rights of a Manhattan Grade-A office tower, monthly rent distribution.", value: 50_000_000 },
  { name: "Verified Carbon Credits 2026", symbol: "aVCC", type: "Carbon Credit", uri: "Verra-verified carbon credits, ideal for ESG portfolio allocation.", value: 2_000_000 },
];

async function deploy(abi, bytecode, args, label) {
  console.log(`\nDeploying ${label}...`);
  const data = encodeDeployData({ abi, bytecode, args });
  const hash = await walletClient.sendTransaction({ data, account });
  console.log("  tx:", hash);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (!receipt.contractAddress) throw new Error(`${label}: no contract address in receipt`);
  console.log("  deployed at:", receipt.contractAddress);
  return receipt.contractAddress;
}

const tokenAddrs = [];
for (let i = 0; i < ASSETS.length; i++) {
  const a = ASSETS[i];
  const value = BigInt(a.value) * (BigInt(10) ** BigInt(6));
  const addr = await deploy(Token.abi, "0x" + Token.evm.bytecode.object, [a.name, a.symbol, a.type, a.uri, value, account.address], `RWA Token ${i + 1} (${a.symbol})`);
  tokenAddrs.push(addr);
}

const mpAddr = await deploy(Market.abi, "0x" + Market.evm.bytecode.object, [USDC, account.address], "RWAMarketplace");

const predAddr = await deploy(Prediction.abi, "0x" + Prediction.evm.bytecode.object, [USDC], "RWAPredictionMarket");

// 创建 demo 预测市场
const PREDICTION_MARKETS = [
  { question: "Will aTREAS NAV exceed $1.05 by Q3 2026?", symbol: "aTREAS", category: "NAV", days: 90 },
  { question: "Will aMOT APY stay above 6% this month?", symbol: "aMOT", category: "APY", days: 30 },
  { question: "Will aVCC carbon credits rise 5% in 30 days?", symbol: "aVCC", category: "Price", days: 30 },
  { question: "Will Arc RWA total AUM exceed $100M by end of 2026?", symbol: "RWA", category: "Volume", days: 180 },
  { question: "Will Fed cut rates again in Q3 2026? (aTREAS impact)", symbol: "aTREAS", category: "NAV", days: 60 },
  { question: "Will aMOT occupancy rate stay above 90% in Q3?", symbol: "aMOT", category: "APY", days: 45 },
];

console.log("\nCreating prediction markets...");
const nowSec = Math.floor(Date.now() / 1000);
for (let i = 0; i < PREDICTION_MARKETS.length; i++) {
  const m = PREDICTION_MARKETS[i];
  const endTime = nowSec + m.days * 86400;
  const { encodeFunctionData } = await import("viem");
  const data = encodeFunctionData({
    abi: Prediction.abi,
    functionName: "createMarket",
    args: [m.question, m.symbol, m.category, BigInt(endTime)],
  });
  const hash = await walletClient.sendTransaction({ to: predAddr, data, account });
  await publicClient.waitForTransactionReceipt({ hash });
  console.log(`  Market ${i + 1}: ${m.symbol} / ${m.category}`);
}

// ---------- 5. 写 .env.local ----------
const env = [
  `NEXT_PUBLIC_MARKETPLACE_ADDRESS=${mpAddr}`,
  `NEXT_PUBLIC_PREDICTION_ADDRESS=${predAddr}`,
  `NEXT_PUBLIC_TOKEN_TREASURY=${tokenAddrs[0]}`,
  `NEXT_PUBLIC_TOKEN_REALESTATE=${tokenAddrs[1]}`,
  `NEXT_PUBLIC_TOKEN_CARBON=${tokenAddrs[2]}`,
  "",
].join("\n");
fs.writeFileSync(ENV_FILE, env);

console.log("\n========================================");
console.log("  部署成功! 地址已写入 .env.local");
console.log("========================================");
console.log("\nMarketplace:", mpAddr);
console.log("Prediction: ", predAddr);
tokenAddrs.forEach((a, i) => console.log(`Token ${i + 1}:    `, a));
console.log("\n下一步: 重启服务");
console.log("  npm run build && npx next start -H 127.0.0.1");
