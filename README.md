# Stellar Bootcamp — Soroban Smart Contracts

A collection of simple Soroban smart contracts built on the Stellar blockchain,
created as part of a data/bootcamp exercise. The workspace demonstrates basic
on-chain CRUD (create, read, delete) patterns using instance storage.

## Overview

This is a Cargo workspace containing two independent Soroban contracts that share
the same structure and storage approach:

| Contract | Crate    | Stores | Item fields                |
| -------- | -------- | ------ | -------------------------- |
| Tokens   | `tokens` | Tokens | `id`, `name`, `type_token` |

Both contracts keep their data in a `Vec<T>` under a single instance-storage key
and generate item IDs using the on-chain PRNG (`env.prng().gen::<u64>()`).

## Project Structure

```
.
├── Cargo.toml                # Workspace manifest (soroban-sdk 25)
├── Cargo.lock
└── contracts
    └── tokens
        ├── Cargo.toml
        ├── Makefile
        └── src
            ├── lib.rs        # TokenContract
            └── test.rs
```

## Contract Functions

### Tokens (`TokenContract`)

- `get_token(env) -> Vec<Token>` — returns all stored tokens (empty vec if none).
- `create_token(env, name: String, type_token: String) -> String` — appends a
  new token with a randomly generated `id`. Returns `"Tokens berhasil ditambahkan"`.
- `delete_token(env, id: u64) -> String` — removes the token with the matching
  `id`. Returns `"Berhasil hapus tokens"` on success or
  `"Tokens tidak ditemukan"` if the id is not found.

## Requirements

- [Rust](https://www.rust-lang.org/) with the `wasm32v1-none` target
- [Stellar CLI](https://developers.stellar.org/docs/tools/cli) (`stellar`)
- `soroban-sdk` 25 (pinned in the workspace manifest)

## Build & Test

Each contract ships with a `Makefile`. Run these from inside the contract
directory (e.g. `contracts/tokens`):

```bash
make build   # stellar contract build -> target/wasm32v1-none/release/*.wasm
make test    # cargo test (also builds first)
make fmt     # cargo fmt --all
make clean   # cargo clean
```

To build every contract in the workspace at once:

```bash
stellar contract build
```

> Token: `contracts/*/src/test.rs` currently contain only the test scaffolding —
> no test cases have been written yet.

## Tokens on Storage

Both contracts use **instance storage** with a single `symbol_short!` key
(`TKN_DATA`). All items are held in one `Vec`, so reads and deletes
iterate over the entire collection. This is intentionally simple and suited to
small datasets for learning purposes.