import { Music } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  description?: string;
}

export function EmptyState({
  title = "Nothing here yet",
  description = "Follow some people or join a community to see moments in your feed.",
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
      <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center">
        <Music className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-display font-bold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-xs">{description}</p>
    </div>
  );
}
