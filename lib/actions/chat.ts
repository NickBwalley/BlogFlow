"use server";

import { createClient } from "@/lib/server";
import { revalidatePath } from "next/cache";
import type { Chat, Message, CreateChatData, CreateMessageData } from "@/types";

export async function createChat(data: { title?: string }) {
  const supabase = await createClient();

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Authentication required");
    }

    const chatData: CreateChatData = {
      title: data.title || "New Chat",
      user_id: user.id,
    };

    const { data: chat, error } = await supabase
      .from("chats")
      .insert(chatData)
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/chat");
    return { success: true, data: chat as Chat };
  } catch (error) {
    console.error("Error creating chat:", error);
    return { success: false, error: "Failed to create chat" };
  }
}

export async function deleteChat(chatId: string) {
  const supabase = await createClient();

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Authentication required");
    }

    const { error } = await supabase
      .from("chats")
      .delete()
      .eq("id", chatId)
      .eq("user_id", user.id);

    if (error) throw error;

    revalidatePath("/chat");
    return { success: true };
  } catch (error) {
    console.error("Error deleting chat:", error);
    return { success: false, error: "Failed to delete chat" };
  }
}

export async function getChats() {
  const supabase = await createClient();

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Authentication required");
    }

    const { data: chats, error } = await supabase
      .from("chats")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) throw error;

    return { success: true, data: chats as Chat[] };
  } catch (error) {
    console.error("Error fetching chats:", error);
    return { success: false, error: "Failed to fetch chats" };
  }
}

export async function getChatWithMessages(chatId: string) {
  const supabase = await createClient();

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Authentication required");
    }

    // Get chat
    const { data: chat, error: chatError } = await supabase
      .from("chats")
      .select("*")
      .eq("id", chatId)
      .eq("user_id", user.id)
      .single();

    if (chatError) throw chatError;

    // Get messages
    const { data: messages, error: messagesError } = await supabase
      .from("messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true });

    if (messagesError) throw messagesError;

    return {
      success: true,
      data: { ...chat, messages: messages || [] } as Chat & {
        messages: Message[];
      },
    };
  } catch (error) {
    console.error("Error fetching chat with messages:", error);
    return { success: false, error: "Failed to fetch chat" };
  }
}

export async function saveMessage(data: CreateMessageData) {
  const supabase = await createClient();

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Authentication required");
    }

    // Verify chat belongs to user
    const { data: chat, error: chatError } = await supabase
      .from("chats")
      .select("id")
      .eq("id", data.chat_id)
      .eq("user_id", user.id)
      .single();

    if (chatError || !chat) {
      throw new Error("Chat not found or access denied");
    }

    const { data: message, error } = await supabase
      .from("messages")
      .insert(data)
      .select()
      .single();

    if (error) throw error;

    // Update chat updated_at timestamp
    await supabase
      .from("chats")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", data.chat_id);

    return { success: true, data: message as Message };
  } catch (error) {
    console.error("Error saving message:", error);
    return { success: false, error: "Failed to save message" };
  }
}
