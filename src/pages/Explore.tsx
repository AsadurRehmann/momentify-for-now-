import { useState } from "react";
import { motion } from "framer-motion";
import { Search, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { PostCard } from "@/components/PostCard";
import { EmptyState } from "@/components/EmptyState";

const ExplorePage = () => {
  const [query, setQuery] = useState("");

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["explore", query],
    queryFn: async () => {
      let q = supabase
        .from("posts")
        .select("*, profiles(*)")
        .order("created_at", { ascending: false })
        .limit(20);

      if (query) {
        q = q.or(`title.ilike.%${query}%,caption.ilike.%${query}%`);
      }

      const { data } = await q;
      return data || [];
    },
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">Explore</h2>
          <p className="text-sm text-muted-foreground mt-1">Discover trending moments</p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search songs, artists, users..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-xl border border-border bg-secondary py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-primary">
            {query ? "Search results" : "Latest moments"}
          </span>
        </div>

        <div className="space-y-5">
          {isLoading ? (
            <p className="text-muted-foreground text-center py-12">Loading...</p>
          ) : posts.length > 0 ? (
            posts.map((post, i) => (
              <PostCard key={post.id} post={post as any} index={i} />
            ))
          ) : (
            <EmptyState title="No moments found" description="Try a different search." />
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default ExplorePage;
