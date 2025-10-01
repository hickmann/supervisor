import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { createClient, User, Session } from "@supabase/supabase-js";

// Configuração do Supabase
const supabaseUrl = "https://uwqdksfxzhnmkfqvnloq.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3cWRrc2Z4emhubWtmcXZubG9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4OTU5ODIsImV4cCI6MjA3MzQ3MTk4Mn0.AgKvmWbpN3WODmVEtNz6S-4XZCBR7xoMRfnGqyS-GNQ";

// Criar cliente Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  getAccessToken: () => string | null;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar sessão existente
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      console.log("🔐 Auth: Sessão carregada:", session ? "Autenticado" : "Não autenticado");
    });

    // Escutar mudanças de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      console.log("🔐 Auth: Estado de autenticação mudou:", session ? "Autenticado" : "Não autenticado");
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log("🔐 Auth: Tentando fazer login...");
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("❌ Auth: Erro no login:", error.message);
      return { error };
    }

    console.log("✅ Auth: Login bem-sucedido!");
    setSession(data.session);
    setUser(data.user);
    return { error: null };
  };

  const signUp = async (email: string, password: string) => {
    console.log("🔐 Auth: Tentando criar conta...");
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error("❌ Auth: Erro ao criar conta:", error.message);
      return { error };
    }

    console.log("✅ Auth: Conta criada com sucesso!");
    return { error: null };
  };

  const signOut = async () => {
    console.log("🔐 Auth: Fazendo logout...");
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    console.log("✅ Auth: Logout realizado");
  };

  const getAccessToken = () => {
    return session?.access_token ?? null;
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    getAccessToken,
    isAuthenticated: !!session,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Exportar cliente Supabase para uso em outros lugares
export { supabase };
