import z from "zod";
import { STORAGE_KEYS } from "../../shared/constants/storage";

import type { AuthResponse } from "@/types";

const authResponseSchema = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string(),
});

export function parseStoredAuthUser(): AuthResponse | null {
  const raw = localStorage.getItem(STORAGE_KEYS.user);

  if (!raw) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    const result = authResponseSchema.safeParse(parsed);

    return result.success ? result.data : null;
  } catch {
    return null;
  }
}
