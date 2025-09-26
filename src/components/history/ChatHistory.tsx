import { History } from "lucide-react";
import { AnimatedPopover, AnimatedPopoverContent, AnimatedPopoverTrigger, Button } from "@/components";
import { useHistory } from "@/hooks";
import {
  ConversationListView,
  MessageHistoryView,
  DeleteConfirmationDialog,
} from "./";
import { ChatConversation } from "@/types/completion";

interface ChatHistoryProps {
  onSelectConversation: (conversation: ChatConversation) => void;
  onNewConversation: () => void;
  currentConversationId: string | null;
}

export const ChatHistory = ({
  onSelectConversation,
  onNewConversation,
  currentConversationId,
}: ChatHistoryProps) => {
  const historyHook = useHistory();

  const handleBackToConversations = () => {
    historyHook.handleViewConversation(null as any);
  };

  return (
    <>
      <AnimatedPopover open={historyHook.isOpen} onOpenChange={historyHook.setIsOpen}>
        <AnimatedPopoverTrigger asChild>
          <Button
            aria-label="View All Chat History"
            variant="ghost"
            size="icon"
            className="!bg-transparent !border-none !text-white/70 hover:!text-white hover:!bg-white/10 !w-8 !h-8 !rounded-md !transition-all !duration-200 !cursor-pointer !p-0 !min-h-0 !h-8 !w-8 !shadow-none !gap-0 !whitespace-nowrap !text-sm !font-medium !disabled:pointer-events-none !disabled:opacity-50 !outline-none"
            title="View All Chat History"
          >
            <History className="h-4 w-4" />
          </Button>
        </AnimatedPopoverTrigger>

        <AnimatedPopoverContent
          align="end"
          side="bottom"
          className="select-none w-screen p-0 border overflow-hidden border-input/50"
          sideOffset={18}
        >
          {historyHook.viewingConversation ? (
            <MessageHistoryView
              {...historyHook}
              viewingConversation={historyHook.viewingConversation}
              onBackToConversations={handleBackToConversations}
              onSelectConversation={onSelectConversation}
            />
          ) : (
            <ConversationListView
              {...historyHook}
              currentConversationId={currentConversationId}
              onNewConversation={onNewConversation}
              onClosePopover={() => historyHook.setIsOpen(false)}
              onSelectConversation={onSelectConversation}
            />
          )}

          <DeleteConfirmationDialog {...historyHook} />
        </AnimatedPopoverContent>
      </AnimatedPopover>
    </>
  );
};
