import { useEffect, useState } from "react";
import { Card, Settings, SystemAudio, Updater } from "./components";
import { Completion } from "./components/completion";
import { ChatHistory } from "./components/history";
import { AudioVisualizer } from "./components/speech/audio-visualizer";
import { useSystemAudio } from "./hooks/useSystemAudio";
import { listen } from "@tauri-apps/api/event";

const App = () => {
  const systemAudio = useSystemAudio();
  const [isHidden, setIsHidden] = useState(false);
  const handleSelectConversation = (conversation: any) => {
    // Use localStorage to communicate the selected conversation to Completion component
    localStorage.setItem("selectedConversation", JSON.stringify(conversation));
    // Trigger a custom event to notify Completion component
    window.dispatchEvent(
      new CustomEvent("conversationSelected", {
        detail: conversation,
      })
    );
  };

  const handleNewConversation = () => {
    // Clear any selected conversation and trigger new conversation
    localStorage.removeItem("selectedConversation");
    window.dispatchEvent(new CustomEvent("newConversation"));
  };

  // WINDOWS HIDE/SHOW TOGGLE WINDOW WORKAROUND FOR SHORTCUTS
  useEffect(() => {
    const unlistenPromise = listen<boolean>(
      "toggle-window-visibility",
      (event) => {
        const platform = navigator.platform.toLowerCase();
        if (typeof event.payload === "boolean" && platform.includes("win")) {
          setIsHidden(!event.payload);
          // find popover open and close it
          const popover = document.getElementById("popover-content");
          // set display to none, change data-state to closed
          if (popover) {
            popover.style.setProperty("display", "none", "important");
            // update the data-state to closed
            popover.setAttribute("data-state", "closed");

            // Also find and update the popover trigger's data-state
            const popoverTriggers = document.querySelectorAll(
              '[data-slot="popover-trigger"]'
            );
            popoverTriggers.forEach((trigger) => {
              trigger.setAttribute("data-state", "closed");
            });
          }
        }
      }
    );

    return () => {
      unlistenPromise.then((unlisten) => unlisten());
    };
  }, []);

  return (
    <div
      className={`w-screen h-screen flex overflow-hidden justify-center items-start ${
        isHidden ? "hidden pointer-events-none" : ""
      }`}
    >
      <Card className="w-full flex flex-row items-center gap-2 p-2 app-background">
        <SystemAudio {...systemAudio} />
{systemAudio?.capturing ? (
          <div className="flex flex-row items-center gap-4 justify-between w-full">
            <div className="flex items-center gap-3">
              <AudioVisualizer isRecording={systemAudio?.capturing} />
              {/* Contador de tempo */}
              <div className="text-sm font-medium text-white/90">
                {systemAudio.recordingTime || "00:00"}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Botão Perguntar pra IA */}
              <button
                onClick={systemAudio.handleSendToAI}
                disabled={systemAudio.isAIProcessing}
                className={`flex items-center gap-3 px-3 py-1.5 transition-all duration-200 ${
                  systemAudio.isAIProcessing 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:bg-white/10 cursor-pointer'
                }`}
              >
                {systemAudio.isAIProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                    <span className="text-base font-medium text-white/70">Processando...</span>
                  </>
                ) : (
                  <>
                    <span className="text-base font-medium text-white">Perguntar pra IA</span>
                    <div className="flex items-center gap-1">
                      <div className="w-8 h-6 border border-white/40 rounded flex items-center justify-center">
                        <span className="text-xs text-white/80 font-mono leading-none">
                          {navigator.platform.toLowerCase().includes('mac') ? '⌘' : 'Ctrl'}
                        </span>
                      </div>
                      <div className="w-6 h-6 border border-white/40 rounded flex items-center justify-center">
                        <span className="text-xs text-white/80 font-mono leading-none">↵</span>
                      </div>
                    </div>
                  </>
                )}
              </button>

              {/* Botão Mostrar/Esconder */}
              <button
                onClick={systemAudio.handleToggleVisibility}
                className="flex items-center gap-3 px-3 py-1.5 hover:bg-white/10 transition-all duration-200 cursor-pointer"
              >
                <span className="text-base font-medium text-white">Mostrar/Esconder</span>
                <div className="flex items-center gap-1">
                  <div className="w-8 h-6 border border-white/40 rounded flex items-center justify-center">
                    <span className="text-xs text-white/80 font-mono leading-none">
                      {navigator.platform.toLowerCase().includes('mac') ? '⌘' : 'Ctrl'}
                    </span>
                  </div>
                  <div className="w-6 h-6 border border-white/40 rounded flex items-center justify-center">
                    <span className="text-xs text-white/80 font-mono leading-none">H</span>
                  </div>
                </div>
              </button>
            </div>
          </div>
        ) : null}

        <div
          className={`${
            systemAudio?.capturing
              ? "hidden w-full fade-out transition-all duration-300"
              : "w-full"
          }`}
        >
          <div className="w-full flex flex-row gap-2 items-center justify-between">
            <div className="flex items-center gap-2">
              <Completion isHidden={isHidden} systemAudio={systemAudio} />
              {/* Componente de escuta e contador zerado */}
              <div className="flex items-center gap-3">
                {/* Simulação da onda de áudio quando não está gravando */}
                <div className="w-[40px] h-[30px] flex items-center justify-center">
                  <div className="flex items-center gap-1">
                    <div className="w-1 h-1 bg-white/30 rounded-full"></div>
                    <div className="w-1 h-1 bg-white/30 rounded-full"></div>
                    <div className="w-1 h-1 bg-white/30 rounded-full"></div>
                    <div className="w-1 h-1 bg-white/30 rounded-full"></div>
                    <div className="w-1 h-1 bg-white/30 rounded-full"></div>
                  </div>
                </div>
                <div className="text-sm font-medium text-white/90">
                  00:00
                </div>
              </div>
            </div>
            
            {/* Link CoterapIA.com.br no centro */}
            <button
              onClick={async () => {
                try {
                  const { invoke } = await import("@tauri-apps/api/core");
                  await invoke("open_url", { url: "https://www.CoterapIA.com.br" });
                } catch (error) {
                  console.error("Erro ao abrir URL:", error);
                  // Fallback para window.open se o Tauri não funcionar
                  window.open('https://www.CoterapIA.com.br', '_blank');
                }
              }}
              className="text-sm font-medium text-white hover:text-white/80 transition-colors duration-200 cursor-pointer"
            >
              CoterapIA
            </button>
            
            <div className="flex items-center gap-2">
              <ChatHistory
                onSelectConversation={handleSelectConversation}
                onNewConversation={handleNewConversation}
                currentConversationId={null}
              />
              <Settings />
              {/* Botão de fechar */}
              <button
                onClick={async () => {
                  try {
                    const { invoke } = await import("@tauri-apps/api/core");
                    await invoke("exit_app");
                  } catch (error) {
                    console.error("Erro ao fechar aplicação:", error);
                    // Fallback para window.close se o Tauri não funcionar
                    window.close();
                  }
                }}
                className="flex items-center justify-center w-8 h-8 text-white/70 hover:text-white hover:bg-white/10 rounded-md transition-all duration-200 cursor-pointer"
                title="Fechar aplicação"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <Updater />
      </Card>
    </div>
  );
};

export default App;
