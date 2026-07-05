# Stellar Token Studio — Frontend

dApp React + TypeScript + Vite + Tailwind yang terintegrasi dengan smart contract Soroban `tokens` (di `../contracts/tokens`).

## Fitur

- **Connect Freighter** — koneksi wallet dengan auto-reconnect saat halaman dimuat ulang
- **Daftar token** — membaca data on-chain lewat `get_token` (simulasi, tanpa tanda tangan)
- **Buat token** — memanggil `create_token` (nama + tipe, dengan preset tipe cepat), ditandatangani lewat Freighter
- **Hapus token** — memanggil `delete_token` berdasarkan ID
- Loading state per aksi, toast sukses/gagal, dan link ke contract di Stellar Expert

## Menjalankan

```bash
npm install
npm run dev
```

Prasyarat: extension [Freighter](https://www.freighter.app) terpasang di browser dan di-set ke jaringan **Testnet**.

## Konfigurasi

Diatur lewat `.env`:

```
VITE_STELLAR_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
VITE_STELLAR_RPC_URL=https://soroban-testnet.stellar.org
VITE_STELLAR_CONTRACT_ID=CBP4TMBYRAV5LMLZN626LLNZFQSUCV3N6QLBPQLM7ZOIY47ZDPFN4Q7H
```

## Update contract & bindings

Jika contract di `contracts/tokens` berubah, deploy ulang dan regenerate bindings:

```bash
# dari root repo
stellar contract build
stellar contract deploy --wasm target/wasm32v1-none/release/tokens.wasm --source deployer --network testnet
stellar contract bindings typescript --wasm target/wasm32v1-none/release/tokens.wasm --output-dir /tmp/tokens-bindings --overwrite
```

Lalu salin `/tmp/tokens-bindings/src/index.ts` ke `bindings/index.ts` dan perbarui `VITE_STELLAR_CONTRACT_ID` di `.env`.

## Struktur

- `bindings/index.ts` — TypeScript client hasil generate Stellar CLI dari wasm contract
- `src/stellar.ts` — koneksi Freighter + factory contract client
- `src/App.tsx` — seluruh UI (landing, form create, daftar token, toast)
