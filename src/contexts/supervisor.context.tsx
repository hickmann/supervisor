import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { SupervisorItem, SupervisorContextType, AssistentClinicoResponse, SessionSummaryResponse } from "@/types/supervisor.type";

const SupervisorContext = createContext<SupervisorContextType | undefined>(undefined);

export const SupervisorProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<SupervisorItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<SupervisorItem | null>(null);
  const [assistentClinicoData, setAssistentClinicoData] = useState<AssistentClinicoResponse | null>(null);
  const [conversationBuffer, setConversationBuffer] = useState<Array<{ role: string; content: string; timestamp: number }>>([]);
  const [sessionSummaryData, setSessionSummaryData] = useState<SessionSummaryResponse | null>(null);
  const [isGeneratingSessionSummary, setIsGeneratingSessionSummary] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const selectItem = useCallback((id: string | null) => {
    if (!id) {
      setSelectedItem(null);
      return;
    }
    
    // Casos especiais que não são SupervisorItem normais
    if (id === 'transcriptions') {
      setSelectedItem({
        id: 'transcriptions',
        title: 'Transcrições da Sessão',
        subtitle: 'Histórico completo da conversa',
        description: 'Transcrições da sessão entre paciente e terapeuta',
        createdAt: new Date().toISOString()
      });
      return;
    }
    
    // Casos especiais para assistente clínico
    if (id === 'conceito_definicao' && assistentClinicoData?.conceito_definicao) {
      setSelectedItem({
        id: 'conceito_definicao',
        title: assistentClinicoData.conceito_definicao.termo || 'Conceito',
        subtitle: 'Conceito e Definição',
        description: `• ${assistentClinicoData.conceito_definicao.definicao || 'Definição não disponível'}`,
        createdAt: new Date().toISOString()
      });
      return;
    }
    
    if (id === 'pergunta_resposta' && assistentClinicoData?.pergunta_e_resposta) {
      setSelectedItem({
        id: 'pergunta_resposta',
        title: assistentClinicoData.pergunta_e_resposta.pergunta || 'Pergunta',
        subtitle: 'Pergunta e Resposta Sugerida',
        description: `• ${assistentClinicoData.pergunta_e_resposta.resposta_sugerida || 'Resposta não disponível'}`,
        createdAt: new Date().toISOString()
      });
      return;
    }
    
    if (id === 'perguntas_exploratorias' && assistentClinicoData?.perguntas_exploratorias) {
      const perguntasList = assistentClinicoData.perguntas_exploratorias
        .map((pergunta) => `• ${pergunta}`)
        .join('\n\n');
      
      setSelectedItem({
        id: 'perguntas_exploratorias',
        title: 'Perguntas Exploratórias',
        subtitle: 'Sugestões para aprofundar o tema',
        description: perguntasList || '• Nenhuma pergunta disponível',
        createdAt: new Date().toISOString()
      });
      return;
    }
    
    if (id === 'proximas_falas' && assistentClinicoData?.proximas_falas) {
      const falasList = assistentClinicoData.proximas_falas
        .map((fala) => `• ${fala}`)
        .join('\n\n');
      
      setSelectedItem({
        id: 'proximas_falas',
        title: 'O que eu deveria falar depois?',
        subtitle: 'Sugestões para próximas intervenções',
        description: falasList || '• Nenhuma sugestão disponível',
        createdAt: new Date().toISOString()
      });
      return;
    }
    
    if (id === 'checagem_fatos' && assistentClinicoData?.checagem_fatos && assistentClinicoData.checagem_fatos.length > 0) {
      const checagemList = assistentClinicoData.checagem_fatos
        .map((checagem) => {
          const avaliacaoColor = checagem.avaliacao === 'preciso' ? '✅' : 
                                 checagem.avaliacao === 'impreciso' ? '❌' : '⚠️';
          
          return `• ${checagem.afirmacao}\n\n${avaliacaoColor} Avaliação: ${checagem.avaliacao}\n\n📝 Justificativa: ${checagem.justificativa}\n\n📊 Confiança: ${(checagem.confianca * 100).toFixed(0)}%\n\n📚 Fontes sugeridas:\n${checagem.fontes_sugeridas.map(fonte => `  - ${fonte}`).join('\n')}`;
        })
        .join('\n\n' + '─'.repeat(50) + '\n\n');
      
      setSelectedItem({
        id: 'checagem_fatos',
        title: assistentClinicoData.checagem_fatos[0].afirmacao,
        subtitle: 'Verificação de Fatos',
        description: checagemList || '• Nenhuma verificação disponível',
        createdAt: new Date().toISOString()
      });
      return;
    }
    
    // Caso especial para session-summary
    if (id === 'session_summary' && sessionSummaryData?.temas) {
      const temasList = sessionSummaryData.temas
        .map((tema) => `• ${tema}`)
        .join('\n\n');
      
      setSelectedItem({
        id: 'session_summary',
        title: 'Recapitulação da Sessão Completa',
        subtitle: 'Temas identificados na sessão',
        description: temasList || '• Nenhum tema identificado',
        createdAt: new Date().toISOString()
      });
      return;
    }
    
    const item = items.find(item => item.id === id);
    setSelectedItem(item || null);
  }, [items, assistentClinicoData, sessionSummaryData]);

  const addItems = useCallback((newItems: SupervisorItem[]) => {
    setItems(prevItems => {
      // Dedup by title and description content (not id) to avoid duplicates of same response
      const existingContent = new Set(prevItems.map(item => `${item.title}|${item.description.substring(0, 100)}`));
      const uniqueNewItems = newItems.filter(item => {
        const contentKey = `${item.title}|${item.description.substring(0, 100)}`;
        return !existingContent.has(contentKey);
      });
      
      if (uniqueNewItems.length === 0) return prevItems;
      
              // Combine and sort by createdAt descending, then limit to 5
              const combined = [...uniqueNewItems, ...prevItems]
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 5);
      
      return combined;
    });
  }, []);
  
  // Função para adicionar fala ao buffer da conversa
  const addToConversationBuffer = useCallback((role: string, content: string) => {
    const newMessage = {
      role,
      content: content.trim(),
      timestamp: Date.now()
    };
    
    setConversationBuffer(prev => {
      const updated = [...prev, newMessage];
      console.log("🔄 ConversationBuffer: Adicionada nova fala:", newMessage);
      console.log("🔄 ConversationBuffer: Total de falas:", updated.length);
      
      // Se chegamos a 5 falas, verificar se o texto total tem pelo menos 80 caracteres
      if (updated.length >= 5) {
        const totalTextLength = updated.reduce((total, msg) => total + msg.content.length, 0);
        console.log("🔄 ConversationBuffer: Texto total:", totalTextLength, "caracteres");
        
        if (totalTextLength >= 80) {
          console.log("🚀 ConversationBuffer: 5 falas com texto suficiente, enviando para assistente clínico");
          sendToAssistentClinico(updated);
          return []; // Limpar buffer após enviar
        } else {
          console.log("🔄 ConversationBuffer: 5 falas mas texto insuficiente, aguardando mais falas...");
        }
      }
      
      return updated;
    });
  }, []);
  
  // Função para gerar resumo da sessão completa
  const generateSessionSummary = useCallback(async (conversationHistory: Array<{ role: string; content: string; timestamp: number }>): Promise<boolean> => {
    try {
      setIsGeneratingSessionSummary(true);
      setError(null); // Limpar erro anterior
      console.log("🌐 SessionSummary: Enviando histórico completo para session-summary:", conversationHistory);
      
      // Formatear todo o histórico da conversa para envio
      const chatData = conversationHistory
        .sort((a, b) => a.timestamp - b.timestamp) // ordem cronológica
        .map(conv => `${conv.role.toUpperCase()}: ${conv.content}`)
        .join('\n\n');
      
      console.log("🌐 SessionSummary: Dados formatados para envio:", chatData);
      console.log("🌐 SessionSummary: Total de caracteres:", chatData.length);
      
      const response = await fetch('https://uwqdksfxzhnmkfqvnloq.supabase.co/functions/v1/session-summary', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3cWRrc2Z4emhubWtmcXZubG9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4OTU5ODIsImV4cCI6MjA3MzQ3MTk4Mn0.AgKvmWbpN3WODmVEtNz6S-4XZCBR7xoMRfnGqyS-GNQ',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3cWRrc2Z4emhubWtmcXZubG9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4OTU5ODIsImV4cCI6MjA3MzQ3MTk4Mn0.AgKvmWbpN3WODmVEtNz6S-4XZCBR7xoMRfnGqyS-GNQ',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          idioma: "pt-BR",
          opcoes: {
            incluir_temas: true,
            incluir_intervencoes: true,
            incluir_tarefas: true,
            incluir_sinais_alerta: true
          },
          metadados: {
            timestamp_iso: new Date().toISOString()
          },
          transcricao: chatData
        })
      });
      
      console.log("🌐 SessionSummary: Resposta recebida:", response.status, response.statusText);
      
      if (response.ok) {
        // Verificar se a resposta tem conteúdo antes de tentar fazer parse
        if (response.status === 204) {
          console.log("✅ SessionSummary: Resposta 204 - Nenhum conteúdo para processar");
          return false; // Não há dados para processar
        }
        
        // Verificar se há conteúdo na resposta
        const contentLength = response.headers.get('content-length');
        if (contentLength === '0') {
          console.log("✅ SessionSummary: Resposta vazia - Nenhum conteúdo para processar");
          return false; // Resposta vazia
        }
        
        try {
          const data: SessionSummaryResponse = await response.json();
          console.log("✅ SessionSummary: Dados processados:", data);
          setSessionSummaryData(data);
          return true; // Sucesso - dados processados
        } catch (jsonError) {
          console.warn("⚠️ SessionSummary: Erro ao fazer parse do JSON:", jsonError);
          console.log("📄 SessionSummary: Tentando ler como texto...");
          const textResponse = await response.text();
          console.log("📄 SessionSummary: Resposta como texto:", textResponse);
          return false; // Falha no parse
        }
      } else {
        const errorText = await response.text();
        console.error("❌ SessionSummary: Erro na resposta:", response.status, response.statusText);
        console.error("❌ SessionSummary: Detalhes do erro:", errorText);
        
        // Tentar fazer parse do erro para extrair mensagem amigável
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.details) {
            setError(`Erro: ${errorData.details}`);
          } else if (errorData.error) {
            setError(`Erro: ${errorData.error}`);
          } else {
            setError(`Erro na API: ${response.status} ${response.statusText}`);
          }
        } catch {
          setError(`Erro na API: ${response.status} ${response.statusText}`);
        }
        return false; // Erro na API
      }
    } catch (error) {
      console.error("❌ SessionSummary: Erro ao enviar:", error);
      return false; // Erro de rede/conexão
    } finally {
      setIsGeneratingSessionSummary(false);
    }
  }, []);

  // Função para enviar para o assistente clínico
  const sendToAssistentClinico = useCallback(async (conversations: Array<{ role: string; content: string; timestamp: number }>) => {
    try {
      console.log("🌐 AssistentClinico: Enviando apenas as 5 conversas coletadas:", conversations);
      
      // Formatear apenas as 5 conversas coletadas para envio
      const chatData = conversations
        .sort((a, b) => a.timestamp - b.timestamp) // ordem cronológica
        .map(conv => `${conv.role.toUpperCase()}: ${conv.content}`)
        .join('\n\n');
      
      console.log("🌐 AssistentClinico: Dados formatados para envio (apenas 5 falas):", chatData);
      console.log("🌐 AssistentClinico: Total de caracteres:", chatData.length);
      
      const response = await fetch('https://uwqdksfxzhnmkfqvnloq.supabase.co/functions/v1/assistente-clinico', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3cWRrc2Z4emhubWtmcXZubG9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4OTU5ODIsImV4cCI6MjA3MzQ3MTk4Mn0.AgKvmWbpN3WODmVEtNz6S-4XZCBR7xoMRfnGqyS-GNQ',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3cWRrc2Z4emhubWtmcXZubG9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4OTU5ODIsImV4cCI6MjA3MzQ3MTk4Mn0.AgKvmWbpN3WODmVEtNz6S-4XZCBR7xoMRfnGqyS-GNQ',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          transcricao: chatData,
          idioma: "pt-BR",
          opcoes: {
            max_bullets_resumo: 3,
            max_perguntas_exploratorias: 4,
            max_proximas_falas: 3
          }
        })
      });
      
      console.log("🌐 AssistentClinico: Resposta recebida:", response.status, response.statusText);
      
      if (response.ok) {
        // Verificar se a resposta tem conteúdo antes de tentar fazer parse
        if (response.status === 204) {
          console.log("✅ AssistentClinico: Resposta 204 - Nenhum conteúdo para processar");
          return; // Não há dados para processar
        }
        
        // Verificar se há conteúdo na resposta
        const contentLength = response.headers.get('content-length');
        if (contentLength === '0') {
          console.log("✅ AssistentClinico: Resposta vazia - Nenhum conteúdo para processar");
          return;
        }
        
        try {
          const data: AssistentClinicoResponse = await response.json();
          console.log("✅ AssistentClinico: Dados processados:", data);
          console.log("✅ AssistentClinico: Estrutura dos dados:", {
            hasTopico: !!data.topico,
            hasResumo: !!data.resumo,
            hasConceitoDefinicao: !!data.conceito_definicao,
            hasPerguntaResposta: !!data.pergunta_e_resposta,
            hasPerguntasExploratorias: !!data.perguntas_exploratorias,
            hasProximasFalas: !!data.proximas_falas
          });
          setAssistentClinicoData(data);
        } catch (jsonError) {
          console.warn("⚠️ AssistentClinico: Erro ao fazer parse do JSON:", jsonError);
          console.log("📄 AssistentClinico: Tentando ler como texto...");
          const textResponse = await response.text();
          console.log("📄 AssistentClinico: Resposta como texto:", textResponse);
        }
      } else {
        const errorText = await response.text();
        console.error("❌ AssistentClinico: Erro na resposta:", response.status, response.statusText);
        console.error("❌ AssistentClinico: Detalhes do erro:", errorText);
      }
    } catch (error) {
      console.error("❌ AssistentClinico: Erro ao enviar:", error);
    }
  }, []);

  const value: SupervisorContextType = {
    items,
    selectedItem,
    selectItem,
    addItems,
    assistentClinicoData,
    conversationBuffer,
    addToConversationBuffer,
    sessionSummaryData,
    isGeneratingSessionSummary,
    generateSessionSummary,
    sendToAssistentClinico,
    error,
    setError,
  };

  return (
    <SupervisorContext.Provider value={value}>
      {children}
    </SupervisorContext.Provider>
  );
};

export const useSupervisor = () => {
  const context = useContext(SupervisorContext);
  if (!context) {
    throw new Error("useSupervisor must be used within a SupervisorProvider");
  }
  return context;
};
