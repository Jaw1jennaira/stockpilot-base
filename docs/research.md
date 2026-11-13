# Base Stocks Maxxing — Riset Quest (12 Nov 2026)

Sumber resmi diverifikasi 12 Nov 2026 (WIB):
- Quest page: https://base.org/stocksmaxxing
- Official rules: https://www.base.org/stocksmaxxing/rules
- Ringkasan: https://devgrantsdaily.com/items/2026-11-11-base-stocks-maxxing-builder-quest/
- Tokenized Stocks API docs: https://docs.base.org/sdks/tokenized-stocks/overview
- Laporan: CryptoBriefing 6 Nov 2026 (skor 50% traksi / 25% produk / 25% build in public),
  FinanceFeeds 11 Sep 2026 (mekanik B20), Ozmium docs (agen trading B20).

## Fakta quest
- Nama: Base Builder Quest — Stocks Maxxing Season. Sponsor: Coinbase Technologies, Inc.
- Periode: 5 Nov – 5 Des 2026 (UTC). Deadline submit: 5 Des 2026.
- Hadiah: $100.000+ → track Base $50.000 + partner $48.000 + community
  "build in public" $6.000. Dibayar USDC di Base ke team representative.
- Track (dinilai terpisah): 1) Meme and Community Economies,
  2) **Agentic Stock Finance** ← track kami, 3) Programmable Stock Markets.
- Partner: o1 Exchange, Bankr, Stonks Exchange, BaseStonk, Feel.cash, Hydrex.
- Penilaian (dari laporan pers; bobot resmi ada di Quest Page):
  ~50% traksi (real onchain usage), ~25% produk, ~25% building in public.
- Testnet DIBOLEHKAN dan "tidak dinilai lebih rendah" (Rules §5).
  Tidak perlu beli/token/funding untuk ikut.
- Cara ikut (Rules §5): (1) post X publik berisi VIDEO DEMO + tag @buildonbase,
  (2) isi official submission form (Google Form, link di Quest Page, tombol
  "Apply Now"), sertakan link post X + track yang dipilih.
  Satu submission per track. Submission via automated means / identitas
  orang lain = VOID — form + post X harus atas identitas entrant sendiri.
- Eligibilitas (Rules §4): usia ≥18, bukan residen negara yang disanksi OFAC.
  Tim maks 5 orang, satu team representative menerima hadiah.
- Pemenang (Rules §9): dihubungi via email/X DM, WAJIB balas ≤7 hari,
  verifikasi identitas + sanctions screening + form pajak W-9/W-8 +
  alamat wallet + signed declaration. Hadiah dikirim ≤30 hari setelah
  verifikasi. ⚠️ Bagian ini HANYA bisa dilakukan user (YUSMARA) bila menang —
  agen tidak bisa tanda tangan dokumen identitas/pajak atas nama user.
- Aturan konten (Rules §6): jangan klaim hubungan/endorsement dari sponsor,
  partner, issuer, atau perusahaan publik; jangan klaim hak (mis. voting)
  yang tidak diberikan asetnya. Produk harus patuh hukum sekuritas dll.

## Fakta tokenized stocks di Base (mekanik produk)
- Coinbase-issued tokenized stocks, launch 24 Agu 2026, standar B20
  (ekstensi ERC-20, 8 desimal, 1 token ≈ 1 saham × multiplier on-chain).
  13+ ticker: NVDAc, AAPLc, TSLAc, MSFTc, GOOGLc, AMZNc, METAc, COINc,
  NIOc, NOKc, dll. Alamat kontrak diawali `0xb200...` (contoh terverifikasi:
  NIOc `0xb2000000000000000000002d2b5dc53c61f1ba06`,
  NOKc `0xB2000000000000000000005ac674f707E357409c`).
- B20 adalah precompile native Base mainnet — TIDAK ada kontrak per-aset
  yang bisa di-deploy ulang; token hanya ada di Base mainnet (chain 8453).
  → Di Base Sepolia (testnet) TIDAK ADA token B20 asli. Karena itu MVP
  memakai token mirror (MockStockToken, ERC-20 8 desimal) + oracle harga
  dari API resmi, dengan perdagangan tercatat on-chain di testnet.
- Harga referensi: Chainlink NAV feed (24/5, freeze saat corporate action).
  API resmi Tokenized Stocks (docs.base.org, read-only, tanpa key):
  list token, metadata, total-supply, corporate actions. Base URL persis
  API ini tidak tampil di crawl docs (code block ter-strip) — agent memakai
  `BASE_STOCKS_API_URL` dari env; fallback harga: Stooq daily closes.
- Venue utama mainnet: Aerodrome (76–98% volume). Volume kumulatif DEX
  tokenized stocks >$5 miliar per 11 Nov 2026. Reg S: mint/redemption
  gated (bukan untuk US persons); secondary transfer permissionless.
- Aave/Morpho/Euler menerima token ini sebagai collateral (mainnet).

## Keputusan desain MVP — "StockPilot"
- Nama: StockPilot — Agentic Stock Finance. Agen AI otonom yang mengelola
  portofolio saham tokenisasi di Base Sepolia testnet, 100% on-chain.
