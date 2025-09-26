import { Loader2, TrashIcon } from "lucide-react";
import { Button, Header } from "@/components";
import { UseSettingsReturn } from "@/types";
import { useState } from "react";

export const DeleteChats = ({
  handleDeleteAllChatsConfirm,
  showDeleteConfirmDialog,
  setShowDeleteConfirmDialog,
}: UseSettingsReturn) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteAllChats = () => {
    setIsDeleting(true);
    handleDeleteAllChatsConfirm();
    setTimeout(() => {
      setIsDeleting(false);
    }, 2000);
  };

  return (
    <div className="space-y-3">
      <Header
        title="Excluir Histórico de Conversas"
        description="Exclui permanentemente todas as suas conversas e histórico de chat. Esta ação não pode ser desfeita e removerá todas as conversas armazenadas do seu armazenamento local."
        isMainTitle
      />

      <div className="space-y-2">
        {isDeleting && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-xs text-green-700 font-medium">
              ✅ Todo o histórico de conversas foi excluído com sucesso.
            </p>
          </div>
        )}

        <Button
          onClick={() => setShowDeleteConfirmDialog(true)}
          disabled={isDeleting}
          variant="destructive"
          className="w-full h-11"
          title="Excluir todo o histórico de conversas"
        >
          {isDeleting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Excluindo...
            </>
          ) : (
            <>
              <TrashIcon className="h-4 w-4 mr-2" />
              Excluir Todas as Conversas
            </>
          )}
        </Button>
      </div>

      {/* Confirmation Dialog */}
      {showDeleteConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-2">
              Excluir Todo o Histórico de Conversas
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Tem certeza de que deseja excluir todo o histórico de conversas? Esta ação
              não pode ser desfeita e removerá permanentemente todas as conversas
              armazenadas.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirmDialog(false)}
              >
                Cancelar
              </Button>
              <Button variant="destructive" onClick={deleteAllChats}>
                Excluir Tudo
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
