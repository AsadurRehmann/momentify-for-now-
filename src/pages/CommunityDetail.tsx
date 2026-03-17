import { useParams } from "react-router-dom";
import { Users } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useRequireAuth } from "@/components/AuthModal";
import { AppLayout } from "@/components/AppLayout";
import { PostCard } from "@/components/PostCard";
import { EmptyState } from "@/components/EmptyState";
import { formatCount } from "@/lib/utils";

const CommunityDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { requireAuth, modal } = useRequireAuth();
  const queryClient = useQueryClient();

  const { data: community } = useQuery({
    queryKey: ["community", id],
    queryFn: async () => {
      const { data } = await supabase.from("communities").select("*").eq("id", id!).single();
      return data;
    },
    enabled: !!id,
  });

  const { data: memberCount = 0 } = useQuery({
    queryKey: ["community-members-count", id],
    queryFn: async () => {
      const { count } = await supabase
        .from("community_members")
        .select("*", { count: "exact", head: true })
        .eq("community_id", id!);
      return count || 0;
    },
    enabled: !!id,
  });

  const { data: isMember = false } = useQuery({
    queryKey: ["is-community-member", id, user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase
        .from("community_members")
        .select("id")
        .eq("community_id", id!)
        .eq("user_id", user.id)
        .maybeSingle();
      return !!data;
    },
    enabled: !!id && !!user,
  });

  const { data: posts = [] } = useQuery({
    queryKey: ["community-posts", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("posts")
        .select("*, profiles(*)")
        .eq("genre_id", id!)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!id,
  });

  const joinMutation = useMutation({
    mutationFn: async () => {
      if (!user) return;
      if (isMember) {
        await supabase.from("community_members").delete().eq("community_id", id!).eq("user_id", user.id);
      } else {
        await supabase.from("community_members").insert({ user_id: user.id, community_id: id! });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["is-community-member", id] });
      queryClient.invalidateQueries({ queryKey: ["community-members-count", id] });
    },
  });

  if (!community) {
    return <AppLayout><p className="text-muted-foreground">Community not found.</p></AppLayout>;
  }

  return (
    <AppLayout>
      {modal}
      <div className="space-y-6">
        <div className="glass-card rounded-xl p-6 text-center space-y-2">
          <span className="text-5xl">{community.emoji}</span>
          <h2 className="text-2xl font-display font-bold text-foreground">{community.name}</h2>
          <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            {formatCount(memberCount)} members
          </div>
          <button
            onClick={() => requireAuth(() => joinMutation.mutate())}
            className={`mt-2 rounded-full px-6 py-2 text-sm font-bold transition-all ${
              isMember
                ? "bg-secondary text-foreground hover:bg-secondary/80"
                : "bg-primary text-primary-foreground hover:glow-amber"
            }`}
          >
            {isMember ? "Leave Community" : "Join Community"}
          </button>
        </div>

        <div className="space-y-5">
          {posts.length > 0 ? (
            posts.map((post, i) => <PostCard key={post.id} post={post as any} index={i} />)
          ) : (
            <EmptyState title="No moments yet" description="Be the first to share in this community!" />
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default CommunityDetailPage;
