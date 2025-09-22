"use client";

import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { cn } from "@/lib/utils";

// Animated Popover Root
function AnimatedPopover({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root data-slot="animated-popover" {...props} />;
}

// Animated Popover Trigger with enhanced hover effects
function AnimatedPopoverTrigger({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return (
    <PopoverPrimitive.Trigger
      data-slot="animated-popover-trigger"
      {...props}
      className={cn(
        props.className,
        "data-[state=open]:bg-primary-foreground data-[state=open]:text-primary data-[state=open]:border-primary/20 data-[state=open]:border-1 transition-all duration-500"
      )}
    />
  );
}

// Animated Popover Content with slide-down animation
function AnimatedPopoverContent({
  className,
  align = "center",
  sideOffset = 14, // Ajustado para 14 (10px a mais que o original)
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        data-slot="animated-popover-content"
        align={align}
        sideOffset={sideOffset}
        id="animated-popover-content"
        className={cn(
          "z-50 w-72 origin-(--radix-popover-content-transform-origin) rounded-xl border bg-popover/90 backdrop-blur-3xl text-popover-foreground p-4 outline-hidden",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2",
          "duration-500 ease-out",
          className
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
}

// Animated Popover Anchor
function AnimatedPopoverAnchor({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Anchor>) {
  return <PopoverPrimitive.Anchor data-slot="animated-popover-anchor" {...props} />;
}

export { 
  AnimatedPopover, 
  AnimatedPopoverTrigger, 
  AnimatedPopoverContent, 
  AnimatedPopoverAnchor 
};
