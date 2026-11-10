export function FlagChip({ label, muted = false }: { label: string; muted?: boolean }) {
  return (
    <span
      className={
        muted
          ? "rounded-md border border-border/60 px-1.5 py-0.5 text-[10px] text-muted-foreground"
          : "rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary"
      }
    >
      {label}
    </span>
  )
}
