"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

interface DropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: "left" | "right";
  offset?: number;
}

export function Dropdown({
  trigger,
  children,
  align = "right",
  offset = 8,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current || !dropdownRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const dropdownRect = dropdownRef.current.getBoundingClientRect();

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let top = triggerRect.bottom + offset;
    let left: number;

    if (align === "right") {
      left = triggerRect.right - dropdownRect.width;

      // Keep dropdown inside viewport horizontally
      if (left < 0) {
        left = 0;
      }

      if (left + dropdownRect.width > viewportWidth) {
        left = viewportWidth - dropdownRect.width;
      }
    } else {
      left = triggerRect.left;

      // Keep dropdown inside viewport horizontally
      if (left + dropdownRect.width > viewportWidth) {
        left = viewportWidth - dropdownRect.width;
      }

      if (left < 0) {
        left = 0;
      }
    }

    // Open upward if there isn't enough space below
    if (top + dropdownRect.height > viewportHeight) {
      top = triggerRect.top - dropdownRect.height - offset;
    }

    setPosition({ top, left });
  }, [align, offset]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    const handleResize = () => {
      updatePosition();
    };

    const handleScroll = () => {
      updatePosition();
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [isOpen, updatePosition]);

  const toggleOpen = () => {
    const nextState = !isOpen;

    setIsOpen(nextState);

    if (nextState) {
      requestAnimationFrame(() => {
        updatePosition();
      });
    }
  };

  return (
    <div
      className="relative inline-block"
      data-slot="dropdown"
    >
      <div
        ref={triggerRef}
        onClick={toggleOpen}
        className="inline-block"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            toggleOpen();
          }
        }}
        role="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        {trigger}
      </div>

      {isOpen && position && (
        <div
          ref={dropdownRef}
          className={cn(
            "fixed z-50 w-56 origin-top-right",
            "rounded-lg border border-neon/20",
            "bg-black/90 backdrop-blur-md",
            "shadow-lg",
            "animate-in fade-in-0 zoom-in-95",
            "duration-150 ease-out"
          )}
          style={{
            top: position.top,
            left: position.left,
          }}
          role="menu"
        >
          <div className="py-1">{children}</div>
        </div>
      )}
    </div>
  );
}

interface DropdownItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  destructive?: boolean;
}

export function DropdownItem({
  children,
  onClick,
  disabled = false,
  className,
  destructive = false,
}: DropdownItemProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex w-full items-center px-3 py-2 text-sm font-medium transition-colors outline-none focus:bg-neon/10 focus:text-neon",
        destructive
          ? "text-red-400 hover:bg-red-500/10 hover:text-red-300"
          : "text-zinc-300 hover:bg-neon/5 hover:text-white",
        disabled && "opacity-50 pointer-events-none",
        className
      )}
      role="menuitem"
      tabIndex={-1}
    >
      {children}
    </button>
  );
}

interface DropdownSeparatorProps {
  className?: string;
}

export function DropdownSeparator({ className }: DropdownSeparatorProps) {
  return (
    <div className={cn("h-px bg-neon/10 my-1", className)} role="separator" />
  );
}

interface DropdownLabelProps {
  children: React.ReactNode;
  className?: string;
}

export function DropdownLabel({ children, className }: DropdownLabelProps) {
  return (
    <div className={cn("px-3 py-1.5 text-xs font-medium text-zinc-500 uppercase tracking-wider", className)}>
      {children}
    </div>
  );
}