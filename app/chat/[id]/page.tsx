"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { ChatInterface } from "@/components/chat/chat-interface";
import { getChatWithMessages } from "@/lib/actions/chat";
import type { Message } from "@/types";

export default function ChatIdPage() {
  const params = useParams();
  const chatId = params.id as string;
  const [selectedChatId, setSelectedChatId] = useState<string>(chatId);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [isLoadingChat, setIsLoadingChat] = useState(false);

  const loadChatMessages = async (id: string) => {
    setIsLoadingChat(true);
    try {
      // Add timeout to prevent hanging
      const chatPromise = getChatWithMessages(id);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Chat fetch timeout")), 8000)
      );

      const result = (await Promise.race([chatPromise, timeoutPromise])) as {
        success: boolean;
        data?: { messages: Message[] };
      };
      if (result.success && result.data) {
        setChatMessages(result.data.messages || []);
      } else {
        setChatMessages([]);
      }
    } catch (error) {
      console.error("Failed to load chat messages:", error);
      setChatMessages([]);
    } finally {
      setIsLoadingChat(false);
    }
  };

  useEffect(() => {
    if (chatId) {
      setSelectedChatId(chatId);
      loadChatMessages(chatId);
    }
  }, [chatId]);

  const handleChatSelect = (id: string) => {
    setSelectedChatId(id);
    loadChatMessages(id);
  };

  const handleNewChat = () => {
    setSelectedChatId("");
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
