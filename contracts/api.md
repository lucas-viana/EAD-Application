# Contratos da API

Base: `/api` (mesma origem do front-end; o nginx encaminha para o contêiner `server`).
Corpo de erro padrão: `{ "error": "codigo_estavel", "message": "Mensagem em português", "fields"?: { "campo": "mensagem" } }`.

## Sessão e segurança

- Sessão no servidor: cookie `ib_session` (HttpOnly, SameSite=Lax, Secure em produção). O banco guarda só o hash SHA-256 do token.
- CSRF: o servidor emite o cookie `XSRF-TOKEN`; toda requisição que altera dados envia o mesmo valor no cabeçalho `X-XSRF-TOKEN`.
  Sem o cabeçalho → `403 { error: "csrf_invalid" }`. O cliente (`web/src/services/api-client.js`) renova o token e repete uma vez.
- Sem sessão em rota protegida → `401 { error: "unauthenticated" }`.

## E1 • Autenticação e sessão

| Método | Rota | Entrada | Saída |
|---|---|---|---|
| GET | `/api/session` | — | `200 { authenticated: false }` ou `{ authenticated: true, user: { id, email, fullName, role, createdAt } }` |
| POST | `/api/auth/register` | `{ email, password }` | `201` sessão + cookie · `409 email_in_use` · `400 weak_password` |
| POST | `/api/auth/login` | `{ email, password }` | `200` sessão + cookie · `401 invalid_credentials` · `403 account_disabled` · `429 too_many_attempts` |
| POST | `/api/auth/logout` | — | `204`, sessão invalidada no servidor |
| POST | `/api/auth/password-reset` | `{ email }` | `202` confirmação genérica (não revela se a conta existe) |
| POST | `/api/auth/password-reset/confirm` | `{ token, password }` | `204` · `400 invalid_token` (expirado ou usado) |

- Senha: 8 a 64 caracteres. Hash BCrypt.
- Limites: 5 falhas de login por e-mail a cada 15 min; 30 por IP. 5 pedidos de recuperação por e-mail por hora.
- Token de recuperação: uso único, 1 hora, e invalida pedidos anteriores. Concluir a recuperação encerra todas as sessões.
- `returnTo` (front-end): aceita apenas `/modulos` ou `/aulas/:lessonId` existente; ausente ou inválido → `/modulos`.

## E3 • Vídeo protegido

| Método | Rota | Saída |
|---|---|---|
| GET | `/api/videos/:lessonId` | `200 { url, expiresAt }` · `401` sem sessão · `404 lesson_not_found` · `503 video_unavailable` |
| GET | `/api/media/videos/:lessonId?exp&sig` | Arquivo do vídeo (com suporte a `Range`) · `403 link_expired` |

- `VIDEO_PROVIDER=local`: URL assinada por HMAC-SHA256, válida por `VIDEO_URL_TTL` (15 min).
- `VIDEO_PROVIDER=supabase`: URL assinada pelo Supabase Storage (bucket privado), mesma validade.
- Uma URL já emitida vale até `expiresAt`; não há revogação instantânea. Ao sair, o front-end interrompe o player.

## E6 • Registro de acessos

| Método | Rota | Entrada | Saída |
|---|---|---|---|
| POST | `/api/access-events` | `{ type: "lesson_open", lessonId }` | `201 { recorded: true, duplicate: false }` na primeira abertura · `200 { recorded: false, duplicate: true }` na repetição · `404 lesson_not_found` |

- Chave única: `(event_type, session_id, lesson_id)`. Recarga e outra aba não duplicam; nova sessão conta novamente.
- O front-end registra ao abrir a aula com sessão, inclusive no retorno após o login, e reenvia falhas temporárias com a mesma chave.
- Acesso anônimo não entra no indicador. Acesso não comprova reprodução nem aprendizagem.

## Minha conta (usuário autenticado)

| Método | Rota | Entrada | Saída |
|---|---|---|---|
| GET | `/api/account` | — | `{ id, email, fullName, role, createdAt, lastLoginAt }` |
| PATCH | `/api/account` | `{ fullName?, email?, currentPassword? }` | conta atualizada · trocar e-mail exige `currentPassword` |
| PUT | `/api/account/password` | `{ currentPassword, newPassword }` | `204`; encerra as outras sessões |
| GET | `/api/account/sessions` | — | `[{ id, createdAt, lastSeenAt, userAgent, current }]` |
| POST | `/api/account/sessions/revoke-others` | — | `{ revoked }` |
| DELETE | `/api/account` | `{ password }` | `204`; remove a conta e as sessões. Acessos ficam só como contagem anônima |

## Administração (perfil ADMIN)

| Método | Rota | Entrada | Saída |
|---|---|---|---|
| GET | `/api/admin/users?query&page&size` | — | `{ items, page, size, totalItems, totalPages }` |
| PATCH | `/api/admin/users/:id` | `{ fullName?, role?: "LEARNER"\|"ADMIN", active? }` | usuário atualizado; desativar encerra as sessões |
| DELETE | `/api/admin/users/:id` | — | `204` |
| GET | `/api/admin/summary` | — | `{ totalUsers, activeUsers, admins, totalAccesses, lessons: [{ lessonId, moduleId, title, accesses }] }` |

- O perfil ADMIN é concedido pela variável `ADMIN_EMAILS` (no cadastro ou ao iniciar a API) ou por outro administrador.
- Ninguém altera o próprio perfil ou desativa a si mesmo; sempre resta pelo menos uma conta de administração.

## Conteúdo público (front-end)

`web/src/content/modules/m01.json … m06.json`:

- **Module**: `id, order, title, objective, credits, podcast { src, title, summary, transcript[] }, infographic { src, title, main, items[], highlight, longDescription }, lessons[3]`
- **Lesson**: `id, moduleId, order, title, topics, description, workedExample, supportHeading, videoId, videoCover, transcript, captions`

O JSON público não contém URLs privadas de vídeo, atividades, notas ou campos de conclusão. `videoId` é apenas uma referência.
