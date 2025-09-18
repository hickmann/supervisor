import { UseCompletionReturn } from "@/types";
import { useMicVAD } from "@ricky0123/vad-react";
import { LoaderCircleIcon, MicIcon, MicOffIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";

interface VadOnlyProps {
  submit: UseCompletionReturn["submit"];
  setState: UseCompletionReturn["setState"];
  setEnableVAD: UseCompletionReturn["setEnableVAD"];
}

export const VadOnly = ({
  submit,
  setState,
  setEnableVAD,
}: VadOnlyProps) => {
  const [, setIsListening] = useState(false);

  const vad = useMicVAD({
    userSpeakingThreshold: 0.6,
    startOnLoad: false, // Don't start automatically
    onSpeechStart: () => {
      console.log("Fala detectada - VAD ativado");
      setState((prev: any) => ({ ...prev, error: "" }));
    },
    onSpeechEnd: (audio) => {
      console.log("Fim da fala detectado - VAD", audio.length, "samples");
      // Aqui você pode processar o áudio como quiser
      // Por enquanto, vamos apenas mostrar uma mensagem
      submit("Fala detectada pelo VAD (sem transcrição)");
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
