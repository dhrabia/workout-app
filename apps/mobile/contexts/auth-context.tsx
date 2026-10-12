import { createContext, useContext, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";

import { queryClient } from "@/lib/query-client";
import { supabase } from "@/lib/supabase";

type AuthContextValue = {
  userId: string | null;
  // True only for a real (non-anonymous) account; signed-out users, and any
  // leftover anonymous session, are routed through onboarding.
  hasAccount: boolean;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextValue>({ userId: null, hasAccount: false, isLoading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      try {
        const { data } = await supabase.auth.getSession();
        if (isMounted) setSession(data.session);
      } catch {
        // Treat an unreadable stored session as signed out.
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    restoreSession();

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (isMounted) setSession(nextSession);
    });

    return () => {
      isMounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  // Cached queries aren't keyed by user, so drop them whenever the user changes
  // (sign out, or signing in as someone else) to avoid showing stale data.
  const userId = session?.user.id;
  useEffect(() => () => queryClient.clear(), [userId]);

  return (
    <AuthContext.Provider
      value={{
        userId: session?.user.id ?? null,
        hasAccount: !!session && !session.user.is_anonymous,
        isLoading,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
