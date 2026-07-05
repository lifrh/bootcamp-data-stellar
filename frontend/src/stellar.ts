import {
  isConnected,
  getAddress,
  requestAccess,
  signTransaction as freighterSignTransaction,
} from "@stellar/freighter-api";
import type { ClientOptions } from "@stellar/stellar-sdk/contract";
import { Client } from "../bindings/index.ts";

export async function connectFreighter() {
  const check = await isConnected();
  if (!check.isConnected) {
    throw new Error("Freighter is not installed. Install it at https://www.freighter.app");
  }

  const access = await requestAccess();
  if (access.error) {
    throw new Error(access.error.message);
  }

  return access.address;
}

// Silently restore a previously-approved session (no popup).
export async function reconnectFreighter(): Promise<string | null> {
  try {
    const check = await isConnected();
    if (!check.isConnected) return null;

    const res = await getAddress();
    if (res.error || !res.address) return null;

    return res.address;
  } catch {
    return null;
  }
}

export function createContractClient(walletAddress: string) {
  const networkPassphrase = import.meta.env.VITE_STELLAR_NETWORK_PASSPHRASE;
  const rpcUrl = import.meta.env.VITE_STELLAR_RPC_URL;

  return new Client({
    contractId: import.meta.env.VITE_STELLAR_CONTRACT_ID,
    networkPassphrase,
    rpcUrl,
    publicKey: walletAddress,
    signTransaction: async (xdr: string, opts?: Parameters<NonNullable<ClientOptions["signTransaction"]>>[1]) => {
      const result = await freighterSignTransaction(xdr, {
        networkPassphrase,
        address: walletAddress,
        ...opts,
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      return result;
    },
  });
}

export const CONTRACT_ID: string = import.meta.env.VITE_STELLAR_CONTRACT_ID;

export const EXPLORER_CONTRACT_URL = `https://stellar.expert/explorer/testnet/contract/${CONTRACT_ID}`;
