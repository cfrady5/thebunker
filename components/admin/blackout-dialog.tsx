"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { createBlackout, deleteBlackout } from "@/features/admin/actions";
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

export function BlackoutDialog({
  bays,
}: {
  bays: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  const [bayId, setBayId] = React.useState<string>("all");
  const [date, setDate] = React.useState("");
  const [startTime, setStartTime] = React.useState("09:00");
  const [endTime, setEndTime] = React.useState("12:00");
  const [reason, setReason] = React.useState("");
  const [type, setType] = React.useState("maintenance");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!date) {
      setError("Pick a date.");
      return;
    }
    startTransition(async () => {
      const res = await createBlackout({
        bay_id: bayId === "all" ? null : bayId,
        starts_at: new Date(`${date}T${startTime}:00`).toISOString(),
        ends_at: new Date(`${date}T${endTime}:00`).toISOString(),
        reason,
        blackout_type: type as
          | "maintenance"
          | "private_event"
          | "league"
          | "staff_hold"
          | "other",
      });
      if (res.ok) {
        setOpen(false);
        router.refresh();
      } else {
        setError(res.message);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus aria-hidden /> Block Time
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Block bay time</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="bo-bay">Bay</Label>
              <Select id="bo-bay" value={bayId} onChange={(e) => setBayId(e.target.value)}>
                <option value="all">All bays</option>
                {bays.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bo-type">Type</Label>
              <Select id="bo-type" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="maintenance">Maintenance</option>
                <option value="private_event">Private event</option>
                <option value="league">League</option>
                <option value="staff_hold">Staff hold</option>
                <option value="other">Other</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bo-date">Date</Label>
              <Input
                id="bo-date"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="bo-start">From</Label>
                <Input
                  id="bo-start"
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bo-end">To</Label>
                <Input
                  id="bo-end"
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bo-reason">Reason</Label>
            <Input
              id="bo-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Projector service"
            />
          </div>
          {error ? <InlineAlert variant="error">{error}</InlineAlert> : null}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? (
              <>
                <Loader2 aria-hidden className="animate-spin" /> Blocking…
              </>
            ) : (
              "Block Time"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteBlackoutButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Delete blackout"
      disabled={pending}
      onClick={() => {
        if (window.confirm("Remove this blackout?")) {
          startTransition(async () => {
            await deleteBlackout(id);
            router.refresh();
          });
        }
      }}
    >
      {pending ? (
        <Loader2 aria-hidden className="animate-spin" />
      ) : (
        <Trash2 aria-hidden className="text-danger" />
      )}
    </Button>
  );
}
