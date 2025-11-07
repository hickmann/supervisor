import { ChatConversation } from "@/types";
import { Button } from "../ui";
import {
  CopyIcon,
  CheckIcon,
} from "lucide-react";
import { QuickActions } from "./QuickActions";
import { useSupervisor } from "@/contexts";
import { useEffect, useState } from "react";

type Props = {
  lastAIResponse: string;
  isAIProcessing: boolean;
  conversation: ChatConversation;
  quickActions: string[];
  addQuickAction: (action: string) => void;
  removeQuickAction: (action: string) => void;
  isManagingQuickActions: boolean;
  setIsManagingQuickActions: (isManaging: boolean) => void;
  showQuickActions: boolean;
  setShowQuickActions: (show: boolean) => void;
  handleQuickActionClick: (action: string) => void;
  // Novos props para supervisão psicológica
  lastTerapeutaTranscription?: string;
  lastPacienteTranscription?: string;
};

export const OperationSection = ({
  lastAIResponse,
  isAIProcessing,
  conversation,
  quickActions,
  addQuickAction,
  removeQuickAction,
  isManagingQuickActions,
  setIsManagingQuickActions,
  showQuickActions,
  setShowQuickActions,
  handleQuickActionClick,
  lastTerapeutaTranscription,
  lastPacienteTranscription,
}: Props) => {
  const { selectItem, assistentClinicoData, conversationBuffer, isGeneratingSessionSummary, isGeneratingTasksAgreements, error, setError } = useSupervisor();
  const [isCopied, setIsCopied] = useState(false);
  
  // Auto-dismiss do erro após 5 segundos
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [error, setError]);
  
  // Função para copiar toda a transcrição
  const copyTranscription = async () => {
    try {
      console.log('📋 Copy: Iniciando cópia da transcrição...');
      console.log('📋 Copy: Total de mensagens:', conversation.messages.length);
      
      if (conversation.messages.length === 0) {
        console.warn('⚠️ Copy: Nenhuma mensagem para copiar');
        return;
      }
      
      const allMessages = conversation.messages
        .sort((a, b) => a.timestamp - b.timestamp) // Ordem cronológica
        .map(msg => {
          const role = msg.role === 'terapeuta' ? 'TERAPEUTA' : 
                      msg.role === 'paciente' ? 'PACIENTE' : 'SISTEMA';
          return `${role}: ${msg.content}`;
        })
        .join('\n\n');
      
      console.log('📋 Copy: Texto formatado:', allMessages.substring(0, 100) + '...');
      
      await navigator.clipboard.writeText(allMessages);
      console.log('✅ Copy: Transcrição copiada com sucesso!');
      
      // Mostrar feedback visual
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('❌ Copy: Erro ao copiar transcrição:', err);
      alert('Erro ao copiar transcrição. Por favor, tente novamente.');
    }
  };

  // Função para mostrar transcrições (abre como os botões de supervisão)
  const showTranscriptions = () => {
    // Usar o sistema de seleção do supervisor para mostrar as transcrições
    selectItem('transcriptions');
  };

  
  // Função para verificar se a resposta é genérica
  const isGenericResponse = (response: string): boolean => {
    if (!response) return false;
    
    const genericPatterns = [
      /nenhuma recomendação específica/i,
      /não foi identificada/i,
      /não há recomendações/i,
      /não foram identificadas/i,
      /sem recomendações específicas/i,
      /não foram encontradas/i,
      /não há orientações específicas/i,
      /não foram detectadas/i,
      /sem orientações específicas/i,
      /não foram observadas/i,
      /sem sugestões específicas/i,
      /não foram identificados pontos/i,
      /não há pontos específicos/i,
      /sem pontos específicos/i,
      /não foram detectados pontos/i
    ];
    
    return genericPatterns.some(pattern => pattern.test(response));
  };
  
  // Verificar se há conteúdo para mostrar - agora incluindo assistente clínico
  const hasContent = (lastAIResponse && !isGenericResponse(lastAIResponse)) || 
                     isAIProcessing || 
                     conversation.messages.length > 0 || 
                     assistentClinicoData || 
                     conversationBuffer.length > 0;

  // Se não há conteúdo, não renderiza nada
  if (!hasContent) {
    return null;
  }

  return (
    <div className="space-y-4 p-4">
      {/* Notificação de Erro */}
      {error && (
        <div className="bg-red-50/90 backdrop-blur-sm border border-red-200/50 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-red-500 text-lg">⚠️</div>
              <div>
                <h4 className="text-sm font-semibold text-red-800">Erro na API</h4>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700 hover:bg-red-100/50 transition-colors duration-200"
            >
              ✕
            </Button>
          </div>
        </div>
      )}

      {/* Header com Percepções e botões */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white tracking-tight">✨ Percepções</h2>
        <div className="flex items-center gap-3">
          {conversation.messages.length > 0 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={showTranscriptions}
                className="flex items-center gap-2 bg-white/60 hover:bg-white/80 border-slate-200/50 text-slate-700 hover:text-slate-900 transition-all duration-200 rounded-lg"
              >
                Mostrar transcrição
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={copyTranscription}
                className={`flex items-center gap-2 border-slate-200/50 transition-all duration-200 rounded-lg ${
                  isCopied 
                    ? 'bg-green-100 hover:bg-green-200 text-green-700' 
                    : 'bg-white/60 hover:bg-white/80 text-slate-700 hover:text-slate-900'
                }`}
                title={isCopied ? "Transcrição copiada!" : "Copiar transcrição completa"}
              >
                {isCopied ? (
                  <CheckIcon className="h-4 w-4" />
                ) : (
                  <CopyIcon className="h-4 w-4" />
                )}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Seção do Assistente Clínico - abaixo de Percepções */}
      {assistentClinicoData && (
        <div className="space-y-4">
          {/* Tópico Principal */}
          <div className="bg-white/70 backdrop-blur-sm border border-purple-200/30 rounded-xl p-4 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 tracking-tight">
              {assistentClinicoData.topico}
            </h3>
            
            {/* Resumo em bullets */}
            {assistentClinicoData.resumo && assistentClinicoData.resumo.length > 0 && (
              <div className="space-y-3">
                {assistentClinicoData.resumo.map((item, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <span className="text-purple-500 text-sm font-medium mt-1">•</span>
                    <p className="text-sm text-slate-700 leading-relaxed font-normal">{item}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Botões de Ação */}
          <div className="space-y-2">
            {/* Botão 1: Conceito/Definição */}
            {assistentClinicoData.conceito_definicao?.termo && (
              <Button
                variant="outline"
                className="w-full h-auto p-3 flex flex-row items-center justify-between bg-white/60 hover:bg-white/80 border-slate-200/50 hover:border-blue-300/50 transition-all duration-200 rounded-lg group"
                onClick={() => selectItem('conceito_definicao')}
              >
                <div className="flex items-center gap-2 flex-1">
                  <span className="font-semibold text-sm text-slate-800 group-hover:text-blue-700 transition-colors duration-200">
                    📖 {assistentClinicoData.conceito_definicao.termo}
                  </span>
                </div>
                <p className="text-xs text-slate-600 text-right line-clamp-1 leading-relaxed ml-2">
                  {assistentClinicoData.conceito_definicao.definicao?.substring(0, 60)}...
                </p>
              </Button>
            )}

            {/* Botão 2: Pergunta e Resposta */}
            {assistentClinicoData.pergunta_e_resposta?.pergunta && (
              <Button
                variant="outline"
                className="w-full h-auto p-3 flex flex-row items-center justify-start bg-white/60 hover:bg-white/80 border-slate-200/50 hover:border-green-300/50 transition-all duration-200 rounded-lg group"
                onClick={() => selectItem('pergunta_resposta')}
              >
                <div className="flex items-center gap-2 flex-1">
                  <span className="font-semibold text-sm text-slate-800 group-hover:text-green-700 transition-colors duration-200">
                    ❓ {assistentClinicoData.pergunta_e_resposta.pergunta}
                  </span>
                </div>
              </Button>
            )}

            {/* Botão 3: Perguntas Exploratórias */}
            {assistentClinicoData.perguntas_exploratorias && (
              <Button
                variant="outline"
                className="w-full h-auto p-3 flex flex-row items-center justify-between bg-white/60 hover:bg-white/80 border-slate-200/50 hover:border-orange-300/50 transition-all duration-200 rounded-lg group"
                onClick={() => selectItem('perguntas_exploratorias')}
              >
                <div className="flex items-center gap-2 flex-1">
                  <span className="font-semibold text-sm text-slate-800 group-hover:text-orange-700 transition-colors duration-200">
                    💬 Perguntas exploratórias
                  </span>
                </div>
                <p className="text-xs text-slate-600 text-right leading-relaxed ml-2">
                  {assistentClinicoData.perguntas_exploratorias.length} sugestões
                </p>
              </Button>
            )}

            {/* Botão 4: Próximas Falas */}
            {assistentClinicoData.proximas_falas && (
              <Button
                variant="outline"
                className="w-full h-auto p-3 flex flex-row items-center justify-between bg-white/60 hover:bg-white/80 border-slate-200/50 hover:border-purple-300/50 transition-all duration-200 rounded-lg group"
                onClick={() => selectItem('proximas_falas')}
              >
                <div className="flex items-center gap-2 flex-1">
                  <span className="font-semibold text-sm text-slate-800 group-hover:text-purple-700 transition-colors duration-200">
                    ✨ O que eu deveria falar depois?
                  </span>
                </div>
                <p className="text-xs text-slate-600 text-right leading-relaxed ml-2">
                  {assistentClinicoData.proximas_falas.length} sugestões
                </p>
              </Button>
            )}

            {/* Botão 5: Checagem de Fatos */}
            {assistentClinicoData.checagem_fatos && assistentClinicoData.checagem_fatos.length > 0 && (
              <Button
                variant="outline"
                className="w-full h-auto p-3 flex flex-row items-center justify-between bg-white/60 hover:bg-white/80 border-slate-200/50 hover:border-yellow-300/50 transition-all duration-200 rounded-lg group"
                onClick={() => selectItem('checagem_fatos')}
              >
                <div className="flex items-center gap-2 flex-1">
                  <span className="font-semibold text-sm text-slate-800 group-hover:text-yellow-700 transition-colors duration-200">
                    ✔️ {assistentClinicoData.checagem_fatos[0].afirmacao.substring(0, 30)}...
                  </span>
                </div>
                <p className="text-xs text-slate-600 text-right leading-relaxed ml-2">
                  Verificação disponível
                </p>
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Quick Actions - movido para o final */}
      {(lastTerapeutaTranscription || lastPacienteTranscription || lastAIResponse || isAIProcessing) && (
        <div className="bg-white/60 backdrop-blur-sm border border-slate-200/30 rounded-xl p-3 shadow-sm">
          <QuickActions
            actions={quickActions}
            onActionClick={handleQuickActionClick}
            onAddAction={addQuickAction}
            onRemoveAction={removeQuickAction}
            isManaging={isManagingQuickActions}
            setIsManaging={setIsManagingQuickActions}
            show={showQuickActions}
            setShow={setShowQuickActions}
            isGeneratingSessionSummary={isGeneratingSessionSummary}
            isGeneratingTasksAgreements={isGeneratingTasksAgreements}
          />
        </div>
      )}
    </div>
  );
};
