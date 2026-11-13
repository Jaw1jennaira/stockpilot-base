# Faucet Sepolia ETH — langkah manual (butuh browser)

Alamat agen testnet (baru, khusus StockPilot — BUKAN wallet user):
```
0x757cc1A5925be5532d241ED707cB213D3Ebf1F40
```
Saldo saat ini: 0 ETH (dicek 12 Nov 2026, block 57747783). Nonce 0.

## Cara klaim (pilih salah satu)
1. Buka https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet
   (atau https://faucet.quicknode.com/base/sepolia — halaman terbuka,
   kemungkinan butuh login/captcha).
2. Tempel alamat di atas, selesaikan captcha bila diminta, klaim.
   Jumlah tipikal: 0,05–0,1 Sepolia ETH — cukup untuk deploy + berminggu-minggu
   operasi agen (gas Base Sepolia sangat murah).
3. Verifikasi: `node -e` cek saldo via publicnode RPC, atau lihat di
   https://sepolia.basescan.org/address/0x757cc1A5925be5532d241ED707cB213D3Ebf1F40

## Setelah ada saldo
```bash
cd ~/workspace/goals/free-mint-hunter/base-stocks-maxxing
npm run deploy   # deploy kontrak + seed oracle + tulis state/deployment.json
node agent/index.js --once   # siklus pertama: update oracle + trade bila perlu
```

## Catatan
- Sepolia ETH TIDAK bernilai dan TIDAK bisa dijual — hanya gas testnet.
- JANGAN PERNAH kirim ETH/USDC mainnet ke alamat ini.
- Kunci privat alamat ini TIDAK ADA di repo ini — generate sendiri dengan
  `node scripts/gen-key.js` (file `state/agent-key.json`, gitignored) atau
  set env var `AGENT_PRIVATE_KEY`. Jangan pernah commit kunci ke GitHub.
- Percobaan via curl 12 Nov 2026: Coinbase faucet 403 (bot protection),
  QuickNode 200 (butuh browser/signup), tebakan API endpoint kosong —
  jadi klaim harus lewat browser.
