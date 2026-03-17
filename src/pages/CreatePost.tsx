import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { AppLayout } from "@/components/AppLayout";
import { extractYoutubeId } from "@/lib/utils";

const CreatePostPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) navigate("/auth");
  }, [user, navigate]);

  const { data: communities = [] } = useQuery({
    queryKey: ["communities"],
    queryFn: async () => {
      const { data } = await supabase.from("communities").select("*");
      return data || [];
    },
  });

  const youtubeId = extractYoutubeId(url);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !youtubeId) return;

    setError("");
    setLoading(true);

    const { error: insertError } = await supabase.from("posts").insert({
      user_id: user.id,
      title,
      caption,
      youtube_url: url,
      youtube_id: youtubeId,
      start_time: parseInt(startTime),
      end_time: parseInt(endTime),
      genre_id: selectedGenre,
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    queryClient.invalidateQueries({ queryKey: ["feed"] });
    navigate("/");
    setLoading(false);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">Share a Moment</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Paste a YouTube link and select the exact moment that moves you
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">YouTube URL</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              required
              className="w-full rounded-xl border border-border bg-secondary py-3 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* YouTube Preview */}
          {youtubeId && (
            <div className="aspect-video rounded-xl overflow-hidden bg-background">
              <iframe
                src={`https://www.youtube.com/embed/${youtubeId}?start=${startTime || 0}&end=${endTime || ""}&autoplay=0&rel=0`}
                title="Preview"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Start time (seconds)</label>
              <input
                type="number"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                placeholder="62"
                min={0}
                required
                className="w-full rounded-xl border border-border bg-secondary py-3 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">End time (seconds)</label>
              <input
                type="number"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                placeholder="105"
                min={0}
                required
                className="w-full rounded-xl border border-border bg-secondary py-3 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="this chorus hits different at 2am"
              maxLength={100}
              required
              className="w-full rounded-xl border border-border bg-secondary py-3 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Caption</label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Why does this moment hit so hard?"
              maxLength={300}
              rows={3}
              required
              className="w-full rounded-xl border border-border bg-secondary py-3 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Genre Community</label>
            <div className="flex flex-wrap gap-2">
              {communities.map((genre) => (
                <button
                  key={genre.id}
                  type="button"
                  onClick={() => setSelectedGenre(genre.id)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                    selectedGenre === genre.id
                      ? "border-primary bg-primary/20 text-primary"
                      : "border-border bg-secondary text-muted-foreground hover:border-primary/30"
                  }`}
                >
                  {genre.emoji} {genre.name}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <button
            type="submit"
            disabled={loading || !youtubeId || !selectedGenre}
            className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground transition-all hover:glow-amber disabled:opacity-50"
          >
            {loading ? "Sharing..." : "Share Moment"}
          </button>
        </form>
      </div>
    </AppLayout>
  );
};

export default CreatePostPage;
