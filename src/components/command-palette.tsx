import { useEffect, useState } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { projects, tasks, profiles } from "@/lib/mock-data";

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search tasks, projects and people…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Tasks">
          {tasks.slice(0, 5).map((t) => (
            <CommandItem key={t.id}>{t.title}</CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Projects">
          {projects.map((p) => (
            <CommandItem key={p.id}>{p.name}</CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="People">
          {profiles.map((p) => (
            <CommandItem key={p.id}>{p.full_name}</CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

export function useCommandPalette() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);
  return { open, setOpen };
}
