"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { createWalkIn } from "@/features/admin/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { InlineAlert } from "@/components/feedback/inline-alert";

export function WalkInDialog({
  bays,
  date,
}: {
  bays: Array<{ id: string; name: string }>;
  date: string;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  const [bayId, setBayId] = React.useState(bays[0]?.id ?? "");
  const [time, setTime] = React.useState("12:00");
  const [duration, setDuration] = React.useState(60);
  const [players, setPlayers] = React.useState(2);
  const [name, setName] = React.useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const startsAt = new Date(`${date}T${time}:00`);
    startTransition(async () => {
      const res = await createWalkIn({
        bay_id: bayId,
        starts_at: startsAt.toISOString(),
        duration_minutes: duration,
        player_count: players,
        name,
      });
      if (res.ok) {
        setOpen(false);
        setName("");
        router.refresh();
      } else {
        setError(res.message);
      }
    });
  }

  if (bays.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus aria-hidden /> Walk-in
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a walk-in reservation</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="wi-name">Customer name</Label>
            <Input
              id="wi-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="wi-bay">Bay</Label>
              <Select id="wi-bay" value={bayId} onChange={(e) => setBayId(e.target.value)}>
                {bays.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wi-time">Start time</Label>
              <Input
                id="wi-time"
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wi-duration">Duration</Label>
              <Select
                id="wi-duration"
                value={String(duration)}
                onChange={(e) => setDuration(Number(e.target.value))}
              >
                <option value="30">30 minutes</option>
                <option value="60">1 hour</option>
                <option value="90">90 minutes</option>
                <option value="120">2 hours</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wi-players">Players</Label>
              <Select
                id="wi-players"
                value={String(players)}
                onChange={(e) => setPlayers(Number(e.target.value))}
              >
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          {error ? <InlineAlert variant="error">{error}</InlineAlert> : null}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? (
              <>
                <Loader2 aria-hidden className="animate-spin" /> Creating…
              </>
            ) : (
              "Create Walk-in"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
