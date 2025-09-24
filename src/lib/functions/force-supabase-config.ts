import { safeLocalStorage } from "@/lib";
import { STORAGE_KEYS, DEFAULT_SUPABASE_API_KEY } from "@/config";

/**
 * Força a configuração da chave de API do Supabase
 * Remove qualquer configuração antiga e aplica a nova
 */
export function forceSupabaseConfig(): void {
  console.log("🔧 Forçando configuração do Supabase...");
  
  // Remover configuração antiga
  safeLocalStorage.removeItem(STORAGE_KEYS.SELECTED_AI_PROVIDER);
  console.log("🧹 Configuração antiga removida");
  
  // Aplicar nova configuração
  const newConfig = {
    provider: "supervision",
    variables: {
      api_key: DEFAULT_SUPABASE_API_KEY,
    },
  };
  
  safeLocalStorage.setItem(
    STORAGE_KEYS.SELECTED_AI_PROVIDER,
    JSON.stringify(newConfig)
  );
  
  console.log("✅ Nova configuração aplicada:", newConfig);
  console.log("🔑 Chave de API configurada:", DEFAULT_SUPABASE_API_KEY ? "Sim" : "Não");
}

/**
 * Verifica se a configuração do Supabase está correta
 */
export function verifySupabaseConfig(): boolean {
  const savedConfig = safeLocalStorage.getItem(STORAGE_KEYS.SELECTED_AI_PROVIDER);
  
  if (!savedConfig) {
    console.log("⚠️ Nenhuma configuração encontrada");
    return false;
  }
  
  try {
    const config = JSON.parse(savedConfig);
    const hasApiKey = config.variables?.api_key && config.variables.api_key.trim() !== "";
    const isSupervision = config.provider === "supervision";
    
    console.log("🔍 Configuração atual:", config);
    console.log("🔑 Chave de API presente:", hasApiKey ? "Sim" : "Não");
    console.log("🎯 Provedor correto:", isSupervision ? "Sim" : "Não");
    
    return hasApiKey && isSupervision;
  } catch (error) {
    console.error("❌ Erro ao verificar configuração:", error);
    return false;
  }
}
