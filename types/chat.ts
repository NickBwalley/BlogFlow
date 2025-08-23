export interface Chat {
  id: string;
  title: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  chat_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
}

export interface CreateChatData {
  title?: string;
  user_id: string;
}

export interface CreateMessageData {
  chat_id: string;
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatWithMessages extends Chat {
  messages: Message[];
}
