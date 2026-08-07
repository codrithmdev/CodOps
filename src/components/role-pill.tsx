import { cn } from "@/lib/utils";
import { ROLE_LABEL, type AppRole } from "@/lib/types";

export function RolePill({ role, className }: { role: AppRole; className?: string }) {
  return (
    <span
      className={cn(
        "mint-badge inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-[0.12em] whitespace-nowrap",
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-mint" />
      {ROLE_LABEL[role]}
    </span>
  );
}
