"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { setMenuItemAvailability } from "@/features/admin/actions";
import { Button } from "@/components/ui/button";

export function MenuAvailabilityToggle({
  itemId,
  available,
}: {
  itemId: string;
  available: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  return (
    <Button
      variant={available ? "outline" : "default"}
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await setMenuItemAvailability(itemId, !available);
          if (!res.ok) window.alert(res.message);
          router.refresh();
        })
      }
    >
      {pending ? (
        <Loader2 aria-hidden className="animate-spin" />
      ) : available ? (
        "Mark out of stock"
      ) : (
        "Mark available"
      )}
    </Button>
  );
}
