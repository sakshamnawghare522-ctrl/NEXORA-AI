-- ==============================================================================
-- NEXORA AI CHAT DATABASE SCHEMA & ROW-LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- 1. Create conversations table
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  workspace_id text not null,
  user_id text not null,
  title text not null default 'New Conversation',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Create messages table
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz not null default now()
);

-- 3. Indexes for fast retrieval
create index if not exists idx_conversations_user_workspace on public.conversations(user_id, workspace_id, updated_at desc);
create index if not exists idx_messages_conversation on public.messages(conversation_id, created_at asc);

-- 4. Enable Row Level Security (RLS)
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- 5. Row Level Security Policies for Conversations
create policy "Users can view their own conversations"
  on public.conversations for select
  using (
    auth.uid()::text = user_id 
    or user_id like 'usr_demo%'
  );

create policy "Users can insert their own conversations"
  on public.conversations for insert
  with check (
    auth.uid()::text = user_id 
    or user_id like 'usr_demo%'
  );

create policy "Users can update their own conversations"
  on public.conversations for update
  using (
    auth.uid()::text = user_id 
    or user_id like 'usr_demo%'
  );

create policy "Users can delete their own conversations"
  on public.conversations for delete
  using (
    auth.uid()::text = user_id 
    or user_id like 'usr_demo%'
  );

-- 6. Row Level Security Policies for Messages
create policy "Users can view messages belonging to their conversations"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
      and (c.user_id = auth.uid()::text or c.user_id like 'usr_demo%')
    )
  );

create policy "Users can insert messages into their conversations"
  on public.messages for insert
  with check (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
      and (c.user_id = auth.uid()::text or c.user_id like 'usr_demo%')
    )
  );

create policy "Users can delete messages in their conversations"
  on public.messages for delete
  using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
      and (c.user_id = auth.uid()::text or c.user_id like 'usr_demo%')
    )
  );
