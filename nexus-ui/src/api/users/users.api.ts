import type { UserListResponse, UserSearchResult } from "../models/http-types";

import api from "../client/axios";

export const searchUsers = async (username: string, cursor?: string): Promise<UserSearchResult[]> => {
  const res = await api.get<UserListResponse>("/users", {
    params: { username, ...(cursor ? { cursor } : {}) },
  });
  return res.data.data ?? [];
};

/** Batch resolve; falls back to per-id GET if the batch POST fails (e.g. proxy/body issues). */
export async function resolveUsersByIds(ids: string[]): Promise<UserSearchResult[]> {
  if (ids.length === 0) return [];
  try {
    const res = await api.post<UserSearchResult[]>("/users/resolve", { ids });
    return res.data;
  } catch (postErr) {
    const rows = await Promise.all(
      ids.map(async (id) => {
        try {
          const r = await api.get<UserSearchResult>(`/users/by-id/${id}`);
          return r.data;
        } catch {
          return null;
        }
      }),
    );
    const out = rows.filter((u): u is UserSearchResult => u !== null);
    if (out.length === 0) {
      throw postErr;
    }
    return out;
  }
}
