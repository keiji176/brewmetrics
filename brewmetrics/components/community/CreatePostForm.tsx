"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, UserX } from "lucide-react";

interface CreatePostFormProps {
  onCreated?: () => void;
}

export function CreatePostForm({ onCreated }: CreatePostFormProps) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [anonymous, setAnonymous] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    // In a real app, submit to Supabase here. For now we just reset and callback.
    setTitle("");
    setBody("");
    setAnonymous(false);
    onCreated?.();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[var(--gray-dark)]">
          <MessageSquare className="h-5 w-5 text-[var(--primary)]" />
          New post
        </CardTitle>
        <CardDescription>
          Share questions or tips. You can post anonymously so your store name isn’t shown.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="post-title" className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
              Title
            </label>
            <Input
              id="post-title"
              placeholder="e.g. Best way to store beans in humid weather?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="post-body" className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
              Message
            </label>
            <Textarea
              id="post-body"
              placeholder="Write your question or tip…"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="min-h-[100px] resize-y"
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--cream-muted)]/50 px-4 py-3">
            <div className="flex items-center gap-2">
              <UserX className="h-4 w-4 text-[var(--muted-foreground)]" />
              <span className="text-sm font-medium text-[var(--foreground)]">
                Post anonymously
              </span>
            </div>
            <Switch
              checked={anonymous}
              onCheckedChange={setAnonymous}
              aria-label="Post anonymously"
            />
          </div>
          <p className="text-xs text-[var(--muted-foreground)]">
            {anonymous
              ? "Your post will show as “Anonymous Roaster” instead of your store name."
              : "Your store name will be visible on this post."}
          </p>
          <Button type="submit" disabled={!title.trim()} className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Create post
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
