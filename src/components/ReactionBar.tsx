import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { REACTION_TYPES, type ReactionType, formatCount } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useRequireAuth } from "./AuthModal";

interface ReactionBarProps {
  postId: string;
  size?: "sm" | "md";
}

export function ReactionBar({ postId, size = "md" }: ReactionBarProps) {
  const { user } = useAuth();
  const { requireAuth, modal } = useRequireAuth();
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [userReaction, setUserReaction] = useState<string | null>(null);

  useEffect(() => {
    // Fetch counts
    supabase.rpc("get_reaction_counts", { p_post_id: postId }).then(({ data }) => {
      if (data) setCounts(data as Record<string, number>);
    });

    // Fetch user's reaction
    if (user) {
      supabase
        .from("reactions")
        .select("emoji")
        .eq("post_id", postId)
        .eq("user_id", user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) setUserReaction(data.emoji);
        });
    }
  }, [postId, user]);

  const handleReact = async (type: ReactionType) => {
    if (!user) return;

    if (userReaction === type) {
      // Remove reaction
      await supabase.from("reactions").delete().eq("post_id", postId).eq("user_id", user.id);
      setCounts((prev) => ({ ...prev, [type]: Math.max(0, (prev[type] || 0) - 1) }));
      setUserReaction(null);

      // Delete notification
      await supabase.from("notifications").delete()
        .eq("from_user_id", user.id)
        .eq("post_id", postId)
        .eq("type", "reaction");
    } else {
      const oldReaction = userReaction;
      // Upsert reaction
      await supabase.from("reactions").upsert(
        { user_id: user.id, post_id: postId, emoji: type },
        { onConflict: "user_id,post_id" }
      );
      setCounts((prev) => {
        const next = { ...prev, [type]: (prev[type] || 0) + 1 };
        if (oldReaction) next[oldReaction] = Math.max(0, (next[oldReaction] || 0) - 1);
        return next;
      });
      setUserReaction(type);

      // Create notification (get post owner)
      const { data: post } = await supabase.from("posts").select("user_id").eq("id", postId).single();
      if (post && post.user_id !== user.id) {
        await supabase.from("notifications").upsert(
          { user_id: post.user_id, from_user_id: user.id, post_id: postId, type: "reaction", emoji: type, read: false },
          { onConflict: "user_id,post_id" as any }
        );
      }
    }
  };

  const isSmall = size === "sm";

  return (
    <>
      {modal}
      <div className="flex items-center gap-1">
        {REACTION_TYPES.map((type) => (
          <motion.button
            key={type}
            whileTap={{ scale: 1.4 }}
            onClick={() => requireAuth(() => handleReact(type))}
            className={`flex items-center gap-1 rounded-full transition-colors ${
              isSmall ? "px-2 py-0.5 text-xs" : "px-3 py-1.5 text-sm"
            } ${
              userReaction === type
                ? "bg-primary/20 ring-1 ring-primary/40"
                : "bg-secondary hover:bg-secondary/80"
            }`}
          >
            <span className={isSmall ? "text-sm" : "text-base"}>{type}</span>
            <span className="font-body text-muted-foreground">
              {formatCount(counts[type] || 0)}
            </span>
          </motion.button>
        ))}
      </div>
    </>
  );
}
