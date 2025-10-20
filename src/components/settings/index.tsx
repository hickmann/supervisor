import { useSettings } from "@/hooks";
import { SettingsIcon } from "lucide-react";
import {
  AnimatedPopover,
  AnimatedPopoverContent,
  AnimatedPopoverTrigger,
  Button,
  ScrollArea,
} from "@/components";
import { Disclaimer } from "./Disclaimer";
import { AppIconToggle } from "./AppIconToggle";
import { AlwaysOnTopToggle } from "./AlwaysOnTopToggle";
import { DeleteChats } from "./DeleteChats";
import { UserInfo } from "./UserInfo";
import { ConversationBufferConfig } from "./ConversationBufferConfig";

export const Settings = () => {
  const settings = useSettings();

  return (
    <AnimatedPopover
      open={settings.isPopoverOpen}
      onOpenChange={settings.setIsPopoverOpen}
    >
      <AnimatedPopoverTrigger asChild>
        <Button
          aria-label="Abrir Configurações"
          variant="ghost"
          size="icon"
          className="!bg-transparent !border-none !text-white/70 hover:!text-white hover:!bg-white/10 !w-8 !h-8 !rounded-md !transition-all !duration-200 !cursor-pointer !p-0 !min-h-0 !h-8 !w-8 !shadow-none !gap-0 !whitespace-nowrap !text-sm !font-medium !disabled:pointer-events-none !disabled:opacity-50 !outline-none"
          title="Abrir Configurações"
        >
          <SettingsIcon className="h-4 w-4" />
        </Button>
      </AnimatedPopoverTrigger>

      {/* Settings Panel */}
      <AnimatedPopoverContent
        align="end"
        side="bottom"
        className="select-none w-screen p-0 border overflow-hidden border-input/50"
        sideOffset={18}
      >
        <ScrollArea className="h-[calc(100vh-7.2rem)]">
          <div className="p-6 space-y-6">

            {/* User Info and Logout */}
            <UserInfo />

            {/* App Icon Toggle */}
            <AppIconToggle />

            {/* Always On Top Toggle */}
            <AlwaysOnTopToggle />

            {/* Conversation Buffer Configuration */}
            <ConversationBufferConfig 
              conversationBufferConfig={settings.conversationBufferConfig}
              handleConversationBufferMessageCountChange={settings.handleConversationBufferMessageCountChange}
              handleConversationBufferMinTextLengthChange={settings.handleConversationBufferMinTextLengthChange}
              handleConversationBufferAutoSendChange={settings.handleConversationBufferAutoSendChange}
            />

            {/* Delete Chats */}
            <DeleteChats {...settings} />
          </div>

        </ScrollArea>

        <div className="border-t border-input/50">
          <Disclaimer />
        </div>
      </AnimatedPopoverContent>
    </AnimatedPopover>
  );
};
