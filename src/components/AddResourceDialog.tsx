"use client";

import { useState } from "react";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { categories, type Category, type Resource } from "@/lib/resources";

const TOKEN_KEY = "resource-library:admin-token";

async function postResource(
  url: string,
  category: Category,
  token: string,
): Promise<
  | { ok: true; resource: Resource }
  | { ok: false; status: number; error: string }
> {
  const res = await fetch("/api/resources", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ url, category }),
  });
  if (res.ok) {
    const data = (await res.json()) as { resource: Resource };
    return { ok: true, resource: data.resource };
  }
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  return { ok: false, status: res.status, error: data.error ?? "Error" };
}

export function AddResourceDialog({
  onAdd,
}: {
  onAdd: (resource: Resource) => void;
}) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(token: string) {
    const result = await postResource(url, category as Category, token);
    if (result.ok) {
      localStorage.setItem(TOKEN_KEY, token);
      onAdd(result.resource);
      setUrl("");
      setCategory("");
      setError(null);
      setOpen(false);
      return true;
    }
    if (result.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      return false;
    }
    setError(result.error);
    return true;
  }


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <PlusIcon />
            Add
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add resource</DialogTitle>
          <DialogDescription>
            Add a link to your library. Pick a category so it shows up in the
            right tab.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!url || !category) return;
            setSubmitting(true);
            setError(null);
            try {
              let token = localStorage.getItem(TOKEN_KEY) ?? "";
              if (!token) {
                token = window.prompt("Enter admin password") ?? "";
                if (!token) return;
              }
              const done = await submit(token);
              if (!done) {
                const retry =
                  window.prompt("Incorrect password. Try again:") ?? "";
                if (retry) await submit(retry);
                else setError("Not authorized.");
              }
            } finally {
              setSubmitting(false);
            }
          }}
          className="flex flex-col gap-4"
        >
          <div className="grid gap-2">
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              name="url"
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={category}
              onValueChange={(value) => setCategory(value ?? "")}
            >
              <SelectTrigger id="category" className="w-full">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                {categories.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <Button
              type="submit"
              disabled={!url || !category || submitting}
            >
              {submitting ? "Adding…" : "Add resource"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
