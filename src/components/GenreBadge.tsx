import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const colorMap: Record<string, string> = {
  amber: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  purple: "bg-purple-500/15 text-purple-400 border-purple-500/20",
  blue: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  green: "bg-green-500/15 text-green-400 border-green-500/20",
  cyan: "bg-cyan-500/15 text-cyan-400 border-cyan-500/20",
  red: "bg-red-500/15 text-red-400 border-red-500/20",
  pink: "bg-pink-500/15 text-pink-400 border-pink-500/20",
  yellow: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  orange: "bg-orange-500/15 text-orange-400 border-orange-500/20",
  indigo: "bg-indigo-500/15 text-indigo-400 border-indigo-500/20",
};

interface GenreBadgeProps {
  genreId: string;
}

export function GenreBadge({ genreId }: GenreBadgeProps) {
  const { data: community } = useQuery({
    queryKey: ["community", genreId],
    queryFn: async () => {
      const { data } = await supabase.from("communities").select("*").eq("id", genreId).single();
      return data;
    },
    staleTime: Infinity,
  });

  if (!community) return null;

  const colors = colorMap[community.color] || colorMap.amber;

  return (
    <Link
      to={`/community/${genreId}`}
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-opacity hover:opacity-80 ${colors}`}
    >
      <span>{community.emoji}</span>
      <span>{community.name}</span>
    </Link>
  );
}
