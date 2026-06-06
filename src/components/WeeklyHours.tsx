import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Plus, RotateCcw, X } from "lucide-react";
import { DAY_NAMES, DEFAULT_HOURS, suggestNextSlot, type DayOfWeek, type WeeklyHours } from "@/lib/time";

interface WeeklyHoursProps {
  hours: WeeklyHours;
  onChange: (hours: WeeklyHours) => void;
}

export function WeeklyHours({ hours, onChange }: WeeklyHoursProps) {
  const update = (next: WeeklyHours) => onChange(next);

  const toggleDay = (dow: DayOfWeek, on: boolean) => {
    const next = { ...hours };
    if (on) {
      next[dow] = hours[dow]?.length ? hours[dow] : [{ from: "10:00", to: "13:00" }];
    } else {
      next[dow] = [];
    }
    update(next);
  };

  const addRange = (dow: DayOfWeek) => {
    const next = { ...hours };
    next[dow] = [...(hours[dow] || []), suggestNextSlot(dow, hours)];
    update(next);
  };

  const removeRange = (dow: DayOfWeek, idx: number) => {
    const next = { ...hours };
    next[dow] = hours[dow].filter((_, i) => i !== idx);
    update(next);
  };

  const updateRange = (dow: DayOfWeek, idx: number, field: "from" | "to", value: string) => {
    const next = { ...hours };
    next[dow] = hours[dow].map((r, i) => (i === idx ? { ...r, [field]: value } : r));
    update(next);
  };

  const addFirstEmpty = () => {
    for (let i = 0; i < 7; i++) {
      if (!hours[i as DayOfWeek] || hours[i as DayOfWeek].length === 0) {
        addRange(i as DayOfWeek);
        return;
      }
    }
    addRange(1);
  };

  const reset = () => {
    update(JSON.parse(JSON.stringify(DEFAULT_HOURS)));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>My weekly hours</CardTitle>
        <CardDescription>
          Set the hours you're open for readings. Saved on this device.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          {([0, 1, 2, 3, 4, 5, 6] as DayOfWeek[]).map((dow) => (
            <DayRow
              key={dow}
              dow={dow}
              ranges={hours[dow] || []}
              onToggle={(on) => toggleDay(dow, on)}
              onAdd={() => addRange(dow)}
              onRemove={(idx) => removeRange(dow, idx)}
              onUpdate={(idx, f, v) => updateRange(dow, idx, f, v)}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-2 pt-2">
          <Button variant="ghost" size="sm" onClick={addFirstEmpty}>
            <Plus className="h-4 w-4" /> Add time range
          </Button>
          <Button variant="ghost" size="sm" onClick={reset}>
            <RotateCcw className="h-4 w-4" /> Reset to defaults
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function DayRow({
  dow,
  ranges,
  onToggle,
  onAdd,
  onRemove,
  onUpdate,
}: {
  dow: DayOfWeek;
  ranges: { from: string; to: string }[];
  onToggle: (on: boolean) => void;
  onAdd: () => void;
  onRemove: (idx: number) => void;
  onUpdate: (idx: number, field: "from" | "to", value: string) => void;
}) {
  const isOpen = ranges.length > 0;
  return (
    <div
      className={`grid grid-cols-[110px_1fr_auto_auto] sm:grid-cols-[110px_1fr_auto_auto] gap-3 items-center rounded-md border border-line px-3 py-2 ${
        !isOpen ? "opacity-60" : ""
      }`}
      style={{ background: "rgba(12,8,32,0.4)" }}
    >
      <div className="font-serif text-ink-0">{DAY_NAMES[dow]}</div>
      <div className="space-y-1.5 min-w-0">
        {ranges.length === 0 ? (
          <span className="text-xs text-ink-3 pl-1">Closed</span>
        ) : (
          ranges.map((r, idx) => (
            <div key={idx} className="flex items-center gap-2 font-mono text-sm">
              <Input
                type="time"
                value={r.from}
                onChange={(e) => onUpdate(idx, "from", e.target.value)}
                className="h-8 w-28 text-sm"
              />
              <span className="text-ink-3">→</span>
              <Input
                type="time"
                value={r.to}
                onChange={(e) => onUpdate(idx, "to", e.target.value)}
                className="h-8 w-28 text-sm"
              />
              <button
                type="button"
                onClick={() => onRemove(idx)}
                className="ml-1 inline-flex h-7 w-7 items-center justify-center rounded-full border border-line text-ink-2 hover:text-[hsl(var(--danger))] hover:border-[hsl(var(--danger))] transition-colors"
                title="Remove range"
                aria-label="Remove range"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
      <div className="flex items-center gap-2 text-sm text-ink-2">
        <Switch checked={isOpen} onCheckedChange={onToggle} aria-label={`Toggle ${DAY_NAMES[dow]}`} />
        <span className="w-10">{isOpen ? "Open" : "Off"}</span>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onAdd}
        title={`Add range to ${DAY_NAMES[dow]}`}
        aria-label="Add range"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}
