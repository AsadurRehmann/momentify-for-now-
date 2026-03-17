import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { formatCount } from "@/lib/utils";

const genreBg: Record<string, string> = {
  "hip-hop": "from-amber-600/20 to-amber-900/10",
  rnb: "from-purple-600/20 to-purple-900/10",
  jazz: "from-blue-600/20 to-blue-900/10",
  indie: "from-green-600/20 to-green-900/10",
  electronic: "from-cyan-600/20 to-cyan-900/10",
  metal: "from-red-600/20 to-red-900/10",
  pop: "from-pink-600/20 to-pink-900/10",
  classical: "from-yellow-600/20 to-yellow-900/10",
  afrobeats: "from-orange-600/20 to-orange-900/10",
  lofi: "from-indigo-600/20 to-indigo-900/10",
};

const CommunitiesPage = () => {
  const { data: communities = [] } = useQuery({
    queryKey: ["communities-with-counts"],
    queryFn: async () => {
      const { data: comms } = await supabase.from("communities").select("*");
      if (!comms) return [];

      // Get member counts
      const { data: counts } = await supabase
        .from("community_members")
        .select("community_id");

      const countMap: Record<string, number> = {};
      (counts || []).forEach((c) => {
        countMap[c.community_id] = (countMap[c.community_id] || 0) + 1;
      });

      return comms.map((c) => ({ ...c, memberCount: countMap[c.id] || 0 }));
    },
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">Communities</h2>
          <p className="text-sm text-muted-foreground mt-1">Find your sound tribe</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {communities.map((genre, i) => (
            <motion.div
              key={genre.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                to={`/community/${genre.id}`}
                className={`block rounded-xl border border-border bg-gradient-to-br ${
                  genreBg[genre.id] || ""
                } p-4 transition-all hover:border-primary/30 hover:glow-amber`}
              >
                <span className="text-3xl">{genre.emoji}</span>
                <h3 className="mt-2 font-display font-bold text-foreground text-sm">
                  {genre.name}
                </h3>
                <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" />
                  {formatCount(genre.memberCount)}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default CommunitiesPage;