- Kontrak (Base Sepolia, chain 84532): MockUSDC (6 des) + MockStockToken
  per ticker (8 des) + StockOracle (harga NAV on-chain, staleness check)
  + StockExchange (beli/jual di harga oracle ± fee 10 bps, event Trade)
  + AgentVault (hanya agen yang bisa trade; guardrail: cap per-trade,
  cap trade/hari, allowlist ticker, circuit breaker).
- Agen off-chain (Node + ethers v6): ambil harga → hitung sinyal
  (momentum 5d vs 20d + mean-reversion) → rebalance via vault.trade →
  semua keputusan tercatat on-chain (event) + log JSON.
- Traksi (50% skor): setiap trade = transaksi on-chain nyata di testnet;
  dashboard publik; build in public via X @CryptoRaid36388.
- Dana: NOL. Hanya faucet Sepolia ETH (valueless) + mock USDC.
  Tidak ada dana user yang dipakai. Tidak ada mainnet.

## Blocker (per 12 Nov 2026, update 15:15 WIB)
1. **Faucet Base Sepolia ETH (SATU-SATUNYA blocker deploy):** alamat agen
   testnet `0x757cc1A5925be5532d241ED707cB213D3Ebf1F40` saldo 0 (nonce 0,
   block 57747783). Coinbase faucet 403 via curl (bot protection), QuickNode
   200 (butuh browser/signup) — klaim HARUS lewat browser (lihat
   `scripts/faucet.md`). Setelah ada ~0,05 ETH: `npm run deploy` + agen jalan.
2. GitHub user SUSPENDED — repo publik untuk submission belum bisa dibuat.
   Kode disimpan lokal di workspace ini; butuh akun GitHub baru (user yang
   putuskan) atau hosting alternatif sebelum submit.
3. Video demo X: butuh rekaman layar dashboard + narasi (agen bisa buat
   skrip/naskah; perekaman/pengunggahan via @CryptoRaid36388 — jalur X
   Chromium sedang kena Cloudflare 403, jadi posting X butuh jalur manual
   atau tunggu pulih).
4. Submission form (Google Form): harus diisi atas identitas user —
   agen TIDAK boleh mengisi memakai identitas user tanpa konfirmasi.
5. Bila menang: verifikasi identitas + W-9/W-8 + tanda tangan deklarasi
   = bagian user (butuh_user).

## Temuan teknis terverifikasi 12 Nov 2026
- **Base Tokenized Stocks API = `https://api.coinbase.com/v1/tokenized-stocks`**
  (ditemukan di HTML docs; tanpa key; paginasi `page_size`/`page_token`).
  `/chains` mengembalikan HANYA chain 8453 (Base mainnet) → B20 memang
  tidak ada di testnet; desain mirror-token terkonfirmasi benar.
- NAV live 12 Nov (UTC): NVDAc 161,03 | AAPLc 356,55 | TSLAc 387,07 |
  MSFTc 520,37 | GOOGLc 295,38 | AMZNc 265,44. Alamat kontrak mainnet +
  multiplier tersimpan di `state/tokens-mainnet.json`.
- NAV hanya update saat market buka/deviasi (24/5) — bisa basi semalam/
  akhir pekan. Karena itu: oracle agen pakai NAV bila ≤36 jam, kalau tidak
  fallback ke Yahoo close; `StockExchange.MAX_PRICE_AGE` = 36 jam.
- Stooq HTTP 403 via egress VM ini — diganti Yahoo Finance chart API
  (tanpa key, teruji: histori NVDA 65 titik, close terakhir 173,73 tgl 11 Nov).
- RPC Base Sepolia yang jalan: `https://base-sepolia-rpc.publicnode.com`
  (chain 0x14a34 = 84532; `mainnet.base.org`/`sepolia.base.org` timeout POST).
- Strategi v1 teruji di data sintetis: uptrend → beli, downtrend → 0,
  cash floor 20% dipatuhi, maks 3 trade/siklus.
- Kontrak terkompilasi bersih (solc 0.8.28): MockUSDC, MockStockToken,
  StockOracle, StockExchange, AgentVault. Agen `--once` gagal dengan
  anggun tanpa deployment ("no deployment — run scripts/deploy.js first").

## Checklist submission
- [x] Riset syarat resmi (dokumen ini)
- [x] Arsitektur + kontrak ditulis & dikompilasi
- [x] Deploy ke Base Sepolia (12 Nov 2026 10:09 UTC — lihat DEPLOYMENT.md)
- [x] Agen jalan: oracle update + 3 trade pertama tercatat on-chain
      (AAPL/TSLA/AMZN, tx di DEPLOYMENT.md)
- [x] Dashboard publik bisa dibuka (frontend/, baca RPC publik)
- [x] Repo publik siap push (staging bersih, tanpa secret — 13 Nov 2026)
- [ ] Repo publik di-push ke GitHub (akun Jaw1jennaira, via HTTPS + PAT)
- [ ] Video demo direkam + post X tag @buildonbase (naskah: docs/demo-script.md)
- [ ] Form submission diisi (identitas user — butuh konfirmasi)
- [ ] Build in public: thread progres berkala di X
