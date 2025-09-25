import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Trash2Icon,
  PlusIcon,
  EyeIcon,
  EyeOffIcon,
} from "lucide-react";
import { useState } from "react";

interface QuickActionsProps {
  actions: string[];
  onActionClick: (action: string) => void;
  onAddAction: (action: string) => void;
  onRemoveAction: (action: string) => void;
  isManaging: boolean;
  setIsManaging: (isManaging: boolean) => void;
  show: boolean;
  setShow: (show: boolean) => void;
  isGeneratingSessionSummary?: boolean;
}

export const QuickActions = ({
  actions,
  onActionClick,
  onAddAction,
  onRemoveAction,
  isManaging,
  setIsManaging,
  show,
  setShow,
  isGeneratingSessionSummary = false,
}: QuickActionsProps) => {
  const [newAction, setNewAction] = useState("");

  const handleAdd = () => {
    onAddAction(newAction.trim());
    setNewAction("");
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-semibold text-white tracking-tight">
          Ajuda/Ações Rápidas
        </h4>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 hover:bg-slate-100/50 transition-colors duration-200"
            onClick={() => {
              setShow(!show);
              setIsManaging(false);
            }}
          >
            {show ? (
              <EyeOffIcon className="w-4 h-4 text-slate-500" />
            ) : (
              <EyeIcon className="w-4 h-4 text-slate-500" />
            )}
          </Button>
        </div>
      </div>
      {show && (
        <div className="flex flex-wrap gap-3 items-center">
          {actions.map((action) => {
            const isLoading = action === "Recapitular Sessão Completa" && isGeneratingSessionSummary;
            
            return (
              <div key={action} className="relative group">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-8 px-3 bg-white/70 hover:bg-white/90 border-slate-200/50 hover:border-slate-300/50 text-slate-700 hover:text-slate-900 transition-all duration-200 rounded-lg"
                  disabled={isLoading}
                  onClick={() => {
                    if (isManaging || isLoading) {
                      return;
                    }
                    onActionClick(action);
                  }}
                >
                  {isLoading ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Gerando...
                    </>
                  ) : (
                    action
                  )}
                  {isManaging && !isLoading && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveAction(action);
                      }}
                      className="ml-2 cursor-pointer text-slate-400 hover:text-red-500 transition-colors duration-200"
                    >
                      <Trash2Icon className="w-3 h-3" />
                    </button>
                  )}
                </Button>
              </div>
            );
          })}
          {isManaging && (
            <div className="flex gap-3">
              <Input
                type="text"
                value={newAction}
                onChange={(e) => setNewAction(e.target.value)}
                placeholder="Adicionar nova ação..."
                className="h-8 text-xs w-40 bg-white/70 border-slate-200/50 focus:border-slate-300/50 rounded-lg"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAdd();
                  }
                }}
              />
              <Button
                size="sm"
                className="h-8 text-xs bg-slate-700 hover:bg-slate-800 text-white transition-colors duration-200 rounded-lg"
                onClick={handleAdd}
                disabled={!newAction.trim()}
              >
                <PlusIcon className="w-3.5 h-3.5 mr-1" />
                Add
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
