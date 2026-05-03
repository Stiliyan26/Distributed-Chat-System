import { Eye, EyeOff } from "lucide-react";

interface RevealablePasswordFieldProps {
  id: string;
  label: string;
  placeholder?: string;
  value: string;
  showPassword: boolean;
  onValueChange: (value: string) => void;
  onToggleVisibility: () => void;
  autoComplete?: string;
  invalid?: boolean;
  describedById?: string;
}

export function RevealablePasswordField({
  id,
  label,
  placeholder,
  value,
  showPassword,
  onValueChange,
  onToggleVisibility,
  autoComplete = "current-password",
  invalid = false,
  describedById,
}: RevealablePasswordFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="label-sm mb-2 block">
        {label}
      </label>

      <div className="relative">
        <input
          id={id}
          type={showPassword ? "text" : "password"}
          className="input-field pr-10"
          placeholder={placeholder}
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          required
          autoComplete={autoComplete}
          aria-invalid={invalid || undefined}
          aria-describedby={describedById ?? undefined}
        />
        <button
          type="button"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-outline-var transition-colors hover:text-white"
          onClick={onToggleVisibility}
          aria-label={showPassword ? "Hide password" : "Show password"}
          aria-pressed={showPassword}
        >
          {showPassword ? <EyeOff size={15} aria-hidden /> : <Eye size={15} aria-hidden />}
        </button>
      </div>
    </div>
  );
}
