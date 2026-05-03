import { Search } from "lucide-react";

interface MemberSearchTextFieldProps {
  inputId: string;
  value: string;
  onValueChange: (query: string) => void;
  isBusy?: boolean;
  autoFocus?: boolean;
  /** Shown in the input; defaults to create-channel copy. */
  placeholder?: string;
  /** Icon wrapper classes; defaults to outline-style used on create-channel modal. */
  iconClassName?: string;
}

export function MemberSearchTextField({
  inputId,
  value,
  onValueChange,
  isBusy = false,
  autoFocus = false,
  placeholder = "Search by name or node-ID...",
  iconClassName = "absolute left-3 top-1/2 -translate-y-1/2 text-outline-var",
}: MemberSearchTextFieldProps) {
  return (
    <div className="relative">
      <Search
        size={14}
        className={iconClassName}
        aria-hidden
      />

      <input
        id={inputId}
        type="text"
        className="input-field pl-8"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        autoComplete="off"
        autoFocus={autoFocus || undefined}
        aria-busy={isBusy}
      />
    </div>
  );
}
