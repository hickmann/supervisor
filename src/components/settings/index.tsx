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
import { SystemPrompt } from "./SystemPrompt";
import { ScreenshotConfigs } from "./ScreenshotConfigs";
import { AppIconToggle } from "./AppIconToggle";
import { AlwaysOnTopToggle } from "./AlwaysOnTopToggle";
import { TitleToggle } from "./TitleToggle";
import { AIProviders } from "./ai-configs";
import { STTProviders } from "./stt-configs";
import { DeleteChats } from "./DeleteChats";
import { PluelyApiSetup } from "./PluelyApiSetup";

export const Settings = () => {
  const settings = useSettings();

  return (
    <AnimatedPopover
      open={settings?.isPopoverOpen}
      onOpenChange={settings?.setIsPopoverOpen}
    >
      <AnimatedPopoverTrigger asChild>
        <Button
          aria-label="Open Settings"
          variant="ghost"
          size="icon"
          className="!bg-transparent !border-none !text-white/70 hover:!text-white hover:!bg-white/10 !w-8 !h-8 !rounded-md !transition-all !duration-200 !cursor-pointer !p-0 !min-h-0 !h-8 !w-8 !shadow-none !gap-0 !whitespace-nowrap !text-sm !font-medium !disabled:pointer-events-none !disabled:opacity-50 !outline-none"
          title="Open Settings"
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
            {/* Pluely API Setup */}
            <PluelyApiSetup />

            {/* System Prompt */}
            <SystemPrompt {...settings} />

            {/* Screenshot Configs */}
            <ScreenshotConfigs {...settings} />

            {/* App Icon Toggle */}
            <AppIconToggle />

            {/* Always On Top Toggle */}
            <AlwaysOnTopToggle />

            {/* Title Toggle */}
            <TitleToggle />

            {/* Provider Selection */}
            <AIProviders {...settings} />

            {/* STT Providers */}
            <STTProviders {...settings} />

            {/* Disclaimer */}
            <DeleteChats {...settings} />
          </div>

          <div className="pt-2 pb-6 flex items-center justify-center">
            <a
              href="https://www.srikanthnani.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground text-center font-medium"
            >
              🚀 Built by Srikanth Nani ✨
            </a>
          </div>
        </ScrollArea>

        <div className="border-t border-input/50">
          <Disclaimer />
        </div>
      </AnimatedPopoverContent>
    </AnimatedPopover>
  );
};
