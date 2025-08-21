-- Migration: Create chats and messages tables for AI chat functionality
-- Purpose: Set up tables for storing AI chat conversations with RLS policies
-- Affected: public.chats table, public.messages table
-- Date: 2025-01-20 11:30:00 EAT (Africa/Nairobi)

-- create chats table
create table if not exists public.chats (
    id uuid default gen_random_uuid() primary key,
    title text not null default 'New Chat',
    user_id uuid not null references auth.users(id) on delete cascade,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- create messages table
create table if not exists public.messages (
    id uuid default gen_random_uuid() primary key,
    chat_id uuid not null references public.chats(id) on delete cascade,
    role text not null check (role in ('user', 'assistant', 'system')),
    content text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- create indexes for better performance
create index if not exists idx_chats_user_id on public.chats(user_id);
create index if not exists idx_chats_created_at on public.chats(created_at desc);
create index if not exists idx_messages_chat_id on public.messages(chat_id);
create index if not exists idx_messages_created_at on public.messages(created_at);

-- enable row level security
alter table public.chats enable row level security;
alter table public.messages enable row level security;

-- create rls policies for chats table
-- policy: users can view their own chats
create policy "Users can view their own chats" on public.chats
    for select using (auth.uid() = user_id);

-- policy: users can insert their own chats
create policy "Users can insert their own chats" on public.chats
    for insert with check (auth.uid() = user_id);

-- policy: users can update their own chats
create policy "Users can update their own chats" on public.chats
    for update using (auth.uid() = user_id);

-- policy: users can delete their own chats
create policy "Users can delete their own chats" on public.chats
    for delete using (auth.uid() = user_id);

-- create rls policies for messages table
-- policy: users can view messages from their chats
create policy "Users can view messages from their chats" on public.messages
    for select using (
        exists (
            select 1 from public.chats
            where chats.id = messages.chat_id
            and chats.user_id = auth.uid()
        )
    );

-- policy: users can insert messages to their chats
create policy "Users can insert messages to their chats" on public.messages
    for insert with check (
        exists (
            select 1 from public.chats
            where chats.id = messages.chat_id
            and chats.user_id = auth.uid()
        )
    );

-- policy: users can update messages in their chats
create policy "Users can update messages in their chats" on public.messages
    for update using (
        exists (
            select 1 from public.chats
            where chats.id = messages.chat_id
            and chats.user_id = auth.uid()
        )
    );

-- policy: users can delete messages from their chats
create policy "Users can delete messages from their chats" on public.messages
    for delete using (
        exists (
            select 1 from public.chats
            where chats.id = messages.chat_id
            and chats.user_id = auth.uid()
        )
    );

-- create trigger for auto-updating updated_at on chats table
create trigger handle_chats_updated_at
    before update on public.chats
    for each row
    execute function public.handle_updated_at();
