# Video Demo — StockPilot (Base Stocks Maxxing, track Agentic Stock Finance)

Target: video **2–3 menit** (maks 2:20 untuk X) + post X publik tag `@buildonbase`.
Bahasa: Inggris (audiens juri), subtitle opsional Bahasa Indonesia.
Format: rekaman layar 1920×1080, 30fps, suara jelas (narasi) + musik latar pelan.

## Persiapan sebelum rekam

1. Dashboard live: `npx serve frontend` (atau buka `frontend/index.html` via
   hosting statis) — pastikan NAV, holdings, dan 3 trade pertama tampil.
2. Tab Basescan siap: https://sepolia.basescan.org/address/0xa8dD0028001CAC9258083f150728586f3d6F9678
   (vault) + salah satu tx trade, mis. https://sepolia.basescan.org/tx/0x8e33618cd40a7ef447b77a87f223cd5616086f1324153c0f49f96d2a77a38f8b
3. Jalankan satu siklus agen segar sebelum rekam supaya oracle "fresh":
   `node agent/index.js --once` (butuh Sepolia ETH di kunci agen — faucet).
4. Tutup tab/notifikasi yang tidak perlu. Zoom browser 100–110%.

## Naskah & storyboard (total ±2:30)

| # | Durasi | Visual | Narasi (Inggris) |
|---|---|---|---|
| 1 | 0:00–0:15 | Dashboard StockPilot (NAV $10.000, holdings) | "Meet StockPilot — an autonomous AI agent that manages a tokenized-stock portfolio on Base Sepolia. No human clicks. Every decision is on-chain." |
| 2 | 0:15–0:45 | Scroll dashboard: oracle freshness 6/6, holdings NVDA/AAPL/TSLA/MSFT/GOOGL/AMZN | "StockPilot tracks six Coinbase tokenized stocks — NVDA, Apple, Tesla, Microsoft, Google, Amazon. Prices come from Base's official Tokenized Stocks API, posted on-chain by our oracle every hour." |
| 3 | 0:45–1:15 | Basescan: vault address + tx trade AAPL (0x8e33618c…) | "Here is the proof: the vault bought Apple at $356.55, Tesla at $389.10, Amazon at $266.77 — three real on-chain trades in the first cycle. Links are in the repo." |
| 4 | 1:15–1:50 | VS Code: `contracts/AgentVault.sol` (guardrail) + `agent/strategy.js` (momentum + mean-reversion) | "Safety is on-chain, not a promise: per-trade caps, a daily cap, a ticker allowlist, and a circuit breaker if the oracle goes stale. The strategy blends momentum and mean-reversion, keeps at least 20% cash." |
| 5 | 1:50–2:20 | Terminal: `npm run compile` → 5 kontrak OK; `node agent/index.js --once` → cycle log | "Everything is open source and reproducible: compile, deploy to Base Sepolia, run one command and the agent trades by itself. Testnet only — zero real funds." |
| 6 | 2:20–2:30 | Dashboard lagi + teks akhir: "StockPilot — Agentic Stock Finance — Base Stocks Maxxing" | "StockPilot — autonomous stock finance on Base. Built for the Base Stocks Maxxing Builder Quest." |

## Perintah rekam (di perangkat user / VM dengan layar)

```bash
# Linux (VM ini, bila ada X + ffmpeg): rekam layar + audio mic
ffmpeg -f x11grab -video_size 1920x1080 -framerate 30 -i :0.0 \
  -f pulse -i default -c:v libx264 -preset veryfast -crf 23 \
  -c:a aac -b:a 128k stockpilot-demo.mp4

# macOS (perangkat user): QuickTime Player → File → New Screen Recording,
# atau: screencapture -v -T 5 (video butuh QuickTime/OBS)
# OBS Studio (semua OS): Scene = Window Capture (browser) + Mic, Record → MP4
```

Alternatif tanpa rekam layar langsung: buat video dari screenshot + narasi
dengan `ffmpeg` (ken Burns) — skrip tersedia bila diminta.

## Checklist sebelum posting X

- [ ] Video ≤ 2:20 (X free) dan < 512 MB
- [ ] Post dari @CryptoRaid36388, tag `@buildonbase`, sebut track
      "Agentic Stock Finance" + link repo GitHub
- [ ] Caption contoh: "StockPilot 🤖 — autonomous AI agent trading tokenized
      stocks on Base Sepolia. Oracle + exchange + vault, all on-chain.
      Built for @buildonbase Stocks Maxxing — Agentic Stock Finance track.
      Repo: <link>"
- [ ] Simpan link post X — WAJIB dilampirkan di form submission resmi.

## Yang masih butuh user (tidak bisa dikerjakan agen)

- Rekaman layar + suara narasi (butuh perangkat/layar user — agen tidak bisa
  merekam video demo sendiri dari VM tanpa display).
- Upload + posting video ke X via @CryptoRaid36388 (jalur X Chromium VM
  sedang kena Cloudflare 403 — posting manual dari HP/browser user paling aman).
- Isi form submission resmi (Google Form di base.org/stocksmaxxing) atas
  identitas user + lampirkan link post X.
- Bila menang: verifikasi identitas + W-9/W-8 + tanda tangan deklarasi.
