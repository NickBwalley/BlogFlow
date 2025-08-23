"use client";

import { useState } from "react";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { ChatInterface } from "@/components/chat/chat-interface";
import { getChatWithMessages } from "@/lib/actions/chat";
import type { Message } from "@/types";

export default function ChatPage() {
  const [selectedChatId, setSelectedChatId] = useState<string | undefined>();
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [isLoadingChat, setIsLoadingChat] = useState(false);

  const loadChatMessages = async (chatId: string) => {
    setIsLoadingChat(true);
    const result = await getChatWithMessages(chatId);
    if (result.success && result.data) {
      setChatMessages(result.data.messages || []);
    } else {
      setChatMessages([]);
    }
    setIsLoadingChat(false);
  };

  const handleChatSelect = (chatId: string) => {
    setSelectedChatId(chatId);
    loadChatMessages(chatId);
  };

  const handleNewChat = () => {
    setSelectedChatId(undefined);
    setChatMessages([]);
  };

  return (
    <div className="flex h-full">
      <ChatSidebar
        selectedChatId={selectedChatId}
        onChatSelect={handleChatSelect}
        onNewChat={handleNewChat}
      />
      <div className="flex-1">
        {isLoadingChat ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <ChatInterface
            chatId={selectedChatId}
            initialMessages={chatMessages}
          />
        )}
      </div>
    </div>
  );
}
