import React from "react";

interface TypingIndicatorProps {
  isVisible: boolean;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  isVisible,
}) => {
  if (!isVisible) {
    return null;
  }

  return (
    <div className="typing-indicator flex items-center justify-center">
      <div className="dot w-2 h-2 bg-black rounded-full mx-1 animate-bounce"></div>
      <div className="dot w-2 h-2 bg-black rounded-full mx-1 animate-bounce"></div>
      <div className="dot w-2 h-2 bg-black rounded-full mx-1 animate-bounce"></div>
    </div>
  );
};
