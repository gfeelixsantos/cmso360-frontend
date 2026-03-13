"use client";

import React from "react";
import { Chip } from "@heroui/react";

export type StatusColor = "green" | "yellow" | "gray" | "red";

export interface StatusBadgeProps {
  label: string;
  color: StatusColor;
  icon?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

const colorStyles: Record<StatusColor, { bg: string; dot: string; text: string }> = {
  green: {
    bg: "bg-gradient-to-r from-[#104e35] to-[#4CAF50]",
    dot: "bg-lime-300",
    text: "text-white",
  },
  yellow: {
    bg: "bg-amber-100 border border-amber-300",
    dot: "bg-amber-500",
    text: "text-amber-700",
  },
  red: {
    bg: "bg-red-100 border border-red-300",
    dot: "bg-red-500",
    text: "text-red-700",
  },
  gray: {
    bg: "bg-gray-100 border border-gray-300",
    dot: "bg-gray-400",
    text: "text-gray-600",
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  color,
  icon,
  onClick,
  className = "",
}) => {
  const styles = colorStyles[color];
  const isClickable = !!onClick;

  return (
    <Chip
      className={`font-semibold px-3 py-1 rounded-full shadow-sm transition-all ${styles.bg} ${styles.text} ${
        isClickable ? "cursor-pointer hover:opacity-80 active:scale-95" : ""
      } ${className}`}
      size="sm"
      variant="flat"
      onClick={isClickable ? onClick : undefined}
    >
      <span className="flex w-full items-center justify-center gap-1.5">
        {icon || <span className={`w-2 h-2 rounded-full ${styles.dot}`} />}
        {label}
      </span>
    </Chip>
  );
};




