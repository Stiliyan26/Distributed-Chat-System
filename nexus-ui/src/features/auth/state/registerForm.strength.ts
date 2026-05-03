import type { Strength } from "./registerForm.types";

type StrengthMap = Record<number, { label: Strength; color: string; width: string }>;

const strengthMap: StrengthMap = {
  0: { label: "WEAK", color: "bg-red-500", width: "w-1/4" },
  1: { label: "WEAK", color: "bg-red-500", width: "w-1/4" },
  2: { label: "FAIR", color: "bg-amber-500", width: "w-2/4" },
  3: { label: "STRONG", color: "bg-emerald-500", width: "w-3/4" },
  4: { label: "VERY STRONG", color: "bg-indigo-500", width: "w-full" },
};

export function getStrength(password: string) {
  const checks = {
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    numSymbol: /[\d!@#$%^&*]/.test(password),
    length: password.length >= 8,
  };

  const count = Object.values(checks).filter(Boolean).length;

  return {
    ...strengthMap[count],
    checks,
  };
}
