import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TimezonePicker } from "@/components/TimezonePicker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import {
  dateStringInZone,
  fmtDateInZone,
  fmtInZone,
  isValidZone,
  type Booking,
  type BookingType,
  uid,
  zonedTimeToUtc,
} from "@/lib/time";

interface BookingsProps {
  myTz: string;
  bookings: Booking[];
  onChange: (bookings: Booking[]) => void;
}

export function Bookings({ myTz, bookings, onChange }: BookingsProps) {
  const [name, setName] = useState("");
  const [tz, setTz] = useState("America/Chicago");
  const [type, setType] = useState<BookingType>("remote");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [error, setError] = useState<string | null>(null);

  const defaultDate = useMemo(() => dateStringInZone(new Date(), myTz), [myTz]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name required.");
      return;
    }
    if (!isValidZone(tz)) {
      setError(`Unknown timezone: "${tz}"`);
      return;
    }
    if (!date || !time) {
      setError("Date and time required.");
      return;
    }
    const next: Booking = {
      id: uid(),
      name: name.trim(),
      tz,
      type,
      date,
      time,
      createdAt: new Date().toISOString(),
    };
    const sorted = [...bookings, next].sort((a, b) =>
      (a.date + a.time).localeCompare(b.date + b.time)
    );
    onChange(sorted);
    setName("");
    setError(null);
  };

  const remove = (id: string) => {
    onChange(bookings.filter((b) => b.id !== id));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Booked sessions</CardTitle>
        <CardDescription>
          Track who's on the calendar. Saved on this device.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form
          onSubmit={submit}
          className="grid grid-cols-1 md:grid-cols-3 gap-3"
          noValidate
        >
          <div className="md:col-span-1">
            <Label htmlFor="b-name">Client name</Label>
            <Input
              id="b-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Jordan in Texas"
              required
            />
          </div>
          <div>
            <Label htmlFor="b-tz">Client timezone</Label>
            <TimezonePicker
              id="b-tz"
              value={tz}
              onChange={setTz}
              freeText
              placeholder="America/Chicago"
            />
          </div>
          <div>
            <Label htmlFor="b-type">Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as BookingType)}>
              <SelectTrigger id="b-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inperson">In person</SelectItem>
                <SelectItem value="remote">Remote</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="b-date">Date</Label>
            <Input
              id="b-date"
              type="date"
              value={date || defaultDate}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="b-time">Time (your clock)</Label>
            <Input
              id="b-time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
            />
          </div>
          <div className="flex items-end">
            <Button type="submit" className="w-full">
              Add booking
            </Button>
          </div>
        </form>
        {error && <p className="text-sm text-[hsl(var(--danger))]">{error}</p>}

        <ul className="space-y-2">
          {bookings.length === 0 ? (
            <li
              className="rounded-md border border-dashed border-line text-center text-ink-3 py-4"
              style={{ background: "transparent" }}
            >
              No sessions yet. Add one above ✨
            </li>
          ) : (
            bookings.map((b) => (
              <BookingRow key={b.id} booking={b} myTz={myTz} onRemove={remove} />
            ))
          )}
        </ul>
      </CardContent>
    </Card>
  );
}

function BookingRow({
  booking,
  myTz,
  onRemove,
}: {
  booking: Booking;
  myTz: string;
  onRemove: (id: string) => void;
}) {
  let theirFmt = "—";
  let yourFmt = "—";
  try {
    const utc = zonedTimeToUtc(booking.date, booking.time, myTz);
    theirFmt = `${fmtDateInZone(utc, booking.tz)} · ${fmtInZone(utc, booking.tz)}`;
    yourFmt = `${booking.date} ${booking.time}`;
  } catch {
    // ignore
  }

  const isIn = booking.type === "inperson";

  return (
    <li
      className="grid grid-cols-[1fr_auto] gap-3 items-center rounded-md border border-line px-4 py-3"
      style={{ background: "rgba(12,8,32,0.45)" }}
    >
      <div className="min-w-0">
        <div className="font-serif text-ink-0 text-base">
          {booking.name}
          <span
            className="ml-2 inline-block text-[0.65rem] tracking-widest uppercase px-2 py-0.5 rounded-full align-middle"
            style={
              isIn
                ? {
                    background: "rgba(164,140,242,0.18)",
                    color: "hsl(var(--violet))",
                  }
                : {
                    background: "rgba(110,231,168,0.18)",
                    color: "hsl(var(--green))",
                  }
            }
          >
            {booking.type}
          </span>
        </div>
        <div className="text-xs text-ink-2 font-mono mt-0.5">
          You: {yourFmt} ({myTz}) · Them: {theirFmt} ({booking.tz})
        </div>
      </div>
      <Button
        variant="destructive"
        size="sm"
        onClick={() => onRemove(booking.id)}
        aria-label="Remove booking"
      >
        <Trash2 className="h-4 w-4" /> Remove
      </Button>
    </li>
  );
}
