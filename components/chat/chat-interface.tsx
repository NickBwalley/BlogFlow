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
import { toast } from "sonner";
import { saveMessage } from "@/lib/actions/chat";
// import { handleApiError } from "@/lib/utils/rate-limit-toast";
import type { Message as MessageType } from "@/types";

interface ChatInterfaceProps {
  chatId?: string;
  initialMessages?: MessageType[];
}

export function ChatInterface({
  chatId,
  initialMessages = [],
}: ChatInterfaceProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [allMessages, setAllMessages] = useState(initialMessages);

  const { messages: chatMessages, sendMessage } = useChat({
    onFinish: async (message) => {
      setIsLoading(false);
      // Save the assistant's message to database when response is complete
      if (chatId) {
        try {
          // Convert message to string content
          const content =
            typeof message === "string"
              ? message
              : ((message as unknown as Record<string, unknown>)
                  .content as string) ||
                ((message as unknown as Record<string, unknown>)
                  .text as string) ||
                JSON.stringify(message);

          await saveMessage({
            chat_id: chatId,
            role: "assistant",
            content,
          });
        } catch (error) {
          console.error("Error saving assistant message to database:", error);
        }
      }
    },
    onError: async (error) => {
      setIsLoading(false);
      console.error("Chat API error:", error);

      try {
        // Try to parse the error message if it's a JSON string
        let errorData = null;
        if (error.message.startsWith("{")) {
          errorData = JSON.parse(error.message);
        }

        // Check if it's a rate limit error
        if (
          error.message.includes("429") ||
          error.message.toLowerCase().includes("rate limit") ||
          error.message.toLowerCase().includes("too many requests") ||
          (errorData && errorData.error === "Too Many Requests")
        ) {
          const retryAfter = errorData?.retryAfter || 60;
          const retryTime =
            retryAfter < 60
              ? `${retryAfter} seconds`
              : `${Math.ceil(retryAfter / 60)} minutes`;

          toast.error("Rate Limit Exceeded", {
            description: `You're sending messages too quickly. Please wait ${retryTime} before trying again.`,
            duration: Math.min(retryAfter * 1000, 10000), // Show for retry time or max 10 seconds
            action: {
              label: "Dismiss",
              onClick: () => {},
            },
          });
        } else {
          toast.error("Chat Error", {
            description: "Failed to send message. Please try again.",
            duration: 5000,
          });
        }
      } catch {
        // Fallback if JSON parsing fails
        if (
          error.message.includes("429") ||
          error.message.toLowerCase().includes("rate limit") ||
          error.message.toLowerCase().includes("too many requests")
        ) {
          toast.error("Rate Limit Exceeded", {
            description:
              "You're sending messages too quickly. Please wait a moment before trying again.",
            duration: 5000,
          });
        } else {
          toast.error("Chat Error", {
            description: "Failed to send message. Please try again.",
            duration: 5000,
          });
        }
      }
    },
  });

  // Merge chat messages with initial messages
  useEffect(() => {
    // Convert AI SDK messages to our message format
    const convertedChatMessages = chatMessages.map((msg) => ({
      id: msg.id,
      chat_id: chatId || "",
      role: msg.role as "user" | "assistant",
      content:
        ((msg as unknown as Record<string, unknown>).content as string) ||
        JSON.stringify(msg),
      created_at: new Date().toISOString(),
    }));

    setAllMessages([...initialMessages, ...convertedChatMessages]);
  }, [chatMessages, initialMessages, chatId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [allMessages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");

    // Save user message to database first (if we have a chatId)
    if (chatId) {
      try {
        await saveMessage({
          chat_id: chatId,
          role: "user",
          content: userMessage,
        });
      } catch (error) {
        console.error("Error saving user message to database:", error);
      }
    }

    // Send message to AI - assistant response will be saved in onFinish
    setIsLoading(true);
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
          {allMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Bot className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Start a conversation
              </h3>
              <p className="text-muted-foreground max-w-md">
                Ask me anything! I&apos;m here to help you with questions,
                creative writing, analysis, coding, and much more.
              </p>
            </div>
          ) : (
            allMessages.map((message) => (
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
                  {message.role === "user" ? (
                    <p className="whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                  ) : (
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  )}
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
