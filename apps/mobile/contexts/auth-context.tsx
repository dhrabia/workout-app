import { createContext, useContext, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";

type AuthContextValue = {
  userId: string | null;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextValue>({ userId: null, isLoading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        const { data: anonData, error } = await supabase.auth.signInAnonymously();
        if (error) throw error;
        if (isMounted) setSession(anonData.session);
      } else if (isMounted) {
        setSession(data.session);
      }
      if (isMounted) setIsLoading(false);
    }

    bootstrap();

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (isMounted) setSession(nextSession);
    });

    return () => {
      isMounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ userId: session?.user.id ?? null, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
