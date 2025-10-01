import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { createClient, User, Session } from "@supabase/supabase-js";

// Configuração do Supabase
const supabaseUrl = "https://uwqdksfxzhnmkfqvnloq.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3cWRrc2Z4emhubWtmcXZubG9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4OTU5ODIsImV4cCI6MjA3MzQ3MTk4Mn0.AgKvmWbpN3WODmVEtNz6S-4XZCBR7xoMRfnGqyS-GNQ";

// Criar cliente Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false
  }
});

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  getAccessToken: () => string | null;
  refreshSession: () => Promise<boolean>;
  testToken: () => Promise<boolean>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar sessão existente
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error("❌ Auth: Erro ao obter sessão:", error);
      }
      
      console.log("🔐 Auth: Sessão inicial carregada:", {
        hasSession: !!session,
        hasUser: !!session?.user,
        userEmail: session?.user?.email || "no user",
        hasToken: !!session?.access_token,
        tokenPreview: session?.access_token ? session.access_token.substring(0, 50) + "..." : "null"
      });
      
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      console.log("🔐 Auth: Sessão carregada:", session ? "Autenticado" : "Não autenticado");
    });

    // Escutar mudanças de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("🔐 Auth: Evento de autenticação:", event, {
        hasSession: !!session,
        hasToken: !!session?.access_token,
        tokenPreview: session?.access_token ? session.access_token.substring(0, 50) + "..." : "null"
      });
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
    console.log("🔐 Auth: Dados da sessão:", {
      hasSession: !!data.session,
      hasUser: !!data.user,
      tokenPreview: data.session?.access_token ? data.session.access_token.substring(0, 50) + "..." : "null",
      tokenParts: data.session?.access_token ? data.session.access_token.split('.').length : 0
    });
    
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
    const token = session?.access_token ?? null;
    console.log("🔐 Auth: getAccessToken called:", {
      hasSession: !!session,
      hasToken: !!token,
      tokenPreview: token ? token.substring(0, 50) + "..." : "null",
      tokenParts: token ? token.split('.').length : 0,
      sessionUser: session?.user?.email || "no user",
      sessionExpiresAt: session?.expires_at || "no expiry"
    });
    
    // Verificar se o token tem a estrutura correta de JWT (3 partes separadas por ponto)
    if (token && token.split('.').length !== 3) {
      console.error("❌ Auth: Token JWT inválido - não tem 3 partes:", token.split('.').length);
    }
    
    // Tentar decodificar o payload do JWT para verificar se está válido
    if (token) {
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          const isExpired = payload.exp ? Date.now() / 1000 > payload.exp : false;
          console.log("🔐 Auth: Token payload:", {
            iss: payload.iss,
            aud: payload.aud,
            exp: payload.exp,
            iat: payload.iat,
            sub: payload.sub,
            email: payload.email,
            role: payload.role,
            isExpired: isExpired
          });
          
          if (isExpired) {
            console.warn("⚠️ Auth: Token expirado! Tentando renovar...");
            // Tentar renovar o token
            supabase.auth.refreshSession();
          }
        }
      } catch (error) {
        console.error("❌ Auth: Erro ao decodificar token JWT:", error);
      }
    }
    
    return token;
  };

  // Função para forçar renovação da sessão
  const refreshSession = async () => {
    try {
      console.log("🔄 Auth: Forçando renovação da sessão...");
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error("❌ Auth: Erro ao renovar sessão:", error);
        return false;
      }
      
      console.log("✅ Auth: Sessão renovada:", {
        hasSession: !!data.session,
        hasUser: !!data.user,
        userEmail: data.user?.email || "no user",
        hasToken: !!data.session?.access_token,
        tokenPreview: data.session?.access_token ? data.session.access_token.substring(0, 50) + "..." : "null"
      });
      
      setSession(data.session);
      setUser(data.user);
      return true;
    } catch (error) {
      console.error("❌ Auth: Erro ao renovar sessão:", error);
      return false;
    }
  };

  // Função para testar se o token está funcionando
  const testToken = async () => {
    const token = getAccessToken();
    if (!token) {
      console.error("❌ Auth: Nenhum token disponível para teste");
      return false;
    }

    try {
      console.log("🧪 Auth: Testando token...");
      const response = await fetch('https://uwqdksfxzhnmkfqvnloq.supabase.co/functions/v1/analyze-supervision', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'apikey': supabaseAnonKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          transcricao: 'Teste de token'
        })
      });

      console.log("🧪 Auth: Resposta do teste:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      return response.ok;
    } catch (error) {
      console.error("❌ Auth: Erro no teste do token:", error);
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    getAccessToken,
    refreshSession,
    testToken,
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
