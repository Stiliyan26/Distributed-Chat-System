import type { Strength } from "../state/registerForm.types";

type PasswordStrengthProps = {
  strength: {
    label: Strength;
    color: string;
    width: string;
    checks: Record<string, boolean>;
  };
};

const passwordChecks = [
  { key: "uppercase", label: "Uppercase" },
  { key: "lowercase", label: "Lowercase" },
  { key: "numSymbol", label: "Num/Symbol" },
  { key: "length", label: "8+ Chars" },
] as const;

function strengthLabelClass(label: Strength) {
  if (label === "WEAK") {
    return "text-red-400";
  }

  if (label === "FAIR") {
    return "text-amber-400";
  }

  return "text-emerald-400";
}

export function PasswordStrength({ strength }: PasswordStrengthProps) {
  return (
    <div className="bg-surface rounded-md p-3 space-y-2 border border-outline-var/20">
      <div className="flex items-center justify-between">
        <span className="label-sm">Entropy Strength</span>
        <span
          className={`text-[11px] font-semibold ${strengthLabelClass(strength.label)}`}
        >
          {strength.label}
        </span>
      </div>

      <div className="h-0.5 bg-surface-high rounded-full overflow-hidden">
        <div
          className={`h-full ${strength.color} ${strength.width} transition-all duration-300`}
        />
      </div>

      <div className="grid grid-cols-2 gap-1.5 mt-1">
        {passwordChecks.map(({ key, label }) => (
          <div key={key} className="flex items-center gap-1.5 text-xs">
            <div
              className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center flex-shrink-0 ${
                strength.checks[key]
                  ? "border-indigo-500 bg-indigo-500/20 text-indigo-400"
                  : "border-outline-var/40 text-transparent"
              }`}
            >
              {strength.checks[key] && (
                <span className="text-[8px] font-bold">✓</span>
              )}
            </div>
            <span
              className={
                strength.checks[key] ? "text-white/70" : "text-outline-var/60"
              }
            >
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
