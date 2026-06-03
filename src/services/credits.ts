import { api } from "./api";
import type { CreditLedgerEntry, Wallet } from "@/types/doculoc";

export async function getWallet(userId: string) {
  const response = await api.get<{ wallet: Wallet }>(`/credits/users/${userId}/wallet`);

  return response.data.wallet;
}

export async function setUserCredits(userId: string, credits: number, reason: string) {
  const response = await api.patch<{ wallet: Wallet }>(`/credits/users/${userId}/credits`, {
    credits,
    reason,
  });

  return response.data.wallet;
}

export async function setUserVip(userId: string, isVip: boolean, reason: string) {
  const response = await api.patch<{ wallet: Wallet }>(`/credits/users/${userId}/vip`, {
    isVip,
    reason,
  });

  return response.data.wallet;
}

export async function getCreditLedger(userId: string) {
  const response = await api.get<{ ledger: CreditLedgerEntry[] }>(
    `/credits/users/${userId}/ledger`,
  );

  return response.data.ledger;
}
