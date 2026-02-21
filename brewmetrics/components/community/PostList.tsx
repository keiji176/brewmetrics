"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { CommunityPost } from "@/lib/community-posts";

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 86400000) return "Today";
  if (diff < 86400000 * 2) return "Yesterday";
  if (diff < 86400000 * 7) return `${Math.floor(diff / 86400000)} days ago`;
  return d.toLocaleDateString();
}

export function PostList({ posts }: { posts: CommunityPost[] }) {
  if (posts.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-sm text-[var(--muted-foreground)]">No posts yet.</p>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            Be the first to start a conversation.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <ul className="space-y-4">
      {posts.map((post) => (
        <li key={post.id}>
          <Card className="overflow-hidden transition-shadow hover:shadow-md">
            <CardHeader className="pb-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-base font-semibold text-[var(--gray-dark)]">
                  {post.title}
                </h3>
                <span className="text-xs text-[var(--muted-foreground)]">
                  {formatDate(post.created_at)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-[var(--primary)]">
                  {post.author_name}
                </span>
                {post.is_anonymous && (
                  <Badge variant="secondary" className="text-xs">
                    Anonymous
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm leading-relaxed text-[var(--muted-foreground)] whitespace-pre-wrap">
                {post.body}
              </p>
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}
