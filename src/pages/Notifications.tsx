import { useEffect } from "react";
import { motion } from "framer-motion";
import { Heart, UserPlus } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { EmptyState } from "@/components/EmptyState";
import { timeAgo } from "@/lib/utils";

const NotificationsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) navigate("/auth");
  }, [user, navigate]);

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      // Fetch from_user profiles
      if (!data || data.length === 0) return [];
      const fromUserIds = [...new Set(data.map((n) => n.from_user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .in("id", fromUserIds);
      const profileMap = new Map((profiles || []).map((p) => [p.id, p]));
      return data.map((n) => ({ ...n, from_profile: profileMap.get(n.from_user_id) || null }));
      return data || [];
    },
    enabled: !!user,
  });

  // Mark all as read when page loads
  useEffect(() => {
    if (!user) return;
    supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false)
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ["unread-notifications"] });
      });
  }, [user, queryClient]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">Notifications</h2>
          <p className="text-sm text-muted-foreground mt-1">Stay in the loop</p>
        </div>

        <div className="space-y-2">
          {notifications.length > 0 ? (
            notifications.map((n: any, i: number) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className={`flex items-start gap-3 rounded-xl border border-border p-4 transition-colors hover:bg-card ${
                  !n.read ? "bg-primary/5" : "bg-card"
                }`}
              >
                <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                  {n.type === "follow" ? (
                    <UserPlus className="h-4 w-4 text-primary" />
                  ) : (
                    <span className="text-base">{n.emoji}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">
                    <span className="font-semibold">
                      {n.from_profile?.display_name || "Someone"}
                    </span>{" "}
                    {n.type === "follow"
                      ? "started following you"
                      : `reacted ${n.emoji} to your moment`}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {timeAgo(n.created_at)}
                  </p>
                </div>
              </motion.div>
            ))
          ) : (
            <EmptyState title="No notifications" description="When someone follows you or reacts to your moment, it'll show up here." />
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default NotificationsPage;
