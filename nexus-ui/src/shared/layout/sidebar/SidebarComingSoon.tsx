import { cn } from "@/lib/cn";

interface SidebarComingSoonProps {
  message: string;
  className?: string;
}

export function SidebarComingSoon({ message, className }: SidebarComingSoonProps) {
  return (
    <p className={cn("text-outline-var/50 text-xs px-2 py-3 mt-2", className)}>{message}</p>
  );
}
