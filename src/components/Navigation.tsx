import { Link, useLocation } from "react-router-dom";
import { Home, Compass, Users, User, Bell, Plus } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useRequireAuth } from "./AuthModal";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function BottomNav() {
  const { pathname } = useLocation();
  const { user, profile } = useAuth();
  const { requireAuth, modal } = useRequireAuth();

  const navItems = [
    { to: "/", label: "Home", icon: Home },
    { to: "/explore", label: "Explore", icon: Compass },
    { to: "/communities", label: "Communities", icon: Users },
    { to: "/notifications", label: "Alerts", icon: Bell, auth: true },
    ...(profile ? [{ to: `/profile/${profile.username}`, label: "Profile", icon: User }] : []),
  ];

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["unread-notifications", user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("read", false);
      return count || 0;
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  return (
    <>
      {modal}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/80 backdrop-blur-xl md:hidden">
        <div className="flex items-center justify-around py-2">
          {navItems.map(({ to, label, icon: Icon, auth: needsAuth }) => {
            const active = pathname === to || (to !== "/" && pathname.startsWith(to));
            if (needsAuth && !user) {
              return (
                <button
                  key={label}
                  onClick={() => requireAuth(() => {})}
                  className="flex flex-col items-center gap-0.5 px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <div className="relative">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span>{label}</span>
                </button>
              );
            }
            return (
              <Link
                key={to}
                to={to}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors ${
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="relative">
                  <Icon className="h-5 w-5" />
                  {label === "Alerts" && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </div>
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

export function DesktopSidebar() {
  const { pathname } = useLocation();
  const { user, profile } = useAuth();
  const { requireAuth, modal } = useRequireAuth();

  const navItems = [
    { to: "/", label: "Home", icon: Home },
    { to: "/explore", label: "Explore", icon: Compass },
    { to: "/communities", label: "Communities", icon: Users },
    { to: "/notifications", label: "Alerts", icon: Bell, auth: true },
    ...(profile ? [{ to: `/profile/${profile.username}`, label: "Profile", icon: User }] : []),
  ];

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["unread-notifications", user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("read", false);
      return count || 0;
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  return (
    <>
      {modal}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 flex-col border-r border-border bg-card/50 backdrop-blur-xl z-50">
        <div className="p-6">
          <h1 className="text-2xl font-display font-bold">
            <span className="text-gradient">Momentify</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">share the moment</p>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {navItems.map(({ to, label, icon: Icon, auth: needsAuth }) => {
            const active = pathname === to || (to !== "/" && pathname.startsWith(to));
            if (needsAuth && !user) {
              return (
                <button
                  key={label}
                  onClick={() => requireAuth(() => {})}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground w-full"
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </button>
              );
            }
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <div className="relative">
                  <Icon className="h-5 w-5" />
                  {label === "Alerts" && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </div>
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 space-y-2">
          {user ? (
            <Link
              to="/create"
              className="flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground transition-all hover:shadow-lg hover:glow-amber"
            >
              <Plus className="h-4 w-4" />
              Share a Moment
            </Link>
          ) : (
            <Link
              to="/auth?mode=signup"
              className="flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground transition-all hover:shadow-lg hover:glow-amber"
            >
              Sign Up
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}
