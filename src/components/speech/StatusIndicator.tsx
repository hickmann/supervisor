import { AlertCircleIcon, LoaderIcon } from "lucide-react";

type Props = {
  setupRequired: boolean;
  error: string;
  isProcessing: boolean;
  isAIProcessing: boolean;
  capturing: boolean;
  onSendToAIClick?: () => void;
  onToggleVisibilityClick?: () => void;
};

export const StatusIndicator = ({
  setupRequired,
  error,
  isProcessing,
  isAIProcessing,
  capturing,
  onSendToAIClick,
  onToggleVisibilityClick,
}: Props) => {
  // Don't show anything if not capturing and no error
  if (!capturing && !error && !isProcessing && !isAIProcessing) {
    return null;
  }

  return (
    <div className="flex flex-1 items-center gap-2 px-3 py-2 justify-end">
      {/* Priority: Error > AI Processing > Transcribing > Listening */}
      {error && !setupRequired ? (
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircleIcon className="w-4 h-4" />
          <span className="text-xs font-medium">{error}</span>
        </div>
      ) : isAIProcessing ? (
        <div className="flex items-center gap-2 animate-pulse">
          <LoaderIcon className="w-4 h-4 animate-spin" />
          <span className="text-xs font-medium">Generating response...</span>
        </div>
      ) : isProcessing ? (
        <div className="flex items-center gap-2 animate-pulse">
          <LoaderIcon className="w-4 h-4 animate-spin" />
          <span className="text-xs font-medium">Transcribing...</span>
        </div>
      ) : capturing ? (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-green-600 animate-pulse">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-medium">Listening...</span>
          </div>
          
          {/* Botões com estilo glassmorphism */}
          <div className="flex items-center gap-1.5">
            {/* Botão Perguntar pra IA */}
            <button
              onClick={onSendToAIClick}
              className="flex items-center gap-1.5 px-2 py-0.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-md hover:bg-white/20 transition-all duration-200 cursor-pointer"
            >
              <span className="text-xs font-medium text-white">Perguntar pra IA</span>
              <div className="flex items-center gap-0.5">
                <div className="w-5 h-3 border border-white/40 rounded flex items-center justify-center">
                  <span className="text-[9px] text-white/80 font-mono leading-none">
                    {navigator.platform.toLowerCase().includes('mac') ? '⌘' : 'Ctrl'}
                  </span>
                </div>
                <div className="w-3 h-3 border border-white/40 rounded flex items-center justify-center">
                  <span className="text-[9px] text-white/80 font-mono leading-none">↵</span>
                </div>
              </div>
            </button>

            {/* Botão Mostrar/Esconder */}
            <button
              onClick={onToggleVisibilityClick}
              className="flex items-center gap-1.5 px-2 py-0.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-md hover:bg-white/20 transition-all duration-200 cursor-pointer"
            >
              <span className="text-xs font-medium text-white">Mostrar/Esconder</span>
              <div className="flex items-center gap-0.5">
                <div className="w-5 h-3 border border-white/40 rounded flex items-center justify-center">
                  <span className="text-[9px] text-white/80 font-mono leading-none">
                    {navigator.platform.toLowerCase().includes('mac') ? '⌘' : 'Ctrl'}
                  </span>
                </div>
                <div className="w-3 h-3 border border-white/40 rounded flex items-center justify-center">
                  <span className="text-[9px] text-white/80 font-mono leading-none">H</span>
                </div>
              </div>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};
