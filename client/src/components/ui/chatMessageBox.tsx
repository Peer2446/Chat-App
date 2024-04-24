import React from "react";

interface ChatMessageProps {
  username: string;
  message: string;
  time: string;
  isSender: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  username,
  message,
  time,
  isSender,
}) => {
  return (
    <div
      className={`flex flex-col items-start space-y-1 ${isSender ? "items-end" : "items-start"
        }`}
    >
      <p className="text-sm font-bold">{username}</p>
      <p className="text-base bg-gray-100 text-gray-500 rounded-lg px-4 py-2">{message}</p>
      <p className="text-xs text-gray-500">{time}</p>
    </div>
  );
};
