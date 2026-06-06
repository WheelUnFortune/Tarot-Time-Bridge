import { useEffect, useMemo, useState } from "react";
import { ArrowLeftRight, Clock, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TimezonePicker } from "@/components/TimezonePicker";
import {
  dateStringInZone,
  fmtInZone,
  isValidZone,
  isWithinMyHours,
  tzAbbrev,
  tzOffsetLabel,
  zonedTimeToUtc,
} from "@/lib/time";
import type { WeeklyHours } from "@/lib/time";

interface QuickConvertProps {
  myTz: string;
  hours: WeeklyHours;
}

export function QuickConvert({ myTz, hours }: QuickConvertProps) {
  const [clientTz, setClientTz] = useState<string>("America/Chicago");
  const [date, setDate] = useState<string>("");
  const [time, setTime] = useState<string>("");

  // Initialize defaults: today + current time in myTz
  useEffect(() => {
    const now = new Date();
    setDate(dateStringInZone(now, myTz));
    const hh = new Intl.DateTimeFormat("en-US", {
      timeZone: myTz,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(now);
    setTime(hh);
  }, [myTz]);

  const valid = isValidZone(clientTz) && date && time;
  const utc = useMemo(() => {
    if (!valid) return null;
    try {
      return zonedTimeToUtc(date, time, clientTz);
    } catch {
      return null;
    }
  }, [valid, date, time, clientTz]);

  const inHours = useMemo(() => {
    if (!utc) return null;
    return isWithinMyHours(utc, myTz, hours);
  }, [utc, myTz, hours]);

  const swap = () => {
    if (!valid || !utc) return;
    // The input was "client's tz". Swap means: take this same moment and
    // pretend it was MY time at that wall-clock. Now "client's tz" becomes
    // my tz, and the original client tz becomes the new target — but
    // semantically the panel now shows "what my clock time looks like in
    // their zone". So we flip:
    //   - input tz ← myTz
    //   - date/time ← myTz wall clock of the same UTC moment
    //   - state.myTz ← original clientTz (so the "you" display is theirs)
    const myDate = dateStringInZone(utc, myTz);
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: myTz,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const myTime = fmt.format(utc);
    setClientTz(myTz);
    setDate(myDate);
    setTime(myTime);
  };

  const setNow = () => {
    if (!isValidZone(clientTz)) return;
    const n = new Date();
    setDate(dateStringInZone(n, clientTz));
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: clientTz,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    setTime(fmt.format(n));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick convert</CardTitle>
        <CardDescription>Client gives you a time. See it in yours.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-4">
            <div>
              <Label htmlFor="client-tz">Client's timezone</Label>
              <TimezonePicker
                id="client-tz"
                value={clientTz}
                onChange={setClientTz}
                freeText
                placeholder="Type a city or timezone…"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="client-date">Date</Label>
                <Input
                  id="client-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="client-time">Time (their clock)</Label>
                <Input
                  id="client-time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" size="sm" onClick={setNow}>
                <Clock className="h-4 w-4" /> Their time right now
              </Button>
              <Button variant="ghost" size="sm" onClick={swap} disabled={!valid}>
                <ArrowLeftRight className="h-4 w-4" /> Swap
              </Button>
            </div>
          </div>

          <ResultPanel
            utc={utc}
            myTz={myTz}
            clientTz={clientTz}
            inHours={inHours}
            valid={!!valid}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function ResultPanel({
  utc,
  myTz,
  clientTz,
  inHours,
  valid,
}: {
  utc: Date | null;
  myTz: string;
  clientTz: string;
  inHours: { in: boolean; dow: number } | null;
  valid: boolean;
}) {
  return (
    <div
      className="rounded-xl border border-line p-5 flex flex-col justify-center min-h-[180px]"
      style={{
        background:
          "radial-gradient(400px 200px at 20% 0%, rgba(212,175,55,0.10), transparent 70%), rgba(12,8,32,0.5)",
      }}
    >
      <div className="text-xs uppercase tracking-widest text-ink-2 mb-2">
        In your time
      </div>
      {!valid ? (
        <>
          <div className="text-3xl text-ink-3 font-serif">—</div>
          <div className="text-sm text-ink-2 mt-1">
            {!isValidZone(clientTz)
              ? `Unknown timezone: "${clientTz}". Try "Europe/Madrid" or "America/Chicago".`
              : "Pick a date and time to convert."}
          </div>
        </>
      ) : !utc ? (
        <div className="text-3xl text-ink-3 font-serif">—</div>
      ) : (
        <>
          <div className="text-3xl text-gold-soft font-serif leading-tight">
            {fmtInZone(utc, myTz)}
          </div>
          <div className="text-sm text-ink-2 mt-2 font-mono">
            {clientTz} ({tzAbbrev(clientTz, utc)}, {tzOffsetLabel(clientTz, utc)}) →{" "}
            {myTz} ({tzAbbrev(myTz, utc)}, {tzOffsetLabel(myTz, utc)})
          </div>
          <div className="text-xs text-ink-3 mt-1">
            same moment, different clocks
          </div>
          {inHours && !inHours.in && (
            <div className="mt-3 inline-flex items-center gap-1.5 text-amber text-sm">
              <AlertTriangle className="h-4 w-4" />
              outside your working hours
            </div>
          )}
        </>
      )}
    </div>
  );
}
