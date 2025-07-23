-- Supabase schema for MemoQuiz Enhanced

-- 1. folders table
create table if not exists folders (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  "createdAt" timestamptz not null,
  "updatedAt" timestamptz not null,
  user_id text
);

-- 2. notes table
create table if not exists notes (
  id uuid primary key default gen_random_uuid(),
  folder_id uuid references folders(id) on delete cascade,
  user_id text,
  title text not null,
  content text,
  "createdAt" timestamptz not null,
  "updatedAt" timestamptz not null,
  "lastReviewed" timestamptz,
  "easeFactor" float
);

-- 3. categories table
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null,
  description text,
  "createdAt" timestamptz not null,
  "updatedAt" timestamptz not null
);

-- 4. entries table
create table if not exists entries (
  id uuid primary key default gen_random_uuid(),
  categoryId uuid references categories(id) on delete cascade,
  title text not null,
  content text,
  type text not null,
  tags text[],
  "createdAt" timestamptz not null,
  "updatedAt" timestamptz not null,
  "lastReviewed" timestamptz,
  "easeFactor" float
);

-- 5. quiz_questions table
create table if not exists quiz_questions (
  id uuid primary key default gen_random_uuid(),
  folder_id uuid references folders(id),
  note_id uuid references notes(id),
  user_id text,
  question text,
  answer text,
  type text,
  options text[],
  front text,
  back text,
  tags text[],
  hint text,
  explanation text,
  blanks text[],
  "correctOrder" text[],
  difficulty jsonb,
  "learningMetrics" jsonb,
  "easeFactor" float,
  interval int,
  repetitions int,
  "lastReviewed" timestamptz,
  "nextReviewDate" timestamptz,
  stability float,
  difficulty_sr float,
  retrievability float,
  lapses int,
  suspended boolean,
  buried boolean,
  "memoryPalace" jsonb,
  mnemonics text[],
  "relatedQuestions" text[],
  "createdAt" timestamptz,
  "updatedAt" timestamptz,
  source text,
  confidence int
);

-- 6. quiz_results table
create table if not exists quiz_results (
  id uuid primary key default gen_random_uuid(),
  folder_id uuid references folders(id),
  user_id text,
  "date" timestamptz,
  "correctAnswers" int,
  "totalQuestions" int,
  "questionResults" jsonb
); 