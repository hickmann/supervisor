import { UseCompletionReturn } from "@/types";
import { useMicVAD } from "@ricky0123/vad-react";
import { LoaderCircleIcon, MicIcon, MicOffIcon } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Button } from "../ui/button";
import { fetchWhisperSTT } from "@/lib/functions/stt.function";
import { floatArrayToWav } from "@/lib/utils";
import { invoke } from "@tauri-apps/api/core";
import { safeLocalStorage } from "@/lib";
import { STORAGE_KEYS } from "@/config";

// Helper function to log to backend
const logToBackend = async (level: "info" | "warn" | "error", message: string) => {
  try {
    await invoke("log_from_frontend", { level, message });
  } catch (error) {
    // Silently fail if logging fails
  }
};

interface VadOnlyProps {
  setEnableVAD: UseCompletionReturn["setEnableVAD"];
  systemAudio?: any;
}

export const VadOnly = ({
  setEnableVAD,
  systemAudio,
}: VadOnlyProps) => {
  const [, setIsListening] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("default");
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);

  // Carregar dispositivo selecionado do storage
  useEffect(() => {
    const loadDeviceId = () => {
      const savedDeviceId = safeLocalStorage.getItem(STORAGE_KEYS.SELECTED_MICROPHONE_DEVICE_ID);
      if (savedDeviceId && savedDeviceId !== "default") {
        setSelectedDeviceId(savedDeviceId);
        console.log("🎤 VadOnly: Using selected microphone:", savedDeviceId);
      } else {
        setSelectedDeviceId("default"); // "default" = usar padrão do sistema
        console.log("🎤 VadOnly: Using default system microphone");
      }
    };

    loadDeviceId();

    // Escutar mudanças na seleção de microfone
    const handleStorageChange = () => {
      loadDeviceId();
    };

    window.addEventListener("storage", handleStorageChange);
    
    // Custom event para mudanças no mesmo contexto
    window.addEventListener("microphoneDeviceChanged", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("microphoneDeviceChanged", handleStorageChange);
    };
  }, []);

  // Criar o stream de áudio quando o deviceId mudar
  useEffect(() => {
    let currentStream: MediaStream | null = null;

    const createStream = async () => {
      // Fechar stream anterior se existir
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
      }

      try {
        console.log("🎤 VadOnly: Checking microphone permissions...");
        await logToBackend("info", "VadOnly: Checking microphone permissions...");
        
        // Verificar se navigator.mediaDevices está disponível
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          const errorMsg = "navigator.mediaDevices.getUserMedia is not available";
          console.error("❌ VadOnly:", errorMsg);
          await logToBackend("error", `VadOnly: ${errorMsg}`);
          alert("Microfone não disponível neste navegador/contexto");
          return;
        }

        let stream: MediaStream;
        if (selectedDeviceId && selectedDeviceId !== "default") {
          const constraints: MediaStreamConstraints = {
            audio: { deviceId: { exact: selectedDeviceId } },
          };
          console.log("🎤 VadOnly: Creating stream with deviceId:", selectedDeviceId);
          await logToBackend("info", `VadOnly: Creating stream with deviceId: ${selectedDeviceId}`);
          stream = await navigator.mediaDevices.getUserMedia(constraints);
        } else {
          console.log("🎤 VadOnly: Creating stream with default device");
          await logToBackend("info", "VadOnly: Creating stream with default device");
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        }
        
        console.log("✅ VadOnly: Audio stream created successfully");
        console.log("🎤 VadOnly: Stream tracks:", stream.getTracks().length);
        await logToBackend("info", `VadOnly: Audio stream created successfully with ${stream.getTracks().length} tracks`);
        
        currentStream = stream;
        setAudioStream(stream);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error("❌ VadOnly: Failed to create audio stream:", errorMsg);
        console.error("❌ VadOnly: Error details:", error);
        await logToBackend("error", `VadOnly: Failed to create audio stream: ${errorMsg}`);
        
        // Mostrar erro específico para o usuário
        if (errorMsg.includes("Permission denied") || errorMsg.includes("NotAllowedError")) {
          alert("Permissão de microfone negada. Por favor, permita o acesso ao microfone nas configurações do Windows.");
        } else if (errorMsg.includes("NotFoundError")) {
          alert("Microfone não encontrado. Verifique se o microfone está conectado.");
        } else {
          alert(`Erro ao acessar microfone: ${errorMsg}`);
        }
        
        setAudioStream(null);
      }
    };

    createStream();

    // Cleanup quando componente desmontar ou deviceId mudar
    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [selectedDeviceId]);

  const vadOptions: any = {
    userSpeakingThreshold: 0.3, // Reduzido de 0.6 para 0.3 para ser mais sensível
    startOnLoad: false, // Desabilitar auto-start - vamos iniciar manualmente para garantir que funciona
    onSpeechStart: () => {
      console.log("🎤 VadOnly: Speech detected - VAD activated");
      logToBackend("info", "VadOnly: Speech detected - VAD activated");
    },
    onSpeechEnd: async (audio: Float32Array) => {
      console.log("🎤 VadOnly: Fim da fala detectado - VAD", audio.length, "samples");
      await logToBackend("info", `VadOnly: Speech detected - ${audio.length} samples`);
      console.log("🎤 VadOnly: Starting transcription process...");
      await logToBackend("info", "VadOnly: Starting transcription process...");
      
      try {
        // Convert float32array to blob
        console.log("🎤 VadOnly: Converting audio to blob...");
        await logToBackend("info", "VadOnly: Converting audio to blob...");
        const audioBlob = floatArrayToWav(audio, 16000, "wav");
        console.log("🎤 VadOnly: Audio blob created, size:", audioBlob.size, "bytes");
        console.log("🎤 VadOnly: Audio blob type:", audioBlob.type);
        await logToBackend("info", `VadOnly: Audio blob created, size: ${audioBlob.size} bytes, type: ${audioBlob.type}`);

        // Verificar systemAudio
        console.log("🎤 VadOnly: systemAudio available:", !!systemAudio);
        console.log("🎤 VadOnly: processMicrophoneTranscription available:", !!(systemAudio && systemAudio.processMicrophoneTranscription));
        await logToBackend("info", `VadOnly: systemAudio available: ${!!systemAudio}, processMicrophoneTranscription available: ${!!(systemAudio && systemAudio.processMicrophoneTranscription)}`);

        // Usar transcrição simples do Whisper via Tauri
        console.log("🎯 VadOnly: Calling fetchWhisperSTT...");
        await logToBackend("info", `VadOnly: Calling fetchWhisperSTT with ${audioBlob.size} bytes`);
        const transcription = await fetchWhisperSTT(audioBlob);
        console.log("🎯 VadOnly: Transcription received:", transcription ? `"${transcription.substring(0, 50)}..."` : "null/empty");
        await logToBackend("info", `VadOnly: Transcription received - ${transcription ? transcription.length : 0} chars, text: "${transcription ? transcription.substring(0, 100) : "null/empty"}"`);

        if (transcription && transcription.trim()) {
          console.log("✅ VadOnly: Valid transcription received!");
          console.log("🎯 VadOnly: Microphone transcription (TERAPEUTA):", transcription);
          console.log("🎯 VadOnly: Transcription length:", transcription.length, "characters");
          
          // SEMPRE usar o sistema de supervisão - Sistema 1 integrado com Sistema 2
          if (systemAudio && systemAudio.processMicrophoneTranscription) {
            console.log("🎯 VadOnly: Sending to psychological supervision system (Sistema 1 → Sistema 2)");
            await systemAudio.processMicrophoneTranscription(transcription);
            console.log("✅ VadOnly: Transcription sent to supervision system successfully");
          } else {
            console.error("❌ VadOnly: Sistema de supervisão não disponível!");
            console.error("   - systemAudio exists:", !!systemAudio);
            console.error("   - processMicrophoneTranscription exists:", !!(systemAudio && systemAudio.processMicrophoneTranscription));
            alert("Sistema de supervisão não disponível. Reinicie a aplicação.");
          }
        } else {
          console.warn("⚠️ VadOnly: Transcription is empty or invalid:", transcription);
        }
      } catch (error) {
        console.error("❌ VadOnly: Failed to transcribe audio:", error);
        console.error("❌ VadOnly: Error details:", {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          name: error instanceof Error ? error.name : undefined,
        });
        alert(`Erro na transcrição: ${error instanceof Error ? error.message : "Transcription failed"}`);
      }
    },
  };

  // Adicionar stream apenas se estiver disponível
  if (audioStream) {
    vadOptions.stream = audioStream;
  }

  // Interceptar erros do VAD
  const vadOptionsWithErrorHandling = {
    ...vadOptions,
    onError: (error: Error) => {
      const errorMsg = `VAD Error: ${error.message}`;
      console.error("❌ VadOnly: VAD error:", error);
      logToBackend("error", `VadOnly: ${errorMsg}`);
      alert(`Erro no VAD: ${error.message}\n\nVerifique se você permitiu o acesso ao microfone nas configurações do Windows.`);
    },
    onLoadError: (error: Error) => {
      const errorMsg = `VAD Load Error: ${error.message}`;
      console.error("❌ VadOnly: VAD load error:", error);
      logToBackend("error", `VadOnly: ${errorMsg}`);
      alert(`Erro ao carregar modelo VAD: ${error.message}\n\nVerifique sua conexão com a internet (necessária para baixar o modelo).`);
    },
  };

  const vad = useMicVAD(vadOptionsWithErrorHandling);
  const hasStartedRef = useRef(false);
  const lastDeviceIdRef = useRef<string | null>(null);
  
  // Log quando o VAD é criado ou atualizado
  useEffect(() => {
    console.log("🎤 VadOnly: VAD object updated - loading:", vad.loading, "listening:", vad.listening, "userSpeaking:", vad.userSpeaking, "errored:", vad.errored);
    logToBackend("info", `VadOnly: VAD state - loading: ${vad.loading}, listening: ${vad.listening}, userSpeaking: ${vad.userSpeaking}, errored: ${vad.errored}`);
    
    if (vad.errored) {
      console.error("❌ VadOnly: VAD is in errored state!");
      logToBackend("error", "VadOnly: VAD is in errored state!");
    }
  }, [vad.loading, vad.listening, vad.userSpeaking, vad.errored]);

  // Log inicial de montagem apenas uma vez
  useEffect(() => {
    console.log("🎤 VadOnly: Component mounted");
    logToBackend("info", "VadOnly component mounted");
    
    // Verificar se estamos em ambiente Tauri
    if ((window as any).__TAURI__) {
      console.log("✅ VadOnly: Running in Tauri environment");
      logToBackend("info", "VadOnly: Running in Tauri environment");
    } else {
      console.log("⚠️ VadOnly: NOT running in Tauri environment");
      logToBackend("warn", "VadOnly: NOT running in Tauri environment");
    }
    
    // Verificar disponibilidade de APIs
    console.log("🔍 VadOnly: Checking API availability...");
    console.log("  - navigator.mediaDevices:", !!navigator.mediaDevices);
    console.log("  - getUserMedia:", !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia));
    console.log("  - AudioContext:", !!(window.AudioContext || (window as any).webkitAudioContext));
    logToBackend("info", `VadOnly: API availability - mediaDevices: ${!!navigator.mediaDevices}, getUserMedia: ${!!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)}, AudioContext: ${!!(window.AudioContext || (window as any).webkitAudioContext)}`);
  }, []);
  
  // Auto-start VAD when component mounts or device changes (sem loop)
  useEffect(() => {
    console.log("🎤 VadOnly useEffect triggered - vad:", !!vad, "audioStream:", !!audioStream, "hasStarted:", hasStartedRef.current);
    logToBackend("info", `VadOnly useEffect: vad=${!!vad}, audioStream=${!!audioStream}, hasStarted=${hasStartedRef.current}, deviceId=${selectedDeviceId}`);
    
    if (!vad || !audioStream) {
      console.log("⚠️ VadOnly: Waiting for vad or audioStream to be ready");
      logToBackend("info", "VadOnly: Waiting for vad or audioStream to be ready");
      return; // Aguardar VAD e stream estarem prontos
    }
    
    // Verificar se o dispositivo mudou
    const deviceChanged = lastDeviceIdRef.current !== selectedDeviceId;
    
    if (deviceChanged) {
      console.log("🎤 VadOnly: Device changed from", lastDeviceIdRef.current, "to", selectedDeviceId);
      logToBackend("info", `VadOnly: Device changed from ${lastDeviceIdRef.current} to ${selectedDeviceId}`);
      lastDeviceIdRef.current = selectedDeviceId;
      hasStartedRef.current = false; // Reset para reiniciar com novo dispositivo
      return; // Vai ser acionado novamente e vai iniciar
    }
    
    // Iniciar apenas uma vez quando o componente monta
    console.log("🎤 VadOnly: Checking if should start VAD - hasStarted:", hasStartedRef.current);
    logToBackend("info", `VadOnly: Checking if should start VAD - hasStarted: ${hasStartedRef.current}`);
    
    if (!hasStartedRef.current) {
      console.log("🎤 VadOnly: Auto-starting VAD on component mount");
      logToBackend("info", "VadOnly: Auto-starting VAD on component mount");
      hasStartedRef.current = true;
      lastDeviceIdRef.current = selectedDeviceId;
      
      // Aguardar um pouco para garantir que tudo está pronto
      setTimeout(() => {
        try {
          console.log("🎤 VadOnly: Attempting to start VAD...");
          logToBackend("info", "VadOnly: Attempting to start VAD...");
          vad.start();
          setIsListening(true);
          console.log("✅ VadOnly: VAD started successfully");
          logToBackend("info", "VadOnly: VAD started successfully");
        } catch (error) {
          console.error("❌ VadOnly: Failed to start VAD:", error);
          logToBackend("error", `VadOnly: Failed to start VAD: ${error}`);
          hasStartedRef.current = false; // Reset se falhar
        }
      }, 500);
    } else {
      console.log("⚠️ VadOnly: VAD already started, skipping");
      logToBackend("info", "VadOnly: VAD already started, skipping");
    }
  }, [selectedDeviceId, audioStream, vad]); // Incluindo vad para reagir quando estiver pronto

  const handleToggleVAD = () => {
    if (vad.listening) {
      vad.pause();
      setEnableVAD(false);
      setIsListening(false);
    } else {
      vad.start();
      setEnableVAD(true);
      setIsListening(true);
    }
  };

  const getButtonIcon = () => {
    if (vad.userSpeaking) {
      return <LoaderCircleIcon className="h-4 w-4 animate-spin text-green-500" />;
    }
    if (vad.listening) {
      return <MicOffIcon className="h-4 w-4 animate-pulse text-red-500" />;
    }
    return <MicIcon className="h-4 w-4" />;
  };

  const getButtonTitle = () => {
    if (vad.userSpeaking) {
      return "Detectando fala...";
    }
    if (vad.listening) {
      return "Parar detecção de voz (VAD)";
    }
    return "Iniciar detecção de voz (VAD)";
  };

  return (
    <>
      <Button
        size="icon"
        onClick={handleToggleVAD}
        className="cursor-pointer"
        title={getButtonTitle()}
      >
        {getButtonIcon()}
      </Button>
    </>
  );
};
