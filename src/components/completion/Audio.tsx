import { InfoIcon, MicIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger, Button } from "@/components";
import { VadOnly } from "./VadOnly";
import { UseCompletionReturn } from "@/types";

export const Audio = ({
  micOpen,
  setMicOpen,
  enableVAD,
  setEnableVAD,
  submit,
  setState,
}: UseCompletionReturn) => {
  return (
    <Popover open={micOpen} onOpenChange={setMicOpen}>
      <PopoverTrigger asChild>
        {enableVAD ? (
          <VadOnly
            submit={submit}
            setState={setState}
            setEnableVAD={setEnableVAD}
          />
        ) : (
          <Button
            size="icon"
            onClick={() => {
              setEnableVAD(!enableVAD);
            }}
            className="cursor-pointer"
            title="Toggle voice input (VAD)"
          >
            <MicIcon className="h-4 w-4" />
          </Button>
        )}
      </PopoverTrigger>

      <PopoverContent
        align="end"
        side="bottom"
        className="w-80 p-3"
        sideOffset={8}
      >
        <div className="text-sm select-none">
          <div className="font-semibold text-green-600 mb-1">
            VAD (Voice Activity Detection)
          </div>
          <div className="text-muted-foreground">
            <div className="mt-2 flex flex-row gap-1 items-center text-green-600">
              <InfoIcon size={16} />
              <span>VOICE ACTIVITY DETECTION</span>
            </div>

            <p className="block mt-2">
              Sistema de detecção de voz usando VAD do ricky0123. 
              Detecta quando você está falando e envia uma mensagem.
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
