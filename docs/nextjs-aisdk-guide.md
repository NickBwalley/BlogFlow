# Next.js + AI-SDK Integration Guide for Chat Applications

## Overview

This comprehensive guide walks you through integrating AI-SDK with Next.js to build robust, streaming chat applications. Based on real-world implementation experience, this guide covers everything from basic setup to advanced patterns, common pitfalls, and production-ready solutions.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation & Setup](#installation--setup)
3. [Project Structure](#project-structure)
4. [Core Implementation](#core-implementation)
5. [Advanced Features](#advanced-features)
6. [Database Integration](#database-integration)
7. [Authentication & Security](#authentication--security)
8. [Performance Optimization](#performance-optimization)
9. [Common Pitfalls & Solutions](#common-pitfalls--solutions)
10. [Production Deployment](#production-deployment)
11. [Testing Strategies](#testing-strategies)

## Prerequisites

Before starting, ensure you have:

- **Node.js 18+** installed
- **Next.js 15+** (App Router)
- **OpenAI API Key** (or other provider credentials)
- **Database setup** (Supabase recommended)
- **TypeScript knowledge** (strongly recommended)

## Installation & Setup

### 1. Install Core Dependencies

```bash
# Core AI-SDK packages
pnpm add ai @ai-sdk/react @ai-sdk/openai

# Additional dependencies for full functionality
pnpm add zod react-markdown remark-gfm

# UI components (optional but recommended)
pnpm add @radix-ui/react-avatar @radix-ui/react-separator
pnpm add lucide-react
```

### 2. Environment Configuration

Create `.env.local`:

```env
# OpenAI Configuration
OPENAI_API_KEY=sk-proj-your-api-key-here

# Database Configuration (Supabase example)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. TypeScript Configuration

Update `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

## Project Structure

Organize your chat implementation with this recommended structure:

```
app/
├── api/
│   └── chat/
│       └── route.ts              # Streaming chat API endpoint
├── chat/
│   ├── layout.tsx               # Chat page layout with sidebar
│   ├── page.tsx                 # Main chat interface
│   └── [id]/
│       └── page.tsx             # Individual chat view
components/
├── chat/
│   ├── chat-interface.tsx       # Main chat component
│   ├── chat-sidebar.tsx         # Chat history sidebar
│   └── chat-creation-modal.tsx  # New chat modal
├── ui/
│   ├── avatar.tsx
│   ├── button.tsx
│   ├── scroll-area.tsx
│   └── sidebar.tsx
lib/
├── actions/
│   └── chat.ts                  # Server actions for chat management
├── utils/
│   └── markdown-utils.ts        # Markdown processing utilities
types/
├── chat.ts                      # Chat-related type definitions
└── index.ts                     # Exported types
```

## Core Implementation

### 1. API Route Handler

Create `app/api/chat/route.ts`:

```typescript
import { openai } from "@ai-sdk/openai";
import { streamText, UIMessage, convertToModelMessages } from "ai";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response("Invalid messages format", { status: 400 });
    }

    const result = streamText({
      model: openai("gpt-4o"),
      messages: convertToModelMessages(messages),
      maxTokens: 4000,
      temperature: 0.7,
      // Add system message for context
      system:
        "You are a helpful assistant. Provide clear, concise, and accurate responses.",
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
```

### 2. Chat Interface Component

Create `components/chat/chat-interface.tsx`:

```typescript
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

interface ChatInterfaceProps {
  chatId?: string;
  initialMessages?: any[];
}

export function ChatInterface({
  chatId,
  initialMessages = [],
}: ChatInterfaceProps) {
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
    onError: (error) => {
      console.error("Chat error:", error);
      // Handle error (show toast, etc.)
    },
    onFinish: async (message) => {
      // Save message to database if needed
      if (chatId && message.role === "assistant") {
        // await saveMessage(chatId, message);
      }
    },
  });

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
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");

    // Save user message to database if needed
    if (chatId) {
      // await saveMessage(chatId, { role: "user", content: userMessage });
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
              <h3 className="text-lg font-semibold mb-2">
                Start a conversation
              </h3>
              <p className="text-muted-foreground max-w-md">
                Ask me anything! I'm here to help you with questions, creative
                writing, analysis, coding, and much more.
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
                        <div
                          key={i}
                          className="prose prose-sm max-w-none dark:prose-invert"
                        >
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
```

### 3. Type Definitions

Create `types/chat.ts`:

```typescript
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
```

## Advanced Features

### 1. Tool Integration

Add tools to your AI for enhanced functionality:

```typescript
import { tool } from "ai";
import { z } from "zod";

// In your API route
const result = streamText({
  model: openai("gpt-4o"),
  messages: convertToModelMessages(messages),
  tools: {
    weather: tool({
      description: "Get the weather in a location",
      inputSchema: z.object({
        location: z.string().describe("The location to get the weather for"),
      }),
      execute: async ({ location }) => {
        // Implement weather API call
        const response = await fetch(`/api/weather?location=${location}`);
        return await response.json();
      },
    }),
    calculator: tool({
      description: "Perform mathematical calculations",
      inputSchema: z.object({
        expression: z.string().describe("Mathematical expression to evaluate"),
      }),
      execute: async ({ expression }) => {
        // Implement safe calculation
        try {
          const result = eval(expression); // Use a safer eval alternative in production
          return { result };
        } catch (error) {
          return { error: "Invalid expression" };
        }
      },
    }),
  },
});
```

### 2. Multi-Step Conversations

Enable multi-step tool usage:

```typescript
import { stepCountIs } from "ai";

const result = streamText({
  model: openai("gpt-4o"),
  messages: convertToModelMessages(messages),
  stopWhen: stepCountIs(5), // Allow up to 5 steps
  tools: {
    // Your tools here
  },
  onStepFinish: ({ step, toolCalls, toolResults }) => {
    console.log("Step finished:", { step, toolCalls, toolResults });
  },
});
```

### 3. Streaming Custom Data

Stream additional data alongside messages:

```typescript
import { streamText, StreamData } from "ai";

export async function POST(req: Request) {
  const data = new StreamData();

  const result = streamText({
    model: openai("gpt-4o"),
    messages: convertToModelMessages(messages),
    onFinish() {
      data.append({ status: "completed", timestamp: new Date().toISOString() });
      data.close();
    },
  });

  return result.toUIMessageStreamResponse({ data });
}
```

## Database Integration

### 1. Database Schema (Supabase)

```sql
-- Create chats table
CREATE TABLE IF NOT EXISTS public.chats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL DEFAULT 'New Chat',
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own chats" ON public.chats
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chats" ON public.chats
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_chats_user_id ON public.chats(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON public.messages(chat_id);
```

### 2. Server Actions

Create `lib/actions/chat.ts`:

```typescript
"use server";

import { createClient } from "@/lib/server";
import { revalidatePath } from "next/cache";

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

    const chatData = {
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
    return { success: true, data: chat };
  } catch (error) {
    console.error("Error creating chat:", error);
    return { success: false, error: "Failed to create chat" };
  }
}

export async function saveMessage(data: {
  chat_id: string;
  role: "user" | "assistant" | "system";
  content: string;
}) {
  const supabase = await createClient();

  try {
    const { data: message, error } = await supabase
      .from("messages")
      .insert(data)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data: message };
  } catch (error) {
    console.error("Error saving message:", error);
    return { success: false, error: "Failed to save message" };
  }
}
```

## Authentication & Security

### 1. Protected Routes

Wrap chat pages with authentication:

```typescript
import { ProtectedRoute } from "@/components/protected-route";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      {/* Your chat layout */}
      {children}
    </ProtectedRoute>
  );
}
```

### 2. API Route Protection

Secure your API endpoints:

```typescript
export async function POST(req: Request) {
  // Verify authentication
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Continue with chat logic...
}
```

### 3. Input Validation

Use Zod for input validation:

```typescript
import { z } from "zod";

const ChatMessageSchema = z.object({
  messages: z
    .array(
      z.object({
        id: z.string(),
        role: z.enum(["user", "assistant", "system"]),
        parts: z.array(
          z.object({
            type: z.literal("text"),
            text: z.string().min(1).max(10000),
          })
        ),
      })
    )
    .min(1)
    .max(100),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validatedData = ChatMessageSchema.parse(body);

    // Process validated data...
  } catch (error) {
    return new Response("Invalid input", { status: 400 });
  }
}
```

## Performance Optimization

### 1. Streaming Optimization

```typescript
// Enable compression for streaming
export const runtime = "edge";
export const maxDuration = 30;

// Use appropriate model selection
const model =
  process.env.NODE_ENV === "production"
    ? openai("gpt-4o-mini") // Faster for production
    : openai("gpt-4o"); // More capable for development
```

### 2. Message Chunking

Handle large conversation histories:

```typescript
const MAX_MESSAGES = 20;
const trimmedMessages = messages.slice(-MAX_MESSAGES);
```

### 3. Caching Strategies

```typescript
// Cache common responses
import { unstable_cache } from "next/cache";

const getCachedResponse = unstable_cache(
  async (prompt: string) => {
    // Generate response
  },
  ["chat-responses"],
  { revalidate: 3600 } // Cache for 1 hour
);
```

## Common Pitfalls & Solutions

### 1. Memory Leaks in useChat

**Problem**: Not cleaning up subscriptions

**Solution**:

```typescript
useEffect(() => {
  const subscription = supabase.auth.onAuthStateChange(() => {
    // Handle auth changes
  });

  return () => subscription.unsubscribe();
}, []);
```

### 2. Infinite Re-renders

**Problem**: Unstable dependencies in useEffect

**Solution**:

```typescript
const processedContent = useMemo(() => {
  return isMarkdown ? markdownToHtml(content) : content;
}, [content, isMarkdown]);

useEffect(() => {
  // Use stable references
}, [editor, processedContent]);
```

### 3. CORS Issues

**Problem**: Cross-origin requests failing

**Solution**:

```typescript
// In your API route
export async function POST(req: Request) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers });
  }

  // Your logic here
  return new Response(data, { headers });
}
```

### 4. Token Limit Exceeded

**Problem**: Conversations become too long

**Solution**:

```typescript
const summarizeConversation = async (messages: Message[]) => {
  if (messages.length > 20) {
    // Summarize older messages
    const summary = await streamText({
      model: openai("gpt-4o-mini"),
      prompt: `Summarize this conversation: ${JSON.stringify(
        messages.slice(0, -10)
      )}`,
    });

    return [
      { role: "system", content: `Previous conversation summary: ${summary}` },
      ...messages.slice(-10),
    ];
  }
  return messages;
};
```

### 5. Race Conditions

**Problem**: Multiple messages sent simultaneously

**Solution**:

```typescript
const [isSubmitting, setIsSubmitting] = useState(false);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (isSubmitting) return;

  setIsSubmitting(true);
  try {
    await sendMessage({ text: input });
  } finally {
    setIsSubmitting(false);
  }
};
```

## Production Deployment

### 1. Environment Variables

```bash
# Production environment variables
OPENAI_API_KEY=sk-proj-production-key
DATABASE_URL=postgresql://production-db
NEXT_PUBLIC_APP_URL=https://yourapp.com
VERCEL_ENV=production
```

### 2. Rate Limiting

```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "1 m"), // 10 requests per minute
});

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") ?? "localhost";
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return new Response("Rate limit exceeded", { status: 429 });
  }

  // Continue with chat logic...
}
```

### 3. Error Monitoring

```typescript
import * as Sentry from "@sentry/nextjs";

export async function POST(req: Request) {
  try {
    // Your chat logic
  } catch (error) {
    Sentry.captureException(error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
```

### 4. Health Checks

```typescript
// app/api/health/route.ts
export async function GET() {
  try {
    // Check OpenAI API
    const response = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    });

    if (!response.ok) throw new Error("OpenAI API unavailable");

    return Response.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json(
      { status: "unhealthy", error: error.message },
      { status: 503 }
    );
  }
}
```

## Testing Strategies

### 1. Unit Tests

```typescript
// __tests__/chat-utils.test.ts
import { describe, it, expect } from "vitest";
import { formatMessage, validateInput } from "@/lib/chat-utils";

describe("Chat Utils", () => {
  it("should format messages correctly", () => {
    const message = { role: "user", content: "Hello" };
    const formatted = formatMessage(message);
    expect(formatted).toEqual(
      expect.objectContaining({
        role: "user",
        parts: [{ type: "text", text: "Hello" }],
      })
    );
  });

  it("should validate input", () => {
    expect(validateInput("")).toBe(false);
    expect(validateInput("Valid message")).toBe(true);
    expect(validateInput("a".repeat(10001))).toBe(false);
  });
});
```

### 2. Integration Tests

```typescript
// __tests__/chat-api.test.ts
import { POST } from "@/app/api/chat/route";

describe("/api/chat", () => {
  it("should handle valid requests", async () => {
    const request = new Request("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({
        messages: [
          { id: "1", role: "user", parts: [{ type: "text", text: "Hello" }] },
        ],
      }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
  });
});
```

### 3. E2E Tests

```typescript
// e2e/chat.spec.ts
import { test, expect } from "@playwright/test";

test("chat flow", async ({ page }) => {
  await page.goto("/chat");

  // Type a message
  await page.fill('[placeholder*="Type your message"]', "Hello, AI!");
  await page.click('button[type="submit"]');

  // Wait for response
  await expect(page.locator(".bg-muted")).toBeVisible();

  // Verify message appears
  await expect(page.locator("text=Hello, AI!")).toBeVisible();
});
```

## Conclusion

This guide provides a comprehensive foundation for integrating AI-SDK with Next.js. The key to success is:

1. **Start Simple**: Begin with basic chat functionality
2. **Iterate Gradually**: Add features incrementally
3. **Monitor Performance**: Keep track of response times and error rates
4. **Test Thoroughly**: Implement comprehensive testing strategies
5. **Plan for Scale**: Design with growth in mind

Remember to:

- Always validate user inputs
- Implement proper error handling
- Monitor API usage and costs
- Keep security in mind throughout development
- Test edge cases and error scenarios

For more advanced use cases, refer to the [AI-SDK documentation](https://sdk.vercel.ai/docs) and consider the specific needs of your application.

## Additional Resources

- [AI-SDK Official Documentation](https://sdk.vercel.ai/docs)
- [Next.js App Router Documentation](https://nextjs.org/docs/app)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [React Markdown Documentation](https://github.com/remarkjs/react-markdown)

---

_This guide is based on real-world implementation experience and is updated regularly with new patterns and best practices._
