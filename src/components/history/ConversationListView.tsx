import { MessageSquare } from "lucide-react";
import { ScrollArea } from "@/components";
import { UseHistoryType } from "@/hooks/useHistory";
import { ConversationItem } from "./ConversationItem";

interface ConversationListViewProps extends UseHistoryType {
  currentConversationId: string | null;
  onClosePopover: () => void;
}

export const ConversationListView = ({
  conversations,
  currentConversationId,
  selectedConversationId,
  handleViewConversation,
  handleDeleteConfirm,
  formatDate,
  setIsOpen,
}: ConversationListViewProps) => {

  return (
    <>
      <div className="border-b border-input/50 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Histórico de Atendimentos
          </h2>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-8.75rem)]">
        <div className="p-2">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">
                No conversations yet
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Start chatting to see your history here
              </p>
            </div>
          ) : (
            <div className="space-y-1 pr-2">
              {conversations.map((conversation) => (
                <ConversationItem
                  conversation={conversation}
                  currentConversationId={currentConversationId}
                  conversations={conversations}
                  isOpen={false}
                  selectedConversationId={selectedConversationId}
                  viewingConversation={null}
                  downloadedConversations={new Set()}
                  deleteConfirm={null}
                  setIsOpen={setIsOpen}
                  handleViewConversation={handleViewConversation}
                  handleDownloadConversation={() => {}}
                  handleDeleteConfirm={handleDeleteConfirm}
                  confirmDelete={() => {}}
                  cancelDelete={() => {}}
                  formatDate={formatDate}
                  refreshConversations={() => {}}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </>
  );
};
