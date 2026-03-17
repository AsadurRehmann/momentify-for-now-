import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { AppLayout } from "@/components/AppLayout";
import { PostCard } from "@/components/PostCard";
import { EmptyState } from "@/components/EmptyState";

const HomePage = () => {
  const { user } = useAuth();

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["feed", user?.id],
    queryFn: async () => {
      if (!user) {
        // Guest: show latest posts
        const { data } = await supabase
          .from("posts")
          .select("*, profiles(*)")
          .order("created_at", { ascending: false })
          .limit(20);
        return data || [];
      }

      // Get followed user IDs
      const { data: follows } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id);
      const followedIds = (follows || []).map((f) => f.following_id);

      // Get joined community IDs
      const { data: memberships } = await supabase
        .from("community_members")
        .select("community_id")
        .eq("user_id", user.id);
      const communityIds = (memberships || []).map((m) => m.community_id);

      if (followedIds.length === 0 && communityIds.length === 0) {
        // Show latest posts if no follows/communities
        const { data } = await supabase
          .from("posts")
          .select("*, profiles(*)")
          .order("created_at", { ascending: false })
          .limit(20);
        return data || [];
      }

      // Posts from followed users OR joined communities
      const { data } = await supabase
        .from("posts")
        .select("*, profiles(*)")
        .or(
          `user_id.in.(${followedIds.join(",")}),genre_id.in.(${communityIds.join(",")})`
        )
        .order("created_at", { ascending: false })
        .limit(20);
      return data || [];
    },
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">Your Feed</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {user ? "Moments from people you follow" : "Discover musical moments"}
          </p>
        </div>

        <div className="space-y-5">
          {isLoading ? (
            <p className="text-muted-foreground text-center py-12">Loading...</p>
          ) : posts.length > 0 ? (
            posts.map((post, i) => (
              <PostCard key={post.id} post={post as any} index={i} />
            ))
          ) : (
            <EmptyState />
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default HomePage;
