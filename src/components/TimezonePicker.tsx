import { useState, useMemo } from "react";
import { ChevronsUpDown, Check, Globe } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { CURATED_ZONES, zoneToLabel } from "@/lib/zones";
import { isValidZone } from "@/lib/time";

interface TimezonePickerProps {
  value: string;
  onChange: (zone: string) => void;
  id?: string;
  placeholder?: string;
  /** If true, the field is a free-text input (for the client's timezone). */
  freeText?: boolean;
  className?: string;
}

/**
 * A combobox-style timezone picker. Two modes:
 * - combobox (default): opens a popover with the curated list, supports search
 * - freeText: also allows typing any IANA zone string
 */
export function TimezonePicker({
  value,
  onChange,
  id,
  placeholder = "Pick a timezone…",
  freeText = false,
  className,
}: TimezonePickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const all = useMemo(() => {
    // Curated list, plus the current value if not present
    const set = new Set(CURATED_ZONES);
    if (value) set.add(value);
    return Array.from(set).sort();
  }, [value]);

  const filtered = useMemo(() => {
    if (!search) return all;
    const q = search.toLowerCase();
    return all.filter(
      (z) => z.toLowerCase().includes(q) || zoneToLabel(z).toLowerCase().includes(q)
    );
  }, [all, search]);

  if (freeText) {
    return (
      <div className={cn("space-y-2", className)}>
        <Popover open={open} onOpenChange={setOpen}>
          <div className="relative">
            <Input
              id={id}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onFocus={() => setOpen(true)}
              placeholder={placeholder}
              autoComplete="off"
              className="pr-9"
            />
            <PopoverTrigger asChild>
              <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-ink-3 hover:text-ink-1"
                aria-label="Browse timezones"
                tabIndex={-1}
              >
                <ChevronsUpDown className="h-4 w-4" />
              </button>
            </PopoverTrigger>
          </div>
          <PopoverContent
            className="w-[var(--radix-popover-trigger-width)] p-0"
            align="start"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <Command shouldFilter={false}>
              <CommandInput
                placeholder="Search timezones…"
                value={search}
                onValueChange={setSearch}
              />
              <CommandList>
                <CommandEmpty>
                  {isValidZone(search) ? (
                    <span>Press Enter to use <strong>{search}</strong></span>
                  ) : (
                    "No matches."
                  )}
                </CommandEmpty>
                <CommandGroup>
                  {filtered.map((z) => (
                    <CommandItem
                      key={z}
                      value={z}
                      onSelect={() => {
                        onChange(z);
                        setSearch("");
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === z ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span className="font-mono text-xs">{z}</span>
                      {zoneToLabel(z) !== z && (
                        <span className="ml-2 text-ink-3">· {zoneToLabel(z)}</span>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {value && !isValidZone(value) && (
          <p className="text-xs text-amber">Unknown timezone: "{value}"</p>
        )}
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between font-normal", className)}
        >
          <span className="flex items-center gap-2 truncate">
            <Globe className="h-4 w-4 text-ink-3 shrink-0" />
            {value ? (
              <>
                <span className="truncate">{zoneToLabel(value)}</span>
                <span className="text-ink-3 text-xs font-mono">· {value}</span>
              </>
            ) : (
              <span className="text-ink-3">{placeholder}</span>
            )}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Search timezones…" />
          <CommandList>
            <CommandEmpty>No timezone found.</CommandEmpty>
            <CommandGroup>
              {all.map((z) => (
                <CommandItem
                  key={z}
                  value={z}
                  onSelect={() => {
                    onChange(z);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === z ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="font-mono text-xs">{z}</span>
                  {zoneToLabel(z) !== z && (
                    <span className="ml-2 text-ink-3">· {zoneToLabel(z)}</span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/** Native-styled select for the topbar (compact). */
export function TimezoneSelect({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (z: string) => void;
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "h-9 rounded-md border border-line bg-bg-1 px-2 text-sm text-ink-0 focus:outline-none focus:border-violet",
        className
      )}
    >
      {CURATED_ZONES.map((z) => (
        <option key={z} value={z}>
          {z}
        </option>
      ))}
    </select>
  );
}
