import { fetch as tauriFetch } from "@tauri-apps/plugin-http";

export interface SupervisionResponse {
  avaliacao_tecnica?: Array<{
    titulo: string;
    justificativa: string;
    exemplo_reformulacao: string;
  }>;
  aspectos_relacionais?: Array<{
    titulo: string;
    justificativa: string;
    exemplo_reformulacao: string;
  }>;
  questoes_eticas?: Array<{
    titulo: string;
    justificativa: string;
    exemplo_reformulacao: string;
  }>;
  sugestoes_psicoeducacionais?: Array<{
    titulo: string;
    justificativa: string;
    material_apoio?: string;
  }>;
  recomendacoes?: Array<{
    titulo: string;
    racional: string;
    proxima_sessao?: string;
  }>;
}

export interface SupervisionError {
  error: string;
}

export async function* fetchSupervisionResponse(
  transcription: string,
  apiKey: string,
  authToken?: string
): AsyncIterable<string> {
  try {
    if (!transcription.trim()) {
      yield "Erro: Transcrição é obrigatória";
      return;
    }

    if (transcription.length < 12) {
      yield "Erro: Transcrição deve ter pelo menos 12 caracteres";
      return;
    }

    const url = "https://uwqdksfxzhnmkfqvnloq.supabase.co/functions/v1/analyze-supervision";
    
    // Prepare headers with authentication token if available
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "apikey": apiKey,
    };

    // Add user authentication token as Bearer token if available
    if (authToken) {
      headers["Authorization"] = `Bearer ${authToken}`;
      console.log("🔐 Supervision: Using user auth token as Bearer:", {
        tokenPreview: authToken.substring(0, 50) + "...",
        tokenParts: authToken.split('.').length,
        isUserToken: true
      });
    } else {
      // Fallback to API key as Bearer if no user token
      headers["Authorization"] = `Bearer ${apiKey}`;
      console.log("🔐 Supervision: Using API key as Bearer fallback:", {
        tokenPreview: apiKey.substring(0, 50) + "...",
        tokenParts: apiKey.split('.').length,
        isUserToken: false
      });
    }

    const response = await tauriFetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        transcricao: transcription,
      }),
    });

    if (response.status === 204) {
      // Status 204 = No Content - não há recomendações específicas
      // Retornamos uma string especial que será ignorada pelo sistema de botões
      yield "NO_CONTENT_204";
      return;
    }

    if (!response.ok) {
      if (response.status === 400 || response.status === 422) {
        const errorData: SupervisionError = await response.json();
        yield `❌ **Erro de Validação**: ${errorData.error}`;
        return;
      } else if (response.status === 502) {
        yield "❌ **Erro do Serviço**: Erro no serviço externo (Gemini)";
        return;
      } else if (response.status === 500) {
        yield "❌ **Erro Interno**: Erro interno do servidor";
        return;
      } else {
        yield `❌ **Erro**: Status ${response.status} - ${response.statusText}`;
        return;
      }
    }

    const data: SupervisionResponse = await response.json();
    
    // Format the response
    let formattedResponse = "🎯 **Análise de Supervisão**\n\n";

    if (data.avaliacao_tecnica && data.avaliacao_tecnica.length > 0) {
      formattedResponse += "## 📋 Avaliação Técnica\n\n";
      data.avaliacao_tecnica.forEach((item, index) => {
        formattedResponse += `**${index + 1}. ${item.titulo}**\n`;
        formattedResponse += `*Justificativa:* ${item.justificativa}\n`;
        formattedResponse += `*Exemplo de reformulação:* ${item.exemplo_reformulacao}\n\n`;
      });
    }

    if (data.aspectos_relacionais && data.aspectos_relacionais.length > 0) {
      formattedResponse += "## 🤝 Aspectos Relacionais\n\n";
      data.aspectos_relacionais.forEach((item, index) => {
        formattedResponse += `**${index + 1}. ${item.titulo}**\n`;
        formattedResponse += `*Justificativa:* ${item.justificativa}\n`;
        formattedResponse += `*Exemplo de reformulação:* ${item.exemplo_reformulacao}\n\n`;
      });
    }

    if (data.questoes_eticas && data.questoes_eticas.length > 0) {
      formattedResponse += "## ⚖️ Questões Éticas\n\n";
      data.questoes_eticas.forEach((item, index) => {
        formattedResponse += `**${index + 1}. ${item.titulo}**\n`;
        formattedResponse += `*Justificativa:* ${item.justificativa}\n`;
        formattedResponse += `*Exemplo de reformulação:* ${item.exemplo_reformulacao}\n\n`;
      });
    }

    if (data.sugestoes_psicoeducacionais && data.sugestoes_psicoeducacionais.length > 0) {
      formattedResponse += "## 📚 Sugestões Psicoeducacionais\n\n";
      data.sugestoes_psicoeducacionais.forEach((item, index) => {
        formattedResponse += `**${index + 1}. ${item.titulo}**\n`;
        formattedResponse += `*Justificativa:* ${item.justificativa}\n`;
        if (item.material_apoio) {
          formattedResponse += `*Material de apoio:* ${item.material_apoio}\n`;
        }
        formattedResponse += "\n";
      });
    }

    if (data.recomendacoes && data.recomendacoes.length > 0) {
      formattedResponse += "## 💡 Recomendações\n\n";
      data.recomendacoes.forEach((item, index) => {
        formattedResponse += `**${index + 1}. ${item.titulo}**\n`;
        formattedResponse += `*Racional:* ${item.racional}\n`;
        if (item.proxima_sessao) {
          formattedResponse += `*Próxima sessão:* ${item.proxima_sessao}\n`;
        }
        formattedResponse += "\n";
      });
    }

    yield formattedResponse;

  } catch (error) {
    yield `❌ **Erro de Rede**: ${error instanceof Error ? error.message : "Erro desconhecido"}`;
  }
}
