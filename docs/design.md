# StockPilot — Design

## Masalah yang dipecahkan
Tokenized stocks Coinbase (B20) di Base adalah aset nyata yang bisa
diperdagangkan 24/7, tapi: (1) harganya bergerak saat pasar saham tutup,
(2) investor ritel tidak bisa memantau 6+ saham sekaligus, (3) tidak ada
agen yang mengelola portofolio saham tokenisasi secara otonom dengan
guardrail yang transparan. StockPilot adalah agen itu — untuk track
**Agentic Stock Finance**.

## Arsitektur (Base Sepolia, chain 84532)
```
Stooq / Base Tokenized Stocks API (harga NAV)
        │
        ▼
  agent (Node, off-chain) ── strategy ──► AgentVault.trade()
        │                                        │
        ▼                                        ▼
  StockOracle.postPrices()              StockExchange.buy()/sell()
        │                                        │
        └──────────► harga on-chain ◄─────────────┘
              MockUSDC + MockStockToken (8 des, mirror B20)
```
Semua state penting ada on-chain: harga (oracle), kepemilikan (vault),
dan setiap trade (event `Trade` + `AgentTrade`). Dashboard membaca
langsung dari RPC publik — tidak ada backend yang dipercaya.

## Kontrak
| Kontrak | Peran |
|---|---|
| MockUSDC | USDC mainan 6 des; siapa pun bisa mint (cap 100rb/call). |
| MockStockToken | Mirror B20 per ticker, 8 des; hanya Exchange yang bisa mint. |
| StockOracle | Harga NAV USD 8 des + timestamp; `isFresh(maxAge)`. |
| StockExchange | Beli/jual di harga oracle ± fee 10 bps; tolak bila harga basi >1 jam; inventaris saham + likuiditas USDC. |
| AgentVault | Brankas; hanya agen yang bisa trade; guardrail (cap/trade, cap/hari, allowlist, pause). |

Matematika harga (cek satuan):
- Beli: `stockOut = usdcAmount * 1e10 / price * (10000-fee)/10000`
  (USDC 6 des, harga USD 8 des, saham 8 des).
- Jual: `usdcOut = stockAmount * price / 1e10 * (10000-fee)/10000`.

## Strategi v1 (momentum + mean-reversion)
Data: daily closes (Stooq; ganti ke NAV API bila `BASE_STOCKS_API_URL` diisi).
Per ticker:
- `momentum = close / SMA20 - 1`
- `z = (close - SMA20) / SD20`
- `score = 0.6*momentum - 0.4*z` (momentum positif + oversold = beli)
- Stop-loss: keluar bila -10% dalam sehari.
- Bobot target ∝ skor positif, cap 25%/ticker, kas minimal 20%.
- Rebalance bila |target - saat ini| > 5% NAV; maks 3 trade/siklus
  (sesuai cap harian vault). Siklus: 60 menit (harga harian → sinyal
  stabil; trade dieksekusi saat oracle diperbarui tiap siklus).

Keterbatasan jujur: sinyal dari harga harian = strategi lambat, cocok
untuk demo & traksi on-chain; bukan HFT. Tidak ada leverage, tidak ada
short, tidak ada token baru yang di-launch (sesuai rules: token opsional).

## Traksi (50% skor) — rencana
1. Setiap siklus agen = transaksi on-chain nyata (oracle update + trade).
   Dengan 60 menit/siklus → ~24 tx/hari ke kontrak kami = penggunaan
   on-chain yang terverifikasi di Basescan Sepolia.
2. Dashboard publik + repo publik (setelah blocker GitHub selesai).
3. Build in public: thread X @CryptoRaid36388 — progres harian, NAV vault,
   trade log (25% skor build-in-public ikut terdongkrak).
4. Undang komunitas mencoba: siapa pun bisa mint mock USDC + trade di
   exchange kami (testnet, gratis) — menambah pengguna & tx.

## Keamanan & kepatuhan
- Testnet saja; dana NOL; kunci agen baru khusus testnet (bukan kunci user).
- Vault guardrail on-chain (bukan janji off-chain).
- Tidak ada klaim endorsement: nama "StockPilot", bukan "Coinbase/Base".
  Disclaimer di dashboard: mirror token BUKAN saham asli, bukan
  representasi kepemilikan, hanya demo testnet.
- Tidak ada pengumpulan data pribadi; tidak ada KYC di aplikasi.
- Submission form + video demo + verifikasi pemenang = identitas user
  (butuh_user), agen tidak mengisi atas nama user.

## Roadmap ke 5 Des
- 12–13 Nov: riset + kontrak + agen + dashboard (run ini). Deploy setelah faucet.
- 14–20 Nov: agen jalan harian, stabilkan oracle/strategi, thread X #1–3.
- 21–27 Nov: polish dashboard, undang tester testnet, rekam video demo.
- 28 Nov–3 Des: finalisasi repo + README, post X video demo, isi form.
- 4–5 Des: submit + verifikasi form diterima.
