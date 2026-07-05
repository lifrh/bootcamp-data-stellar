import { useCallback, useEffect, useState, type FormEvent } from "react";
import { type Token } from "../bindings/index.ts";
import { connectFreighter, reconnectFreighter, createContractClient, CONTRACT_ID, EXPLORER_CONTRACT_URL } from "./stellar";

type Toast = { kind: "success" | "error"; text: string } | null;

const TYPE_PRESETS = ["Utility", "Governance", "Stablecoin", "Reward", "Meme", "RWA"];

const BADGE_STYLES = [
  "bg-violet-500/15 text-violet-300 ring-violet-400/30",
  "bg-sky-500/15 text-sky-300 ring-sky-400/30",
  "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
  "bg-amber-500/15 text-amber-300 ring-amber-400/30",
  "bg-rose-500/15 text-rose-300 ring-rose-400/30",
  "bg-cyan-500/15 text-cyan-300 ring-cyan-400/30",
];

function badgeFor(type: string) {
  let hash = 0;
  for (const ch of type.toLowerCase()) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return BADGE_STYLES[hash % BADGE_STYLES.length];
}

function shortAddress(addr: string) {
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

function Spinner({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={`${className} animate-spin`} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

function StarLogo() {
  return (
    <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-lg shadow-violet-900/50">
      <svg viewBox="0 0 24 24" className="size-5 text-white" fill="currentColor" aria-hidden>
        <path d="M12 2l2.6 6.6L21 11l-6.4 2.4L12 20l-2.6-6.6L3 11l6.4-2.4L12 2z" />
      </svg>
    </span>
  );
}

export default function App() {
  const [wallet, setWallet] = useState("");
  const [tokens, setTokens] = useState<Token[]>([]);
  const [toast, setToast] = useState<Toast>(null);

  const [connecting, setConnecting] = useState(false);
  const [loadingTokens, setLoadingTokens] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [typeValue, setTypeValue] = useState("");

  const fail = (err: unknown) =>
    setToast({ kind: "error", text: err instanceof Error ? err.message : "Something went wrong" });

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  const loadTokens = useCallback(async (address: string) => {
    setLoadingTokens(true);
    try {
      const tx = await createContractClient(address).get_token();
      setTokens(tx.result ?? []);
    } catch (err) {
      fail(err);
    } finally {
      setLoadingTokens(false);
    }
  }, []);

  // Restore an already-approved Freighter session on page load.
  useEffect(() => {
    reconnectFreighter().then((address) => {
      if (address) {
        setWallet(address);
        loadTokens(address);
      }
    });
  }, [loadTokens]);

  async function handleConnect() {
    setConnecting(true);
    try {
      const address = await connectFreighter();
      setWallet(address);
      await loadTokens(address);
    } catch (err) {
      fail(err);
    } finally {
      setConnecting(false);
    }
  }

  function handleDisconnect() {
    setWallet("");
    setTokens([]);
    setToast(null);
  }

  async function handleCreateToken(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    const form = new FormData(formEl);

    setCreating(true);
    try {
      const client = createContractClient(wallet);
      const tx = await client.create_token({
        name: String(form.get("name")).trim(),
        type_token: String(form.get("type_token")).trim(),
      });
      await tx.signAndSend();

      formEl.reset();
      setTypeValue("");
      setToast({ kind: "success", text: "Token created on-chain 🎉" });
      await loadTokens(wallet);
    } catch (err) {
      fail(err);
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteToken(id: Token["id"]) {
    setDeletingId(String(id));
    try {
      const client = createContractClient(wallet);
      const tx = await client.delete_token({ id });
      await tx.signAndSend();

      setToast({ kind: "success", text: "Token deleted" });
      await loadTokens(wallet);
    } catch (err) {
      fail(err);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="relative min-h-svh overflow-hidden bg-[#07060f] font-sans text-slate-100">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-violet-700/25 blur-3xl" />
        <div className="absolute right-[-10rem] top-1/3 h-80 w-80 rounded-full bg-fuchsia-700/15 blur-3xl" />
        <div className="absolute bottom-[-8rem] left-[-6rem] h-80 w-80 rounded-full bg-sky-700/15 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-svh w-full max-w-5xl flex-col px-6 py-8">
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <StarLogo />
            <div>
              <h1 className="text-lg font-semibold tracking-tight">Stellar Token Studio</h1>
              <p className="text-xs text-slate-400">Soroban smart contract dApp</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
              ● Testnet
            </span>

            {wallet && (
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1 pl-3 pr-1 backdrop-blur">
                <span className="font-mono text-xs text-slate-300" title={wallet}>
                  {shortAddress(wallet)}
                </span>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(wallet)}
                  className="cursor-pointer rounded-full p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
                  title="Copy address">
                  <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <rect x="9" y="9" width="11" height="11" rx="2" />
                    <path d="M5 15V5a2 2 0 012-2h10" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="cursor-pointer rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:bg-rose-500/20 hover:text-rose-300">
                  Disconnect
                </button>
              </div>
            )}
          </div>
        </header>

        {!wallet ? (
          /* ---------- Landing / connect ---------- */
          <section className="flex flex-1 flex-col items-center justify-center py-24 text-center">
            <div className="mb-6 grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-2xl shadow-violet-900/60">
              <svg viewBox="0 0 24 24" className="size-8 text-white" fill="currentColor" aria-hidden>
                <path d="M12 2l2.6 6.6L21 11l-6.4 2.4L12 20l-2.6-6.6L3 11l6.4-2.4L12 2z" />
              </svg>
            </div>
            <h2 className="max-w-xl bg-gradient-to-r from-white via-violet-200 to-fuchsia-300 bg-clip-text text-4xl font-bold tracking-tight text-transparent">
              Kelola token on-chain di Stellar
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-400">
              Buat, lihat, dan hapus data token yang tersimpan langsung di smart contract Soroban pada jaringan Stellar
              Testnet. Hubungkan wallet Freighter untuk memulai.
            </p>
            <button
              type="button"
              onClick={handleConnect}
              disabled={connecting}
              className="mt-8 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-900/50 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60">
              {connecting ? <Spinner /> : (
                <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M21 12V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2v-5z" />
                  <path d="M16 12h.01" />
                </svg>
              )}
              {connecting ? "Connecting…" : "Connect Freighter"}
            </button>
            <a
              href={EXPLORER_CONTRACT_URL}
              target="_blank"
              rel="noreferrer"
              className="mt-4 text-xs text-slate-500 underline-offset-4 transition-colors hover:text-violet-300 hover:underline">
              Lihat contract di Stellar Expert ↗
            </a>
          </section>
        ) : (
          /* ---------- Dashboard ---------- */
          <section className="mt-10 grid flex-1 items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
            {/* Create form */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur lg:sticky lg:top-8">
              <h2 className="text-base font-semibold">Buat Token Baru</h2>
              <p className="mt-1 text-xs text-slate-400">Data disimpan on-chain lewat fungsi `create_token`.</p>

              <form className="mt-5 flex flex-col gap-4" onSubmit={handleCreateToken}>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-slate-300">Nama token</span>
                  <input
                    name="name"
                    placeholder="cth: Lumen Reward"
                    required
                    maxLength={64}
                    className="rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/20"
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-slate-300">Tipe token</span>
                  <input
                    name="type_token"
                    placeholder="cth: Utility"
                    required
                    maxLength={32}
                    value={typeValue}
                    onChange={(e) => setTypeValue(e.target.value)}
                    className="rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/20"
                  />
                </label>

                <div className="flex flex-wrap gap-1.5">
                  {TYPE_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setTypeValue(preset)}
                      className={`cursor-pointer rounded-full px-3 py-1 text-xs ring-1 transition ${
                        typeValue === preset
                          ? "bg-violet-500/25 text-violet-200 ring-violet-400/50"
                          : "bg-white/5 text-slate-400 ring-white/10 hover:bg-white/10 hover:text-slate-200"
                      }`}>
                      {preset}
                    </button>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={creating}
                  className="mt-1 inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-900/40 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60">
                  {creating && <Spinner />}
                  {creating ? "Menunggu tanda tangan…" : "Create Token"}
                </button>
              </form>
            </div>

            {/* Token list */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold">Daftar Token</h2>
                  <p className="mt-1 text-xs text-slate-400">
                    {tokens.length} token tersimpan di contract{" "}
                    <a
                      href={EXPLORER_CONTRACT_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-violet-300 underline-offset-2 hover:underline"
                      title={CONTRACT_ID}>
                      {shortAddress(CONTRACT_ID)} ↗
                    </a>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => loadTokens(wallet)}
                  disabled={loadingTokens}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60">
                  {loadingTokens ? <Spinner className="size-3.5" /> : (
                    <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                      <path d="M21 12a9 9 0 11-2.6-6.4" />
                      <path d="M21 3v6h-6" />
                    </svg>
                  )}
                  Refresh
                </button>
              </div>

              <div className="mt-5">
                {loadingTokens && tokens.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-16 text-slate-400">
                    <Spinner className="size-6" />
                    <p className="text-sm">Memuat token dari chain…</p>
                  </div>
                ) : tokens.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-white/10 py-16 text-center">
                    <span className="text-3xl">🪐</span>
                    <p className="text-sm font-medium text-slate-300">Belum ada token</p>
                    <p className="max-w-xs text-xs text-slate-500">
                      Buat token pertamamu lewat form di samping — data akan tercatat permanen di Stellar Testnet.
                    </p>
                  </div>
                ) : (
                  <ul className="flex flex-col gap-3">
                    {tokens.map((token) => {
                      const idStr = String(token.id);
                      const isDeleting = deletingId === idStr;
                      return (
                        <li
                          key={idStr}
                          className="group flex items-center gap-4 rounded-xl border border-white/10 bg-black/20 p-4 transition hover:border-violet-400/30 hover:bg-black/30">
                          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 text-sm font-bold text-slate-200 ring-1 ring-white/10">
                            {token.name.slice(0, 2).toUpperCase()}
                          </span>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate font-medium">{token.name}</p>
                              <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ${badgeFor(token.type_token)}`}>
                                {token.type_token}
                              </span>
                            </div>
                            <p className="mt-0.5 truncate font-mono text-[11px] text-slate-500" title={idStr}>
                              ID {idStr}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteToken(token.id)}
                            disabled={deletingId !== null}
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-slate-400 transition hover:border-rose-400/40 hover:bg-rose-500/10 hover:text-rose-300 disabled:cursor-not-allowed disabled:opacity-50">
                            {isDeleting ? <Spinner className="size-3.5" /> : (
                              <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                                <path d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" />
                              </svg>
                            )}
                            {isDeleting ? "Menghapus…" : "Hapus"}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </section>
        )}

        <footer className="mt-12 pb-2 text-center text-xs text-slate-600">
          Dibangun dengan Soroban (soroban-sdk) · React · Freighter — Stellar Testnet
        </footer>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-xl border px-4 py-3 text-sm shadow-2xl backdrop-blur ${
            toast.kind === "success"
              ? "border-emerald-400/30 bg-emerald-950/80 text-emerald-200"
              : "border-rose-400/30 bg-rose-950/80 text-rose-200"
          }`}>
          <span>{toast.kind === "success" ? "✅" : "⚠️"}</span>
          <span className="max-w-md">{toast.text}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="ml-1 cursor-pointer text-xs opacity-60 transition-opacity hover:opacity-100">
            ✕
          </button>
        </div>
      )}
    </main>
  );
}
