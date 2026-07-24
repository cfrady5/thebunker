"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { saveMenuItem, deleteMenuItem } from "@/features/admin/actions";
import type { MenuCategory, MenuItem } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { InlineAlert } from "@/components/feedback/inline-alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type Props = {
  categories: MenuCategory[];
  /** Existing item to edit; omit for a new item. */
  item?: MenuItem;
  /** Preselected category when adding. */
  defaultCategoryId?: string;
};

export function MenuItemEditor({ categories, item, defaultCategoryId }: Props) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const isEdit = Boolean(item);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const price = Number(fd.get("price"));
    if (!Number.isFinite(price) || price < 0) {
      setError("Enter a valid price.");
      return;
    }
    const input = {
      id: item?.id,
      category_id: String(fd.get("category_id") ?? ""),
      name: String(fd.get("name") ?? "").trim(),
      description: String(fd.get("description") ?? ""),
      price_cents: Math.round(price * 100),
      dietary_labels: String(fd.get("dietary_labels") ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      allergen_notes: String(fd.get("allergen_notes") ?? ""),
      featured: fd.get("featured") === "on",
      available: fd.get("available") === "on",
    };
    if (!input.name) {
      setError("Enter a name.");
      return;
    }
    startTransition(async () => {
      const res = await saveMenuItem(input);
      if (res.ok) {
        setOpen(false);
        router.refresh();
      } else {
        setError(res.message);
      }
    });
  }

  function onDelete() {
    if (!item) return;
    if (!window.confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
    setError(null);
    startTransition(async () => {
      const res = await deleteMenuItem(item.id);
      if (res.ok) {
        setOpen(false);
        router.refresh();
      } else {
        setError(res.message);
      }
    });
  }

  return (
    <>
      {isEdit ? (
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          <Pencil aria-hidden className="mr-1 h-3.5 w-3.5" />
          Edit
        </Button>
      ) : (
        <Button variant="default" size="sm" onClick={() => setOpen(true)}>
          <Plus aria-hidden className="mr-1 h-4 w-4" />
          Add item
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit item" : "Add menu item"}</DialogTitle>
            <DialogDescription>
              Changes publish to the public menu immediately.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="mi-name">Name</Label>
              <Input
                id="mi-name"
                name="name"
                defaultValue={item?.name ?? ""}
                placeholder="Bunker Burger"
                autoComplete="off"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="mi-category">Category</Label>
                <Select
                  id="mi-category"
                  name="category_id"
                  defaultValue={item?.category_id ?? defaultCategoryId ?? categories[0]?.id ?? ""}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="mi-price">Price ($)</Label>
                <Input
                  id="mi-price"
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={item ? (item.price_cents / 100).toFixed(2) : ""}
                  placeholder="12.00"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="mi-description">Description</Label>
              <Textarea
                id="mi-description"
                name="description"
                defaultValue={item?.description ?? ""}
                placeholder="Half-pound Angus, aged cheddar, house sauce, brioche bun."
                className="min-h-[80px]"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="mi-labels">
                  Dietary labels{" "}
                  <span className="font-normal text-muted-foreground">(comma-separated)</span>
                </Label>
                <Input
                  id="mi-labels"
                  name="dietary_labels"
                  defaultValue={item?.dietary_labels.join(", ") ?? ""}
                  placeholder="vegetarian, gluten-free"
                  autoComplete="off"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="mi-allergens">
                  Allergen notes{" "}
                  <span className="font-normal text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="mi-allergens"
                  name="allergen_notes"
                  defaultValue={item?.allergen_notes ?? ""}
                  placeholder="Contains nuts"
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-6 pt-1">
              <label className="flex items-center gap-2 text-sm text-charcoal">
                <Checkbox name="available" defaultChecked={item?.available ?? true} />
                Available
              </label>
              <label className="flex items-center gap-2 text-sm text-charcoal">
                <Checkbox name="featured" defaultChecked={item?.featured ?? false} />
                Featured
              </label>
            </div>

            {error ? <InlineAlert variant="error">{error}</InlineAlert> : null}

            <div className="flex items-center justify-between gap-2 pt-2">
              {isEdit ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  onClick={onDelete}
                  className="text-danger hover:text-danger"
                >
                  <Trash2 aria-hidden className="mr-1 h-3.5 w-3.5" />
                  Delete
                </Button>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={pending}
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={pending}>
                  {pending ? "Saving…" : isEdit ? "Save changes" : "Add item"}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
