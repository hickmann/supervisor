import { useEffect, useState, useCallback, useRef } from "react";
import { useWindowResize, useGlobalShortcuts } from ".";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useApp } from "@/contexts";
import { useSupervisor } from "@/contexts";
import { fetchAIResponse } from "@/lib/functions";
import {
  DEFAULT_QUICK_ACTIONS,
  DEFAULT_SYSTEM_PROMPT,
  STORAGE_KEYS,
} from "@/config";
import {
  generateConversationTitle,
  safeLocalStorage,
  saveConversation,
} from "@/lib";
import { shouldUseCoterapiaAPI } from "@/lib/functions/coterapia.api";
import { Message } from "@/types/completion";

// Importar tipos do arquivo de tipos
import { ChatMessage, ChatConversation } from "@/types/completion";

export type useSystemAudioType = ReturnType<typeof useSystemAudio>;

// Helper function to validate Whisper transcription
function isValidTranscription(transcription: string): boolean {
  if (!transcription || transcription.trim().length === 0) {
    return false;
  }
  
  // Check for common Whisper error patterns
  const errorPatterns = [
    /WHISPER.*Error/i,
    /transcription failed/i,
    /^error:/i,
    /failed to process/i,
    /STT Error/i
  ];
  
  for (const pattern of errorPatterns) {
    if (pattern.test(transcription)) {
      return false;
    }
  }
  
  // Check minimum length (at least 12 characters)
  if (transcription.trim().length < 12) {
    return false;
  }
  
  // Check if it's just noise or repeated characters
  const cleanText = transcription.trim().toLowerCase();
  if (/^(.)\1{2,}$/.test(cleanText)) { // repeated single character
    return false;
  }
  
  // Filter out background noise and non-speech sounds in brackets
  const backgroundNoisePatterns = [
    /^\[.*\]$/, // Only brackets content like [MÚSICA DE FUNDO], [GRITOS DE GOL]
    /^\[.*\]\s*$/, // Brackets content with trailing spaces
    /\[música de fundo\]/i,
    /\[gritos de gol\]/i,
    /\[aplausos\]/i,
    /\[ruído\]/i,
    /\[barulho\]/i,
    /\[som\]/i,
    /\[música\]/i,
    /\[canto\]/i,
    /\[gritos\]/i,
    /\[aplauso\]/i,
    /\[background music\]/i,
    /\[crowd noise\]/i,
    /\[applause\]/i,
    /\[cheering\]/i
  ];
  
  for (const pattern of backgroundNoisePatterns) {
    if (pattern.test(cleanText)) {
      return false;
    }
  }
  
  return true;
}

