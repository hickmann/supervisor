import { useEffect, useState, useCallback, useRef } from "react";
import { useWindowResize, useGlobalShortcuts } from ".";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useApp } from "@/contexts";
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
import { shouldUsePluelyAPI } from "@/lib/functions/pluely.api";
import { Message } from "@/types/completion";

// Importar tipos do arquivo de tipos
import { ChatMessage, ChatConversation } from "@/types/completion";

export type useSystemAudioType = ReturnType<typeof useSystemAudio>;

// Helper function to validate VOSK transcription
function isValidTranscription(transcription: string): boolean {
  if (!transcription || transcription.trim().length === 0) {
    return false;
  }
  
  // Check for common VOSK error patterns
  const errorPatterns = [
    /VOSK.*Error/i,
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
  
  // Check minimum length (at least 3 characters)
  if (transcription.trim().length < 3) {
    return false;
  }
  
  // Check if it's just noise or repeated characters
  const cleanText = transcription.trim().toLowerCase();
  if (/^(.)\1{2,}$/.test(cleanText)) { // repeated single character
    return false;
  }
  
  return true;
}

// Helper function to transcribe audio with VOSK
async function transcribeWithVosk(audioBase64: string): Promise<string> {
  console.log("🎤 VOSK Frontend: Starting transcription...");
  console.log("📊 VOSK Frontend: Audio data length:", audioBase64.length);
  console.log("📊 VOSK Frontend: Audio data preview:", audioBase64.substring(0, 50) + "...");
  
  try {
    console.log("📡 VOSK Frontend: Calling Tauri command...");
    const response = await invoke<{
      success: boolean;
      transcription?: string;
      error?: string;
    }>("transcribe_audio_with_vosk", {
      audioBase64,
      modelName: "vosk-model-small-pt-0.3",
    });

    console.log("📥 VOSK Frontend: Response received:", response);

            if (response.success && response.transcription) {
              console.log("✅ VOSK Frontend: Transcription successful!");
              console.log("📝 VOSK Frontend: TRANSCRIBED TEXT:", response.transcription);
              console.log("📝 VOSK Frontend: Text length:", response.transcription.length, "characters");
              console.log("📝 VOSK Frontend: Text preview:", response.transcription.substring(0, 100) + (response.transcription.length > 100 ? "..." : ""));
              return response.transcription;
            } else {
              console.warn("⚠️ VOSK Frontend: Transcription failed:", response.error);
              return response.error || "VOSK transcription failed";
            }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ VOSK Frontend: Error:", errorMessage);
    return `VOSK STT Error: ${errorMessage}`;
  }
}

// Prompt específico para supervisão psicológica
const PSYCHOLOGICAL_SUPERVISION_PROMPT = `Você é um supervisor experiente de psicólogos clínicos. Sua função é analisar as falas do terapeuta durante atendimentos e fornecer orientações construtivas.

Analise cada fala do TERAPEUTA considerando:

🔍 **AVALIAÇÃO TÉCNICA:**
- Adequação teórica e técnica da intervenção
- Uso apropriado de técnicas terapêuticas
- Manejo do setting terapêutico

🤝 **ASPECTOS RELACIONAIS:**
- Nível de empatia demonstrado
- Qualidade da escuta e acolhimento
- Estabelecimento de rapport

⚖️ **QUESTÕES ÉTICAS:**
- Respeito aos princípios éticos da psicologia
- Manutenção de limites profissionais apropriados
- Proteção ao bem-estar do paciente

📚 **SUGESTÕES PSICOEDUCACIONAIS:**
- Conceitos relevantes para a situação
- Técnicas que podem ser úteis
- Material de apoio ou reflexões teóricas

💡 **RECOMENDAÇÕES:**
- Melhorias na abordagem
- Técnicas alternativas
- Pontos de atenção para próximas sessões

Formate sua resposta de forma clara e construtiva, sempre mantendo um tom respeitoso e educativo. Seja específico em suas sugestões e explique o "porquê" por trás de cada recomendação.`;

export function useSystemAudio() {
  const { resizeWindow } = useWindowResize();
  const globalShortcuts = useGlobalShortcuts();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
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

  // Estado para controlar quando processar supervisão
  const [pendingTerapeutaMessage, setPendingTerapeutaMessage] = useState<string>("");

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

      // Não forçar abertura do popover - apenas processar se já estiver ativo

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

      // Salvar como mensagem do TERAPEUTA no chat
      const terapeutaMessage: ChatMessage = {
        id: `msg_${Date.now()}_terapeuta`,
        role: "terapeuta" as const,
        content: transcription,
        timestamp: Date.now(),
      };

      setConversation((prev) => ({
        ...prev,
        messages: [terapeutaMessage, ...prev.messages],
        updatedAt: Date.now(),
        title: prev.title || `Sessão ${new Date().toLocaleDateString()}`,
      }));

      // Marcar para processar supervisão
      setPendingTerapeutaMessage(transcription);
    },
    []
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
              // Use VOSK for transcription
              console.log("🎤 System Audio: Calling transcribeWithVosk...");
              const transcription = await transcribeWithVosk(base64Audio);

              // Validate transcription before processing
              if (isValidTranscription(transcription)) {
                console.log("🎯 System Audio: Valid transcription from PACIENTE:", transcription);
                console.log("🎯 System Audio: Transcription length:", transcription.length, "characters");
                
                setLastPacienteTranscription(transcription);
                setLastTranscription(transcription);
                setError("");

                // Salvar como mensagem do PACIENTE no chat
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

  const handleQuickActionClick = async (action: string) => {
    setLastTranscription(action); // Show the action as if it were a transcription
    setError("");

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

        const usePluelyAPI = await shouldUsePluelyAPI();
        if (!selectedAIProvider.provider && !usePluelyAPI) {
          setError("No AI provider selected.");
          return;
        }

        const provider = allAiProviders.find(
          (p) => p.id === selectedAIProvider.provider
        );
        if (!provider && !usePluelyAPI) {
          setError("AI provider config not found.");
          return;
        }

        try {
          for await (const chunk of fetchAIResponse({
            provider: usePluelyAPI ? undefined : provider,
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

        if (fullResponse) {
          // Apenas salvar a resposta do supervisor (assistant)
          const supervisorMessage: ChatMessage = {
            id: `msg_${Date.now()}_assistant`,
            role: "assistant" as const,
            content: fullResponse,
            timestamp: Date.now(),
          };

          setConversation((prev) => ({
            ...prev,
            messages: [supervisorMessage, ...prev.messages],
            updatedAt: Date.now(),
          }));
        }
      } catch (err) {
        setError("Failed to get AI response");
      } finally {
        setIsAIProcessing(false);
      }
    },
    [selectedAIProvider, allAiProviders, conversation.messages]
  );

  // UseEffect para processar supervisão quando nova mensagem do terapeuta for adicionada
  useEffect(() => {
    if (pendingTerapeutaMessage && conversation.messages.length > 0) {
      const latestMessage = conversation.messages[0];
      if (latestMessage.role === "terapeuta" && latestMessage.content === pendingTerapeutaMessage) {
        // Processar supervisão
        const previousMessages = conversation.messages.slice(1).map((msg) => {
          return { role: msg.role, content: msg.content };
        });

        processWithAI(
          pendingTerapeutaMessage,
          PSYCHOLOGICAL_SUPERVISION_PROMPT,
          previousMessages
        );

        setPendingTerapeutaMessage(""); // Limpar pending
      }
    }
  }, [conversation.messages, pendingTerapeutaMessage, processWithAI]);

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
    const shouldOpenPopover =
      capturing ||
      setupRequired ||
      isAIProcessing ||
      !!lastAIResponse ||
      !!lastPacienteTranscription ||
      !!error;
    setIsPopoverOpen(shouldOpenPopover);
    resizeWindow(shouldOpenPopover);
  }, [
    capturing,
    setupRequired,
    isAIProcessing,
    lastAIResponse,
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
  }, [startCapture, stopCapture]);

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
  };
}
