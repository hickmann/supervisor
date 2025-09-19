import { fetchSTT } from "@/lib";
import { UseCompletionReturn } from "@/types";
import { useMicVAD } from "@ricky0123/vad-react";
import { LoaderCircleIcon, MicIcon, MicOffIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";
import { floatArrayToWav } from "@/lib/utils";
import { useSystemAudio } from "@/hooks/useSystemAudio";

interface AutoSpeechVADProps {
  setEnableVAD: UseCompletionReturn["setEnableVAD"];
}

export const AutoSpeechVAD = ({
  setEnableVAD,
}: AutoSpeechVADProps) => {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const systemAudio = useSystemAudio();

  const vad = useMicVAD({
    userSpeakingThreshold: 0.6,
    startOnLoad: false, // Não iniciar automaticamente para evitar duplo clique
    onSpeechEnd: async (audio) => {
      try {
        // convert float32array to blob
        const audioBlob = floatArrayToWav(audio, 16000, "wav");

        let transcription: string;
        
        // SEMPRE USAR VOSK - NÃO PRECISA VERIFICAR PROVIDERS
        console.log("🎤 VAD: Using VOSK for all transcriptions");

        setIsTranscribing(true);

        console.log("🎤 VAD: Starting transcription with VOSK...");
        console.log("🎤 VAD: Audio blob size:", audioBlob.size);

        // SEMPRE USAR VOSK - FORÇAR USO
        transcription = await fetchSTT({
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
      } finally {
        setIsTranscribing(false);
      }
    },
  });

  return (
    <>
      <Button
        size="icon"
        onClick={() => {
          console.log("🎤 AutoSpeechVAD: Button clicked, current state - listening:", vad.listening);
          if (vad.listening) {
            console.log("🎤 AutoSpeechVAD: Pausing VAD");
            vad.pause();
            setEnableVAD(false);
          } else {
            console.log("🎤 AutoSpeechVAD: Starting VAD");
            vad.start();
            setEnableVAD(true);
          }
        }}
        className="cursor-pointer"
      >
        {isTranscribing ? (
          <LoaderCircleIcon className="h-4 w-4 animate-spin text-green-500" />
        ) : vad.userSpeaking ? (
          <LoaderCircleIcon className="h-4 w-4 animate-spin" />
        ) : vad.listening ? (
          <MicOffIcon className="h-4 w-4 animate-pulse" />
        ) : (
          <MicIcon className="h-4 w-4" />
        )}
      </Button>
    </>
  );
};
