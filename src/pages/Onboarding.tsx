import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";

const OnboardingPage = () => {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [selectedCommunities, setSelectedCommunities] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: communities = [] } = useQuery({
    queryKey: ["communities"],
    queryFn: async () => {
      const { data } = await supabase.from("communities").select("*");
      return data || [];
    },
  });

  useEffect(() => {
    if (!user) navigate("/auth");
  }, [user, navigate]);

  const toggleCommunity = (id: string) => {
    setSelectedCommunities((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCommunities.length < 3) {
      setError("Pick at least 3 communities");
      return;
    }
    if (!user) return;

    setError("");
    setLoading(true);

    // Create profile
    const { error: profileError } = await supabase.from("profiles").insert({
      id: user.id,
      username: username.toLowerCase().replace(/[^a-z0-9_]/g, ""),
      display_name: displayName,
      avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      onboarded: true,
    });

    if (profileError) {
      setError(profileError.message);
      setLoading(false);
      return;
    }

    // Join communities
    await supabase.from("community_members").insert(
      selectedCommunities.map((cid) => ({ user_id: user.id, community_id: cid }))
    );

    await refreshProfile();
    navigate("/");
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-8 max-w-md w-full space-y-6"
      >
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-display font-bold text-gradient">Set up your profile</h1>
          <p className="text-sm text-muted-foreground">Pick a username and your favorite communities</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              maxLength={30}
              placeholder="Wave Chaser"
              className="w-full rounded-xl border border-border bg-secondary py-3 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              maxLength={20}
              pattern="[a-zA-Z0-9_]+"
              placeholder="wavechaser"
              className="w-full rounded-xl border border-border bg-secondary py-3 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Join communities ({selectedCommunities.length}/10 — pick at least 3)
            </label>
            <div className="flex flex-wrap gap-2">
              {communities.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleCommunity(c.id)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                    selectedCommunities.includes(c.id)
                      ? "border-primary bg-primary/20 text-primary"
                      : "border-border bg-secondary text-muted-foreground hover:border-primary/30"
                  }`}
                >
                  {c.emoji} {c.name}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground transition-all hover:glow-amber disabled:opacity-50"
          >
            {loading ? "Setting up..." : "Enter Momentify"}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default OnboardingPage;
