import { motion } from "framer-motion";
import { formatTime, timeAgo } from "@/lib/utils";
import { ReactionBar } from "./ReactionBar";
import { GenreBadge } from "./GenreBadge";
import { Play } from "lucide-react";
import { Link } from "react-router-dom";
import { Tables } from "@/integrations/supabase/types";

type PostWithProfile = Tables<"posts"> & {
  profiles: Tables<"profiles"> | null;
};

interface PostCardProps {
  post: PostWithProfile;
  index?: number;
}

export function PostCard({ post, index = 0 }: PostCardProps) {
  const profile = post.profiles;
  if (!profile) return null;

  const embedUrl = `https://www.youtube.com/embed/${post.youtube_id}?start=${post.start_time}&end=${post.end_time}&autoplay=0&rel=0&modestbranding=1`;

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      className="glass-card rounded-xl overflow-hidden group"
    >
      <div className="relative aspect-video bg-background">
        <iframe
          src={embedUrl}
          title={post.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
        <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-background/80 backdrop-blur-sm px-2 py-1 text-xs font-medium text-foreground">
          <Play className="h-3 w-3 text-primary" />
          {formatTime(post.start_time)} – {formatTime(post.end_time)}
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Link to={`/profile/${profile.username}`} className="flex items-center gap-2 group/user">
            <img
              src={profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`}
              alt={profile.display_name}
              className="h-8 w-8 rounded-full bg-secondary"
            />
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-foreground group-hover/user:text-primary transition-colors">
                {profile.display_name}
              </span>
              <span className="text-xs text-muted-foreground">@{profile.username}</span>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <GenreBadge genreId={post.genre_id} />
            <span className="text-xs text-muted-foreground">{timeAgo(post.created_at)}</span>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-display font-bold text-foreground leading-tight">
            {post.title}
          </h3>
          <p className="mt-1 text-sm text-secondary-foreground leading-relaxed">
            {post.caption}
          </p>
        </div>

        <ReactionBar postId={post.id} />
      </div>
    </motion.article>
  );
}
