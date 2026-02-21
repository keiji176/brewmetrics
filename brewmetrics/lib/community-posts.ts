// Client-side type; matches Supabase posts table
export interface CommunityPost {
  id: string;
  title: string;
  body: string;
  author_name: string; // display name: store name or "Anonymous Roaster"
  is_anonymous: boolean;
  created_at: string;
}

// Example data for UI before Supabase is connected
export const examplePosts: CommunityPost[] = [
  {
    id: "1",
    title: "Best way to store beans in humid weather?",
    body: "We're in a very humid region and noticed our beans lose clarity after a few days. Anyone have tips for storage or packaging that helped?",
    author_name: "Anonymous Roaster",
    is_anonymous: true,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "2",
    title: "Roast curve for natural Ethiopians",
    body: "We've been experimenting with longer development time after first crack for natural Ethiopians. Results are more body and less sharp acidity. Happy to share our profile if anyone is interested.",
    author_name: "Harbor Coffee Co.",
    is_anonymous: false,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: "3",
    title: "Cupping score consistency across batches",
    body: "How do you keep cupping scores consistent when the same origin comes in different lots? We track moisture and screen size but still see variation.",
    author_name: "Anonymous Roaster",
    is_anonymous: true,
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
  },
];