// Helper function to transcribe audio with Whisper
async function transcribeWithWhisper(audioBase64: string): Promise<string> {
  console.log("🎤 WHISPER Frontend: Starting transcription...");
  console.log("📊 WHISPER Frontend: Audio data length:", audioBase64.length);
  console.log("📊 WHISPER Frontend: Audio data preview:", audioBase64.substring(0, 50) + "...");
  
  try {
    console.log("📡 WHISPER Frontend: Calling Tauri command...");
    const response = await invoke<{
      success: boolean;
      transcription?: string;
      error?: string;
      segments?: Array<{
        id: number;
        seek: number;
        start: number;
        end: number;
        text: string;
        tokens: number[];
        temperature: number;
        avg_logprob: number;
        compression_ratio: number;
        no_speech_prob: number;
      }>;
    }>("transcribe_audio_with_whisper", {
      audioBase64,
    });

    console.log("📥 WHISPER Frontend: Response received:", response);

    if (response.success && response.transcription) {
      console.log("✅ WHISPER Frontend: Transcription successful!");
      console.log("📝 WHISPER Frontend: TRANSCRIBED TEXT:", response.transcription);
      console.log("📝 WHISPER Frontend: Text length:", response.transcription.length, "characters");
      console.log("📝 WHISPER Frontend: Text preview:", response.transcription.substring(0, 100) + (response.transcription.length > 100 ? "..." : ""));
      
      if (response.segments && response.segments.length > 0) {
        console.log("📊 WHISPER Frontend: Segments received:", response.segments.length);
        response.segments.forEach((segment, index) => {
          console.log(`📊 WHISPER Frontend: Segment ${index}: ${segment.start}s-${segment.end}s: "${segment.text}"`);
        });
      }
      
      return response.transcription;
    } else {
      console.warn("⚠️ WHISPER Frontend: Transcription failed:", response.error);
      return response.error || "WHISPER transcription failed";
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ WHISPER Frontend: Error:", errorMessage);
    return `WHISPER STT Error: ${errorMessage}`;
  }
}

// Código removido: supervisão agora é feita pelo assistente clínico

export function useSystemAudio() {
  const { resizeWindow } = useWindowResize();
  const globalShortcuts = useGlobalShortcuts();
  const { addToConversationBuffer, generateSessionSummary, generateTasksAgreements, selectItem, sendToAssistentClinico, conversationBuffer, sessionSummaryData, tasksAgreementsData } = useSupervisor();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [recordingTime, setRecordingTime] = useState("00:00");
  const [isProcessing, setIsProcessing] = useState(false);
  const recordingStartTimeRef = useRef<number | null>(null);
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [lastTranscription, setLastTranscription] = useState<string>("");
  const [lastAIResponse, setLastAIResponse] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [setupRequired, setSetupRequired] = useState<boolean>(false);
  const [quickActions, setQuickActions] = useState<string[]>([]);
  const [isManagingQuickActions, setIsManagingQuickActions] =
    useState<boolean>(false);
  const [showQuickActions, setShowQuickActions] = useState<boolean>(true);
  
  // Estados específicos para supervisão psicológica
  const [lastTerapeutaTranscription, setLastTerapeutaTranscription] = useState<string>("");
  const [lastPacienteTranscription, setLastPacienteTranscription] = useState<string>("");
  const [isMicrophoneListening, setIsMicrophoneListening] = useState<boolean>(false);
  const [shouldActivateVAD, setShouldActivateVAD] = useState<boolean>(false);
  
  // Estados para controlar quando devemos abrir a janela após os dados chegarem
  const [pendingSessionSummaryOpen, setPendingSessionSummaryOpen] = useState<boolean>(false);
  const [pendingTasksAgreementsOpen, setPendingTasksAgreementsOpen] = useState<boolean>(false);

  const [conversation, setConversation] = useState<ChatConversation>({
    id: "",
    title: "",
    messages: [],
    createdAt: 0,
    updatedAt: 0,
  });

  // Context management states
  const [useSystemPrompt, setUseSystemPrompt] = useState<boolean>(true);
  const [contextContent, setContextContent] = useState<string>("");

  const {
    selectedAIProvider,
    allAiProviders,
    systemPrompt,
  } = useApp();
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load context settings from localStorage on mount
  useEffect(() => {
    const savedContext = safeLocalStorage.getItem(
      STORAGE_KEYS.SYSTEM_AUDIO_CONTEXT
    );
    if (savedContext) {
      try {
        const parsed = JSON.parse(savedContext);
        setUseSystemPrompt(parsed.useSystemPrompt ?? true);
        setContextContent(parsed.contextContent ?? "");
      } catch (error) {
        console.error("Failed to load system audio context:", error);
      }
    }
  }, []);

  // Load quick actions from localStorage on mount
  useEffect(() => {
    const savedActions = safeLocalStorage.getItem(
      STORAGE_KEYS.SYSTEM_AUDIO_QUICK_ACTIONS
    );
    if (savedActions) {
      try {
        const parsed = JSON.parse(savedActions);
        setQuickActions(parsed);
      } catch (error) {
        console.error("Failed to load quick actions:", error);
        setQuickActions(DEFAULT_QUICK_ACTIONS);
      }
    } else {
      setQuickActions(DEFAULT_QUICK_ACTIONS);
    }
  }, []);

  // useEffect para abrir janela do resumo da sessão quando dados chegarem
  useEffect(() => {
    if (pendingSessionSummaryOpen && sessionSummaryData?.temas) {
      console.log("✅ SessionSummary: Dados chegaram, abrindo janela automaticamente");
      selectItem('session_summary');
      setPendingSessionSummaryOpen(false);
    }
  }, [sessionSummaryData, pendingSessionSummaryOpen, selectItem]);

  // useEffect para abrir janela de tarefas e acordos quando dados chegarem
  useEffect(() => {
    if (pendingTasksAgreementsOpen && tasksAgreementsData) {
      console.log("✅ TasksAgreements: Dados chegaram, abrindo janela automaticamente");
      selectItem('tasks_agreements');
      setPendingTasksAgreementsOpen(false);
    }
  }, [tasksAgreementsData, pendingTasksAgreementsOpen, selectItem]);

  // Função para processar transcrição do microfone (TERAPEUTA)
  const processMicrophoneTranscription = useCallback(
    async (transcription: string) => {
      if (!isValidTranscription(transcription)) {
        console.warn("⚠️ Microphone: Invalid transcription, not processing:", transcription);
        return;
      }

      console.log("🎤 Microphone: Valid transcription from TERAPEUTA:", transcription);
      setLastTerapeutaTranscription(transcription);
      setLastTranscription(transcription);
      setError("");
      
      console.log("🎤 Microphone: Setting lastTerapeutaTranscription to:", transcription);

      // Inicializar conversa se necessário
      setConversation((prev) => {
        // Se não há conversa ativa, criar uma nova
        if (!prev.id) {
          const conversationId = `supervision_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`;
          
          const newConversation = {
            id: conversationId,
            title: `Sessão ${new Date().toLocaleDateString()}`,
            messages: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          
          return newConversation;
        }
        return prev;
      });

      // Salvar como mensagem do TERAPEUTA no chat local
      const terapeutaMessage: ChatMessage = {
        id: `msg_${Date.now()}_terapeuta`,
        role: "terapeuta" as const,
        content: transcription,
        timestamp: Date.now(),
      };

      setConversation((prev) => {
        const newConversation = {
          ...prev,
          messages: [terapeutaMessage, ...prev.messages],
          updatedAt: Date.now(),
          title: prev.title || `Sessão ${new Date().toLocaleDateString()}`,
        };
        console.log("🎤 Microphone: Updated conversation with TERAPEUTA message:", newConversation);
        console.log("🎤 Microphone: Total messages now:", newConversation.messages.length);
        return newConversation;
      });

      // Adicionar ao buffer do assistente clínico (novo fluxo)
      addToConversationBuffer("terapeuta", transcription);
    },
    [addToConversationBuffer]
  );


  // Handle single speech detection event
  useEffect(() => {
    let speechUnlisten: (() => void) | undefined;

    const setupEventListener = async () => {
      try {
        speechUnlisten = await listen("speech-detected", async (event) => {
          try {
            if (!capturing) return;

            const base64Audio = event.payload as string;
            console.log("🎤 System Audio: Speech detected via system audio capture");
            console.log("🎤 System Audio: Audio data length:", base64Audio.length);

            setIsProcessing(true);
            try {
              // Use Whisper for transcription
              console.log("🎤 System Audio: Calling transcribeWithWhisper...");
              const transcription = await transcribeWithWhisper(base64Audio);

              // Validate transcription before processing
              if (isValidTranscription(transcription)) {
                console.log("🎯 System Audio: Valid transcription from PACIENTE:", transcription);
                console.log("🎯 System Audio: Transcription length:", transcription.length, "characters");
                
                setLastPacienteTranscription(transcription);
                setLastTranscription(transcription);
                setError("");

                // Salvar como mensagem do PACIENTE no chat local
                const pacienteMessage: ChatMessage = {
                  id: `msg_${Date.now()}_paciente`,
                  role: "paciente" as const,
                  content: transcription,
                  timestamp: Date.now(),
                };

                setConversation((prev) => ({
                  ...prev,
                  messages: [pacienteMessage, ...prev.messages],
                  updatedAt: Date.now(),
                  title: prev.title || generateConversationTitle(`Sessão ${new Date().toLocaleDateString()}`),
                }));

                // Adicionar ao buffer do assistente clínico (novo fluxo)
                addToConversationBuffer("paciente", transcription);
              } else {
                console.warn("⚠️ System Audio: Invalid transcription, not processing:", transcription);
                setError("Transcrição inválida do áudio do sistema");
              }
            } catch (sttError: any) {
              setError(sttError.message || "Failed to process speech");
              setCapturing(false);
              setIsPopoverOpen(true);
            }
          } catch (err) {
            setError("Failed to process speech");
          } finally {
            setIsProcessing(false);
          }
        });
      } catch (err) {
        setError("Failed to setup speech listener");
      }
    };

    setupEventListener();

    return () => {
      if (speechUnlisten) speechUnlisten();
    };
  }, [
    capturing,
    conversation.messages.length,
    addToConversationBuffer,
  ]);

  // Context management functions
  const saveContextSettings = useCallback(
    (usePrompt: boolean, content: string) => {
      try {
        const contextSettings = {
          useSystemPrompt: usePrompt,
          contextContent: content,
        };
        safeLocalStorage.setItem(
          STORAGE_KEYS.SYSTEM_AUDIO_CONTEXT,
          JSON.stringify(contextSettings)
        );
      } catch (error) {
        console.error("Failed to save context settings:", error);
      }
    },
    []
  );

  const updateUseSystemPrompt = useCallback(
    (value: boolean) => {
      setUseSystemPrompt(value);
      saveContextSettings(value, contextContent);
    },
    [contextContent, saveContextSettings]
  );

  const updateContextContent = useCallback(
    (content: string) => {
      setContextContent(content);
      saveContextSettings(useSystemPrompt, content);
    },
    [useSystemPrompt, saveContextSettings]
  );

  // Quick actions management
  const saveQuickActions = useCallback((actions: string[]) => {
    try {
      safeLocalStorage.setItem(
        STORAGE_KEYS.SYSTEM_AUDIO_QUICK_ACTIONS,
        JSON.stringify(actions)
      );
    } catch (error) {
      console.error("Failed to save quick actions:", error);
    }
  }, []);

  const addQuickAction = useCallback(
    (action: string) => {
      if (action && !quickActions.includes(action)) {
        const newActions = [...quickActions, action];
        setQuickActions(newActions);
        saveQuickActions(newActions);
      }
    },
    [quickActions, saveQuickActions]
  );

  const removeQuickAction = useCallback(
    (action: string) => {
      const newActions = quickActions.filter((a) => a !== action);
      setQuickActions(newActions);
      saveQuickActions(newActions);
    },
    [quickActions, saveQuickActions]
  );

  // Função para enviar falas armazenadas para a IA via atalho
  const handleSendToAI = useCallback(async () => {
    console.log("🚀 SendToAI: Atalho CTRL+G/CMD+G pressionado");
    
    if (conversationBuffer.length === 0) {
      console.warn("⚠️ SendToAI: Nenhuma fala armazenada para enviar");
      setError("Nenhuma fala armazenada para enviar. Grave algumas falas primeiro.");
      return;
    }

    console.log("📊 SendToAI: Enviando", conversationBuffer.length, "falas para a IA");
    console.log("📊 SendToAI: Falas:", conversationBuffer);
    
    try {
      setIsAIProcessing(true);
      setError("");
      
      // Enviar as falas armazenadas para o assistente clínico
      await sendToAssistentClinico(conversationBuffer);
      
      console.log("✅ SendToAI: Falas enviadas com sucesso para a IA");
    } catch (error) {
      console.error("❌ SendToAI: Erro ao enviar falas:", error);
      setError("Erro ao enviar falas para a IA");
    } finally {
      setIsAIProcessing(false);
    }
  }, [conversationBuffer, sendToAssistentClinico]);

  // Função para toggle da visibilidade da janela
  const handleToggleVisibility = useCallback(async () => {
    console.log("🔄 ToggleVisibility: Alternando visibilidade da janela");
    
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("toggle_window_visibility");
      console.log("✅ ToggleVisibility: Visibilidade da janela alterada com sucesso");
    } catch (error) {
      console.error("❌ ToggleVisibility: Erro ao alterar visibilidade:", error);
    }
  }, []);

  const handleQuickActionClick = async (action: string) => {
    setLastTranscription(action); // Show the action as if it were a transcription
    setError("");

    // Verificar se é a ação especial "Recapitular Sessão Completa"
    if (action === "Recapitular Sessão Completa") {
      console.log("🔄 SessionSummary: Verificando mensagens disponíveis...");
      console.log("📊 SessionSummary: conversation.messages.length:", conversation.messages.length);
      console.log("📊 SessionSummary: conversation.messages:", conversation.messages);
      
      // Aguardar um pequeno delay para garantir que o estado seja atualizado
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (conversation.messages.length === 0) {
        console.warn("⚠️ SessionSummary: Nenhuma mensagem na conversa para resumir");
        setError("Nenhuma mensagem na conversa para resumir. Certifique-se de que há transcrições disponíveis.");
        return;
      }

      // Converter mensagens da conversa para o formato esperado
      const conversationHistory = conversation.messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp
      }));

      // Verificar se há conteúdo suficiente (pelo menos 50 caracteres)
      const totalContent = conversationHistory
        .map(msg => msg.content)
        .join(' ')
        .trim();
      
      console.log("📊 SessionSummary: Total content length:", totalContent.length);
      console.log("📊 SessionSummary: Total content preview:", totalContent.substring(0, 100) + "...");
      
      if (totalContent.length < 50) {
        console.warn("⚠️ SessionSummary: Conteúdo insuficiente para resumir (menos de 50 caracteres)");
        setError(`Conteúdo insuficiente para resumir. Necessário pelo menos 50 caracteres, mas encontrado apenas ${totalContent.length}.`);
        return;
      }

      console.log("🔄 SessionSummary: Iniciando geração de resumo da sessão via quick action...");
      console.log("📊 SessionSummary: conversationHistory:", conversationHistory);
      
      // Marcar que queremos abrir a janela quando os dados chegarem
      setPendingSessionSummaryOpen(true);
      
      // Aguardar a geração do resumo e verificar se foi bem-sucedida
      const success = await generateSessionSummary(conversationHistory);
      
      if (success) {
        console.log("✅ SessionSummary: Resumo gerado com sucesso, aguardando dados para abrir janela...");
        // A janela será aberta automaticamente pelo useEffect quando os dados chegarem
      } else {
        console.log("❌ SessionSummary: Falha ao gerar resumo, não abrindo janela");
        setPendingSessionSummaryOpen(false); // Cancelar abertura da janela
        // O erro já foi definido na função generateSessionSummary
      }
      
      return;
    }

    // Verificar se é a ação especial "Tarefas e Combinados"
    if (action === "Tarefas e Combinados") {
      console.log("🔄 TasksAgreements: Verificando mensagens disponíveis...");
      console.log("📊 TasksAgreements: conversation.messages.length:", conversation.messages.length);
      console.log("📊 TasksAgreements: conversation.messages:", conversation.messages);
      
      // Aguardar um pequeno delay para garantir que o estado seja atualizado
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (conversation.messages.length === 0) {
        console.warn("⚠️ TasksAgreements: Nenhuma mensagem na conversa para extrair tarefas");
        setError("Nenhuma mensagem na conversa para extrair tarefas e acordos. Certifique-se de que há transcrições disponíveis.");
        return;
      }

      // Converter mensagens da conversa para o formato esperado
      const conversationHistory = conversation.messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp
      }));

      // Verificar se há conteúdo suficiente (pelo menos 50 caracteres)
      const totalContent = conversationHistory
        .map(msg => msg.content)
        .join(' ')
        .trim();
      
      console.log("📊 TasksAgreements: Total content length:", totalContent.length);
      console.log("📊 TasksAgreements: Total content preview:", totalContent.substring(0, 100) + "...");
      
      if (totalContent.length < 50) {
        console.warn("⚠️ TasksAgreements: Conteúdo insuficiente para extrair tarefas (menos de 50 caracteres)");
        setError(`Conteúdo insuficiente para extrair tarefas. Necessário pelo menos 50 caracteres, mas encontrado apenas ${totalContent.length}.`);
        return;
      }

      console.log("🔄 TasksAgreements: Iniciando extração de tarefas e acordos via quick action...");
      console.log("📊 TasksAgreements: conversationHistory:", conversationHistory);
      
      // Marcar que queremos abrir a janela quando os dados chegarem
      setPendingTasksAgreementsOpen(true);
      
      // Aguardar a extração de tarefas e acordos e verificar se foi bem-sucedida
      const success = await generateTasksAgreements(conversationHistory);
      
      if (success) {
        console.log("✅ TasksAgreements: Tarefas e acordos extraídos com sucesso, aguardando dados para abrir janela...");
        // A janela será aberta automaticamente pelo useEffect quando os dados chegarem
      } else {
        console.log("❌ TasksAgreements: Falha ao extrair tarefas, não abrindo janela");
        setPendingTasksAgreementsOpen(false); // Cancelar abertura da janela
        // O erro já foi definido na função generateTasksAgreements
      }
      
      return;
    }

    const effectiveSystemPrompt = useSystemPrompt
      ? systemPrompt || DEFAULT_SYSTEM_PROMPT
      : contextContent || DEFAULT_SYSTEM_PROMPT;

    const previousMessages = conversation.messages.map((msg) => {
      return { role: msg.role, content: msg.content };
    });

    await processWithAI(action, effectiveSystemPrompt, previousMessages);
  };

  // AI Processing function
  const processWithAI = useCallback(
    async (
      transcription: string,
      prompt: string,
      previousMessages: Message[]
    ) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      try {
        setIsAIProcessing(true);
        setLastAIResponse("");
        setError("");

        let fullResponse = "";

        const useCoterapiaAPI = await shouldUseCoterapiaAPI();
        if (!selectedAIProvider.provider && !useCoterapiaAPI) {
          setError("No AI provider selected.");
          return;
        }

        const provider = allAiProviders.find(
          (p) => p.id === selectedAIProvider.provider
        );
        if (!provider && !useCoterapiaAPI) {
          setError("AI provider config not found.");
          return;
        }

        try {
          for await (const chunk of fetchAIResponse({
            provider: useCoterapiaAPI ? undefined : provider,
            selectedProvider: selectedAIProvider,
            systemPrompt: prompt,
            history: previousMessages,
            userMessage: transcription,
            imagesBase64: [],
          })) {
            fullResponse += chunk;
            setLastAIResponse((prev) => prev + chunk);
          }
        } catch (aiError: any) {
          setError(aiError.message || "Failed to get AI response");
        }

        // Não salvar respostas do Gemini no histórico da sessão
        // Apenas paciente e terapeuta são salvos no histórico
      } catch (err) {
        setError("Failed to get AI response");
      } finally {
        setIsAIProcessing(false);
      }
    },
    [selectedAIProvider, allAiProviders, conversation.messages]
  );

  // Código removido: supervisão agora é feita pelo assistente clínico

  const startCapture = useCallback(async () => {
    try {
      setError("");

      const hasAccess = await invoke<boolean>("check_system_audio_access");
      if (!hasAccess) {
        setSetupRequired(true);
        return;
      }

      await invoke<string>("stop_system_audio_capture");

      await invoke<string>("start_system_audio_capture");
      setCapturing(true);

      // NÃO ativar VAD interno - usar apenas o VAD do Sistema 1 (Completion)
      // setShouldActivateVAD(true);
      // setIsMicrophoneListening(true);
      console.log("🎯 System Audio: Sistema 2 VAD desabilitado - usando apenas Sistema 1 VAD");

      const conversationId = `sysaudio_conv_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      setConversation({
        id: conversationId,
        title: "",
        messages: [],
        createdAt: 0,
        updatedAt: 0,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
    }
  }, []);

  const stopCapture = useCallback(async () => {
    try {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }

      setCapturing(false);
      setIsProcessing(false);
      setIsAIProcessing(false);

      // VAD do Sistema 2 já está desabilitado - não precisa desativar
      // setShouldActivateVAD(false);
      // setIsMicrophoneListening(false);
      console.log("🎯 System Audio: Parando captura - VAD do Sistema 1 continua independente");

      await invoke<string>("stop_system_audio_capture");

      setLastTranscription("");
      setLastAIResponse("");
      setLastTerapeutaTranscription("");
      setLastPacienteTranscription("");
      setError("");

      window.location.reload();
    } catch (err) {
      setError("Failed to stop capture");
    }
  }, []);

  const handleSetup = useCallback(async () => {
    try {
      const platform = navigator.platform.toLowerCase();

      if (platform.includes("mac") || platform.includes("win")) {
        await invoke("request_system_audio_access");
      }

      // Delay to give the user time to grant permissions in the system dialog.
      await new Promise((resolve) => setTimeout(resolve, 3000));

      const hasAccess = await invoke<boolean>("check_system_audio_access");
      if (hasAccess) {
        setSetupRequired(false);
        await startCapture();
      } else {
        setSetupRequired(true);
        setError("Permission not granted. Please try the manual steps.");
      }
    } catch (err) {
      setError("Failed to request access. Please try the manual steps below.");
      setSetupRequired(true);
    }
  }, [startCapture]);

  useEffect(() => {
    // Só abrir o popover quando há conteúdo real para mostrar
    const hasRealContent = 
      (lastAIResponse && lastAIResponse !== "NO_CONTENT_204") || // Resposta válida do Gemini
      conversation.messages.length > 0 || // Há transcrições na conversa
      isAIProcessing; // Está processando
    
    const shouldOpenPopover =
      capturing ||
      setupRequired ||
      hasRealContent ||
      !!error;
    setIsPopoverOpen(shouldOpenPopover);
    
    // Usar setTimeout para garantir que o redimensionamento aconteça após o estado ser atualizado
    setTimeout(() => {
      resizeWindow(shouldOpenPopover);
    }, 0);
    
    console.log("🎯 SystemAudio: Popover should open?", shouldOpenPopover, {
      capturing,
      setupRequired,
      isAIProcessing,
      lastAIResponse: !!lastAIResponse,
      lastTerapeutaTranscription: !!lastTerapeutaTranscription,
      lastPacienteTranscription: !!lastPacienteTranscription,
      error: !!error
    });
  }, [
    capturing,
    setupRequired,
    isAIProcessing,
    lastAIResponse,
    lastTerapeutaTranscription,
    lastPacienteTranscription,
    error,
    resizeWindow,
  ]);

  useEffect(() => {
    globalShortcuts.registerSystemAudioCallback(async () => {
      if (capturing) {
        await stopCapture();
      } else {
        await startCapture();
      }
    });

    globalShortcuts.registerSendToAICallback(handleSendToAI);
    
    globalShortcuts.registerToggleVisibilityCallback(handleToggleVisibility);
  }, [startCapture, stopCapture, handleSendToAI, handleToggleVisibility]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      invoke("stop_system_audio_capture").catch(() => {});
    };
  }, []);

  useEffect(() => {
    saveConversation(conversation);
  }, [conversation.messages.length, conversation.title, conversation.id]);

  // Timer para contador de gravação
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (capturing) {
      recordingStartTimeRef.current = Date.now();
      intervalId = setInterval(() => {
        if (recordingStartTimeRef.current) {
          const elapsed = Math.floor((Date.now() - recordingStartTimeRef.current) / 1000);
          const minutes = Math.floor(elapsed / 60);
          const seconds = elapsed % 60;
          setRecordingTime(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        }
      }, 1000);
    } else {
      setRecordingTime("00:00");
      recordingStartTimeRef.current = null;
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [capturing]);

  const startNewConversation = useCallback(() => {
    setConversation({
      id: `sysaudio_conv_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`,
      title: "",
      messages: [],
      createdAt: 0,
      updatedAt: 0,
    });
    setLastTranscription("");
    setLastAIResponse("");
    setError("");
    setSetupRequired(false);
    setIsProcessing(false);
    setIsAIProcessing(false);
    setIsPopoverOpen(false);
    setUseSystemPrompt(true);
  }, []);

  return {
    capturing,
    recordingTime,
    isProcessing,
    isAIProcessing,
    lastTranscription,
    lastAIResponse,
    error,
    setupRequired,
    startCapture,
    stopCapture,
    handleSetup,
    isPopoverOpen,
    setIsPopoverOpen,
    // Conversation management
    conversation,
    setConversation,
    // AI processing
    processWithAI,
    // Context management
    useSystemPrompt,
    setUseSystemPrompt: updateUseSystemPrompt,
    contextContent,
    setContextContent: updateContextContent,
    startNewConversation,
    // Window resize
    resizeWindow,
    quickActions,
    addQuickAction,
    removeQuickAction,
    isManagingQuickActions,
    setIsManagingQuickActions,
    showQuickActions,
    setShowQuickActions,
    handleQuickActionClick,
    // Supervisão psicológica
    lastTerapeutaTranscription,
    lastPacienteTranscription,
    isMicrophoneListening,
    setIsMicrophoneListening,
    processMicrophoneTranscription,
    shouldActivateVAD,
    setShouldActivateVAD,
    // Callbacks para botões
    handleSendToAI,
    handleToggleVisibility,
  };
}
