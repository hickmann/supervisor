import { InfoIcon, X } from "lucide-react";
import { Button } from "../ui";

type Props = {
  setupRequired: boolean;
  setIsPopoverOpen: React.Dispatch<React.SetStateAction<boolean>>;
  resizeWindow: (expanded: boolean) => Promise<void>;
  capturing: boolean;
};

export const Header = ({
  setupRequired,
  setIsPopoverOpen,
  resizeWindow,
  capturing,
}: Props) => {
  return (
    <div className="flex flex-col gap-3">
      <div className="border-b border-input/50 pb-3 flex justify-between items-start">
        <div>
          <h2 className="font-semibold text-sm">Supervisão Psicológica em Tempo Real</h2>
          <p className="text-xs text-muted-foreground mt-1">
            {setupRequired
              ? "Setup necessário para capturar áudio do sistema"
              : "Sistema de supervisão para psicólogos: Microfone = TERAPEUTA | Sistema = PACIENTE. O supervisor analisará as falas do terapeuta e fornecerá orientações em tempo real."}
          </p>
        </div>
        {!capturing ? (
          <div className="">
            <Button
              size="icon"
              title="Close Settings"
              onClick={() => {
                setIsPopoverOpen(false);
                resizeWindow(false);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : null}
      </div>

      <div className="flex flex-col items-start gap-2">
        <div className="flex flex-row items-center gap-2">
          <InfoIcon className="w-4 h-4" />
          <p className="text-sm text-muted-foreground">
            Sistema de supervisão psicológica em desenvolvimento ativo. 
            Use o microfone para suas falas como terapeuta e o sistema capturará 
            automaticamente as falas do paciente para análise supervisiva.
          </p>
        </div>
      </div>
    </div>
  );
};
