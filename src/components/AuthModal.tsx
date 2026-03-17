import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "react-router-dom";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  message?: string;
}

export function AuthModal({ open, onClose, message = "Join Momentify to do this" }: AuthModalProps) {
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-card rounded-2xl p-8 max-w-sm w-full mx-4 text-center space-y-5"
          >
            <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-2">
              <h2 className="text-2xl font-display font-bold text-gradient">{message}</h2>
              <p className="text-sm text-muted-foreground">
                Create an account to share moments, follow people, and react to posts.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => { onClose(); navigate("/auth?mode=signup"); }}
                className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground transition-all hover:glow-amber"
              >
                Sign Up
              </button>
              <button
                onClick={() => { onClose(); navigate("/auth?mode=login"); }}
                className="w-full rounded-xl border border-border bg-secondary py-3 text-sm font-bold text-foreground transition-colors hover:bg-secondary/80"
              >
                Log In
              </button>
            </div>

            <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground">
              Maybe later
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Hook to require auth for an action
import { useCallback } from "react";

export function useRequireAuth() {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);

  const requireAuth = useCallback(
    (action: () => void, message?: string) => {
      if (user) {
        action();
      } else {
        setShowModal(true);
      }
    },
    [user]
  );

  const modal = (
    <AuthModal open={showModal} onClose={() => setShowModal(false)} />
  );

  return { requireAuth, modal, showModal, setShowModal };
}
