"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { Send, User, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { saveMessage } from "@/lib/actions/chat";
import type { Message as MessageType } from "@/types";

interface ChatInterfaceProps {
  chatId?: string;
  initialMessages?: MessageType[];
}

export function ChatInterface({ chatId, initialMessages = [] }: ChatInterfaceProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");

  // Convert initial messages to AI SDK format
  const convertedMessages = initialMessages.map((msg) => ({
    id: msg.id,
    role: msg.role as "user" | "assistant",
    parts: [{ type: "text" as const, text: msg.content }],
  }));

  const { messages, sendMessage, isLoading } = useChat({
    api: "/api/chat",
    initialMessages: convertedMessages,
    onFinish: async (message) => {
      // Save assistant message to database
      if (chatId && message.role === "assistant") {
        await saveMessage({
          chat_id: chatId,
          role: "assistant",
          content: message.parts.map(part => 
            part.type === "text" ? part.text : ""
          ).join(""),
        });
      }
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]");
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");

    // Save user message to database if we have a chatId
    if (chatId) {
      await saveMessage({
        chat_id: chatId,
        role: "user",
        content: userMessage,
      });
    }

    // Send message to AI
    sendMessage({ text: userMessage });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Messages */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
        <div className="space-y-4 max-w-4xl mx-auto">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Bot className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Start a conversation</h3>
              <p className="text-muted-foreground max-w-md">
                Ask me anything! I'm here to help you with questions, creative writing, 
                analysis, coding, and much more.
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "assistant" && (
                  <Avatar className="w-8 h-8 mt-1">
                    <AvatarFallback>
                      <Bot className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div
                  className={`max-w-[70%] rounded-lg px-4 py-3 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground ml-12"
                      : "bg-muted"
                  }`}
                >
                  {message.parts.map((part, i) => {
                    if (part.type === "text") {
                      return message.role === "user" ? (
                        <p key={i} className="whitespace-pre-wrap break-words">
                          {part.text}
                        </p>
                      ) : (
                        <div key={i} className="prose prose-sm max-w-none dark:prose-invert">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {part.text}
                          </ReactMarkdown>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>

                {message.role === "user" && (
                  <Avatar className="w-8 h-8 mt-1">
                    <AvatarFallback>
                      <User className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))
          )}
          
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <Avatar className="w-8 h-8 mt-1">
                <AvatarFallback>
                  <Bot className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-muted rounded-lg px-4 py-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce delay-200" />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
              className="min-h-[60px] max-h-32 resize-none"
              disabled={isLoading}
            />
            <Button 
              type="submit" 
              size="icon" 
              className="h-[60px] w-[60px]"
              disabled={!input.trim() || isLoading}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
