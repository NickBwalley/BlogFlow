"use client";

import { useState, useEffect } from "react";
import { Plus, MessageSquare, Trash2, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { createChat, deleteChat, getChats } from "@/lib/actions/chat";
import type { Chat } from "@/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ChatSidebarProps {
  selectedChatId?: string;
  onChatSelect: (chatId: string) => void;
  onNewChat: () => void;
}

export function ChatSidebar({ selectedChatId, onChatSelect, onNewChat }: ChatSidebarProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadChats = async () => {
    setIsLoading(true);
    const result = await getChats();
    if (result.success) {
      setChats(result.data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadChats();
  }, []);

  const handleNewChat = async () => {
    const result = await createChat({ title: "New Chat" });
    if (result.success && result.data) {
      await loadChats();
      onChatSelect(result.data.id);
      onNewChat();
    }
  };

  const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const result = await deleteChat(chatId);
    if (result.success) {
      await loadChats();
      if (selectedChatId === chatId) {
        onNewChat();
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="flex h-full w-80 flex-col border-r bg-muted/50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">Chat</h2>
        <Button onClick={handleNewChat} size="sm" className="h-8 w-8 p-0">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Chat List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-16 w-full rounded-lg bg-muted animate-pulse"
                />
              ))}
            </div>
          ) : chats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <MessageSquare className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No chats yet</p>
              <p className="text-xs text-muted-foreground">Start a new conversation</p>
            </div>
          ) : (
            <div className="space-y-1">
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  className={cn(
                    "group flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-accent transition-colors",
                    selectedChatId === chat.id && "bg-accent"
                  )}
                  onClick={() => onChatSelect(chat.id)}
                >
                  <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{chat.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(chat.updated_at)}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => handleDeleteChat(chat.id, e)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
