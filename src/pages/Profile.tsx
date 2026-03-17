import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useRequireAuth } from "@/components/AuthModal";
import { AppLayout } from "@/components/AppLayout";
import { PostCard } from "@/components/PostCard";
import { GenreBadge } from "@/components/GenreBadge";
import { EmptyState } from "@/components/EmptyState";
import { formatCount } from "@/lib/utils";

const ProfilePage = () => {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const { requireAuth, modal } = useRequireAuth();
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ["profile", username],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username!)
        .single();
      return data;
    },
    enabled: !!username,
  });

  const { data: userPosts = [] } = useQuery({
    queryKey: ["user-posts", profile?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("posts")
        .select("*, profiles(*)")
        .eq("user_id", profile!.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!profile,
  });

  const { data: followerCount = 0 } = useQuery({
    queryKey: ["follower-count", profile?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", profile!.id);
      return count || 0;
    },
    enabled: !!profile,
  });

  const { data: followingCount = 0 } = useQuery({
    queryKey: ["following-count", profile?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", profile!.id);
      return count || 0;
    },
    enabled: !!profile,
  });

  const { data: isFollowing = false } = useQuery({
    queryKey: ["is-following", profile?.id, user?.id],
    queryFn: async () => {
      if (!user || !profile) return false;
      const { data } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", user.id)
        .eq("following_id", profile.id)
        .maybeSingle();
      return !!data;
    },
    enabled: !!profile && !!user,
  });

  const { data: communities = [] } = useQuery({
    queryKey: ["user-communities", profile?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("community_members")
        .select("community_id")
        .eq("user_id", profile!.id);
      return (data || []).map((d) => d.community_id);
    },
    enabled: !!profile,
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      if (!user || !profile) return;
      if (isFollowing) {
        await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", profile.id);
      } else {
        await supabase.from("follows").insert({ follower_id: user.id, following_id: profile.id });
        // Notify
        await supabase.from("notifications").insert({
          user_id: profile.id,
          from_user_id: user.id,
          type: "follow",
          read: false,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["is-following", profile?.id] });
      queryClient.invalidateQueries({ queryKey: ["follower-count", profile?.id] });
    },
  });

  const isOwnProfile = user?.id === profile?.id;

  if (!profile) {
    return <AppLayout><p className="text-muted-foreground">User not found.</p></AppLayout>;
  }

  return (
    <AppLayout>
      {modal}
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-xl p-6 text-center space-y-3"
        >
          <img
            src={profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`}
            alt={profile.display_name}
            className="mx-auto h-20 w-20 rounded-full bg-secondary"
          />
          <div>
            <h2 className="text-xl font-display font-bold text-foreground">{profile.display_name}</h2>
            <p className="text-sm text-muted-foreground">@{profile.username}</p>
          </div>
          {profile.bio && (
            <p className="text-sm text-secondary-foreground max-w-xs mx-auto">{profile.bio}</p>
          )}

          <div className="flex items-center justify-center gap-6 pt-2">
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">{formatCount(followerCount)}</p>
              <p className="text-xs text-muted-foreground">Followers</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">{formatCount(followingCount)}</p>
              <p className="text-xs text-muted-foreground">Following</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">{userPosts.length}</p>
              <p className="text-xs text-muted-foreground">Moments</p>
            </div>
          </div>

          {communities.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              {communities.map((cId) => (
                <GenreBadge key={cId} genreId={cId} />
              ))}
            </div>
          )}

          {!isOwnProfile && (
            <button
              onClick={() => requireAuth(() => followMutation.mutate())}
              className={`rounded-full px-6 py-2 text-sm font-bold transition-all ${
                isFollowing
                  ? "bg-secondary text-foreground hover:bg-secondary/80"
                  : "bg-primary text-primary-foreground hover:glow-amber"
              }`}
            >
              {isFollowing ? "Unfollow" : "Follow"}
            </button>
          )}
        </motion.div>

        <div>
          <h3 className="text-lg font-display font-bold text-foreground mb-4">Moments</h3>
          <div className="space-y-5">
            {userPosts.length > 0 ? (
              userPosts.map((post, i) => <PostCard key={post.id} post={post as any} index={i} />)
            ) : (
              <EmptyState title="No moments yet" description="This user hasn't shared any moments." />
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default ProfilePage;
