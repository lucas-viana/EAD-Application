-- Informática Básica • esquema da API
-- As tabelas ficam no schema "ead", fora do schema "public" exposto pela Data API do Supabase.
-- A aplicação Java é a única cliente deste schema.

create schema if not exists ead;

-- Usuários (E1). E-mail é único sem diferenciar maiúsculas/minúsculas.
create table ead.app_users (
  id             uuid primary key default gen_random_uuid(),
  email          varchar(254) not null,
  password_hash  varchar(255) not null,
  full_name      varchar(120),
  role           varchar(20)  not null default 'LEARNER' check (role in ('LEARNER', 'ADMIN')),
  active         boolean      not null default true,
  created_at     timestamptz  not null default now(),
  updated_at     timestamptz  not null default now(),
  last_login_at  timestamptz
);
create unique index ux_app_users_email on ead.app_users (lower(email));

-- Sessões validadas no servidor (E1). O cookie carrega um token aleatório; aqui fica apenas o hash SHA-256.
create table ead.user_sessions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid        not null references ead.app_users (id) on delete cascade,
  token_hash    varchar(64) not null unique,
  created_at    timestamptz not null default now(),
  last_seen_at  timestamptz not null default now(),
  expires_at    timestamptz not null,
  revoked_at    timestamptz,
  user_agent    varchar(255),
  ip_address    varchar(64)
);
create index ix_user_sessions_user on ead.user_sessions (user_id);
create index ix_user_sessions_expires on ead.user_sessions (expires_at);

-- Recuperação de acesso (E1). Token de uso único, armazenado como hash.
create table ead.password_reset_tokens (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid        not null references ead.app_users (id) on delete cascade,
  token_hash  varchar(64) not null unique,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null,
  used_at     timestamptz
);
create index ix_password_reset_user on ead.password_reset_tokens (user_id);

-- Registro de IDs do curso (E2). O conteúdo público fica nos arquivos do front-end;
-- aqui ficam apenas os IDs válidos e o caminho privado de cada vídeo (E3).
create table ead.course_modules (
  id        varchar(3)   primary key check (id ~ '^m0[1-6]$'),
  title     varchar(120) not null,
  position  integer      not null unique
);

create table ead.lessons (
  id                 varchar(7)   primary key check (id ~ '^m0[1-6]-a0[1-3]$'),
  module_id          varchar(3)   not null references ead.course_modules (id),
  position           integer      not null,
  title              varchar(160) not null,
  video_object_path  varchar(255),
  unique (module_id, position)
);

-- Acessos identificados às aulas (E6): uma ocorrência por sessão autenticada + aula.
-- Ao excluir uma conta, o vínculo pessoal é removido e a contagem agregada é preservada.
create table ead.access_events (
  id           bigint generated always as identity primary key,
  event_type   varchar(32) not null check (event_type in ('lesson_open')),
  session_id   uuid        references ead.user_sessions (id) on delete set null,
  user_id      uuid        references ead.app_users (id) on delete set null,
  lesson_id    varchar(7)  not null references ead.lessons (id),
  occurred_at  timestamptz not null default now(),
  constraint ux_access_events_session_lesson unique (event_type, session_id, lesson_id)
);
create index ix_access_events_lesson on ead.access_events (lesson_id);

-- Defesa em profundidade para o Supabase: RLS ativo sem políticas bloqueia anon/authenticated
-- caso o schema venha a ser exposto. O dono das tabelas (conexão da API) não é afetado.
alter table ead.app_users enable row level security;
alter table ead.user_sessions enable row level security;
alter table ead.password_reset_tokens enable row level security;
alter table ead.course_modules enable row level security;
alter table ead.lessons enable row level security;
alter table ead.access_events enable row level security;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on schema ead from anon';
    execute 'revoke all on all tables in schema ead from anon';
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke all on schema ead from authenticated';
    execute 'revoke all on all tables in schema ead from authenticated';
  end if;
end $$;
