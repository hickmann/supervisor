import { supabase } from "@/contexts/auth.context";

/**
 * Utilitário para garantir que temos um token válido do usuário autenticado
 * antes de fazer chamadas para endpoints do Supabase
 */
export async function ensureValidUserToken(currentToken?: string | null): Promise<string | null> {
  // Se já temos um token válido, retornar
  if (currentToken) {
    try {
      // Verificar se o token tem a estrutura correta e não está expirado
      const parts = currentToken.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        const isExpired = payload.exp ? Date.now() / 1000 > payload.exp : false;
        
        if (!isExpired && payload.role === 'authenticated') {
          console.log("🔐 Auth Utils: Token válido encontrado:", {
            role: payload.role,
            sub: payload.sub,
            email: payload.email,
            isExpired: false
          });
          return currentToken;
        }
      }
    } catch (error) {
      console.warn("⚠️ Auth Utils: Erro ao verificar token atual:", error);
    }
  }

  // Se não temos token ou é inválido, tentar renovar a sessão
  console.warn("⚠️ Auth Utils: Token inválido ou ausente, tentando renovar sessão...");
  
  try {
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error("❌ Auth Utils: Erro ao renovar sessão:", error);
      return null;
    }
    
    if (data.session?.access_token) {
      console.log("✅ Auth Utils: Sessão renovada com sucesso:", {
        tokenPreview: data.session.access_token.substring(0, 50) + "...",
        userEmail: data.user?.email || "unknown"
      });
      return data.session.access_token;
    }
    
    console.warn("⚠️ Auth Utils: Nenhum token retornado após renovação");
    return null;
    
  } catch (error) {
    console.error("❌ Auth Utils: Erro ao renovar sessão:", error);
    return null;
  }
}

/**
 * Prepara headers para chamadas para endpoints do Supabase com token válido
 */
export async function prepareSupabaseHeaders(
  currentToken?: string | null,
  fallbackApiKey?: string
): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Tentar obter token válido do usuário
  const userToken = await ensureValidUserToken(currentToken);
  
  if (userToken) {
    headers["Authorization"] = `Bearer ${userToken}`;
    console.log("🔐 Auth Utils: Usando token do usuário autenticado");
  } else if (fallbackApiKey) {
    headers["Authorization"] = `Bearer ${fallbackApiKey}`;
    headers["apikey"] = fallbackApiKey;
    console.log("🔐 Auth Utils: Usando API key como fallback");
  } else {
    console.error("❌ Auth Utils: Nenhum token disponível e nenhum fallback fornecido");
  }

  return headers;
}
