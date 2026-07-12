# Arc RWA Market

Arc Testnet 上的 RWA 预测市场与资产交易前端。

合约：`RWAToken`、`RWAMarketplace`、`RWAPredictionMarket`（`contracts/src/Standalone.sol`）。  
前端：Next.js 15、wagmi / viem、Tailwind。

## 运行

```bash
npm install
cp .env.example .env.local
npm run dev
```

浏览器打开 `http://localhost:3000`。

未配置 `NEXT_PUBLIC_PREDICTION_ADDRESS` 时，Markets 使用本地预览数据，便于联调 UI；部署合约并写入地址后走链上读写。

## 环境变量

复制 `.env.example` 为 `.env.local`，填入部署后的地址：

| 变量 | 说明 |
|------|------|
| `NEXT_PUBLIC_MARKETPLACE_ADDRESS` | 挂单市场合约 |
| `NEXT_PUBLIC_PREDICTION_ADDRESS` | 预测市场合约 |
| `NEXT_PUBLIC_TOKEN_TREASURY` | 国债类 RWA 代币 |
| `NEXT_PUBLIC_TOKEN_REALESTATE` | 房地产类 RWA 代币 |
| `NEXT_PUBLIC_TOKEN_CARBON` | 碳信用类 RWA 代币 |

`.env.local`、`.deployer-key` 已在 `.gitignore` 中，不要提交。

## Arc Testnet

| | |
|--|--|
| Chain ID | `5042002` |
| RPC | `https://rpc.testnet.arc.network` |
| Gas / 结算 | USDC |
| Explorer | https://testnet.arcscan.app |
| Faucet | https://faucet.circle.com （选 Arc Testnet） |

钱包需切到 Arc Testnet。

## 部署合约

```bash
node scripts/deploy.mjs
```

脚本会：复用或生成 `.deployer-key` → 编译 `Standalone.sol` → 余额为 0 时打印领水地址 → 部署并写回 `.env.local`。

也可：

```bash
npm run deploy:arc
```

## 目录

```
contracts/src/     Solidity（Standalone.sol）
scripts/           编译 / 部署辅助脚本
src/app/           页面
src/components/    UI
src/hooks/         数据与写链
src/lib/           链配置、ABI、类型
```

## 页面

- **Markets** — 预测市场列表、详情、Yes/No 下单
- **Assets** — RWA 资产与挂单
- **Portfolio** — 持仓、本地成交记录、钱包余额

## License

MIT
