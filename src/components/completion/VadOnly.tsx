import { UseCompletionReturn } from "@/types";
import { useMicVAD } from "@ricky0123/vad-react";
import { LoaderCircleIcon, MicIcon, MicOffIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";
import { fetchSTT } from "@/lib/functions/stt.function";
import { floatArrayToWav } from "@/lib/utils";
import { useSystemAudio } from "@/hooks/useSystemAudio";

interface VadOnlyProps {
  setEnableVAD: UseCompletionReturn["setEnableVAD"];
}

export const VadOnly = ({
  setEnableVAD,
}: VadOnlyProps) => {
  const [, setIsListening] = useState(false);
  const systemAudio = useSystemAudio();

  const vad = useMicVAD({
    userSpeakingThreshold: 0.6,
    startOnLoad: false, // Don't start automatically
    onSpeechStart: () => {
      console.log("🎤 VadOnly: Speech detected - VAD activated");
    },
    onSpeechEnd: async (audio) => {
      console.log("Fim da fala detectado - VAD", audio.length, "samples");
      
      try {
        // Convert float32array to blob
        const audioBlob = floatArrayToWav(audio, 16000, "wav");
        console.log("🎤 VAD: Audio blob size:", audioBlob.size);

        // Use VOSK for transcription
        const transcription = await fetchSTT({
          provider: undefined,
          selectedProvider: { provider: "vosk-stt", variables: {} },
          audio: audioBlob,
        });

        if (transcription) {
          console.log("🎯 VAD: Microphone transcription (TERAPEUTA):", transcription);
          console.log("🎯 VAD: Transcription length:", transcription.length, "characters");
          
          // SEMPRE usar o sistema de supervisão - Sistema 1 integrado com Sistema 2
          if (systemAudio && systemAudio.processMicrophoneTranscription) {
            console.log("🎯 VAD: Sending to psychological supervision system (Sistema 1 → Sistema 2)");
            await systemAudio.processMicrophoneTranscription(transcription);
          } else {
            console.error("❌ VAD: Sistema de supervisão não disponível! Microfone não funcionará.");
            alert("Sistema de supervisão não disponível. Reinicie a aplicação.");
          }
        }
      } catch (error) {
        console.error("❌ VAD: Failed to transcribe audio:", error);
        alert(`Erro na transcrição: ${error instanceof Error ? error.message : "Transcription failed"}`);
      }
    },
  });

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
