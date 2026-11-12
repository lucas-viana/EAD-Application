# Informática Básica • plataforma de autoaprendizado

Aplicação construída a partir do arquivo Figma *Informática Básica | UX UI Design System + Desktop + Mobile*
(páginas 00 a 06; as páginas 90/91 são histórico e não foram implementadas).

Curso assíncrono com 6 módulos e 18 aulas. Cada aula tem vídeo (até 3 min), texto descritivo e exemplo explicado;
podcast e infográfico pertencem ao módulo. **Texto, podcast e infográfico são públicos; a conta libera os vídeos e
identifica os acessos às aulas.** Não há exercícios, notas, progresso, certificado ou painel docente.

```
Navegador ──► web (nginx + React)  ──/api──►  server (Spring Boot, Java 21)  ──JDBC──►  PostgreSQL (Supabase)
                 │ arquivos estáticos              │ sessão, vídeos, acessos             schema "ead"
                 └ /media/podcasts                 └ media/videos (URL assinada) ou Supabase Storage
```

| Pasta | Conteúdo | Responsável (Figma) |
|---|---|---|
| `web/src/features/auth` | Entrar, criar acesso, recuperar e redefinir senha, sessão, `returnTo` | E1 |
| `web/src/features/catalog` | Início, catálogo, página do módulo | E2 |
| `web/src/features/resources` | Vídeo, podcast, transcrições, infográfico | E3 |
| `web/src/features/classroom` | Aula parametrizada (`/aulas/:lessonId`) e navegação | E4 |
| `web/src/features/study-help` | Como estudar | E5 |
| `web/src/features/analytics` | Registro de abertura da aula | E6 |
| `web/src/features/account` · `admin` | Minha conta e administração de usuários | — |
| `web/src/content/modules` | `m01.json … m06.json` (um módulo por equipe autora) | E1–E6 |
| `web/src/styles/tokens.css` | Variáveis *Informática Básica / Core* | — |
| `server/` | API: `auth`, `account`, `admin`, `media`, `analytics` | E1, E3, E6 |
| `contracts/api.md` | Contratos de entrada, saída e erro | todas |

## Rodar com Docker

Pré-requisito: Docker Desktop.

```bash
cp .env.example .env
```

Edite o `.env` com os dados do Supabase (próxima seção) e suba:

```bash
docker compose up --build
```

Acesse http://localhost:8080. A API cria as tabelas sozinha (Flyway) na primeira execução.

**Sem Supabase (desenvolvimento):** no `.env`, use o bloco "PostgreSQL local" e suba com o perfil `local-db`:

```bash
docker compose --profile local-db up --build
```

## Configurar o Supabase

1. Crie um projeto em https://supabase.com e guarde a senha do banco.
2. No painel, clique em **Connect** e copie a connection string do **Session pooler** (porta 5432, funciona em redes IPv4 e no Docker).
3. Preencha o `.env` convertendo a URI para JDBC:
   - `DATABASE_URL=jdbc:postgresql://aws-0-<região>.pooler.supabase.com:5432/postgres?sslmode=require`
   - `DATABASE_USERNAME=postgres.<project-ref>`
   - `DATABASE_PASSWORD=<senha do banco>`
4. Na primeira execução, o Flyway cria o schema `ead` com as tabelas `app_users`, `user_sessions`,
   `password_reset_tokens`, `course_modules`, `lessons` e `access_events`.

Por que um schema próprio: o Supabase expõe o schema `public` pela Data API (PostgREST). As tabelas da aplicação
ficam em `ead`, com RLS ativado e sem permissões para os papéis `anon`/`authenticated`; só a API Java acessa.
Evite o *Transaction pooler* (porta 6543): ele não suporta *prepared statements* da forma usada pelo Hibernate.

**Vídeos no Supabase Storage (opcional):** crie um bucket **privado** `videos`, envie `m01-a01.mp4 … m06-a03.mp4`
e configure `VIDEO_PROVIDER=supabase`, `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` (a chave fica só no servidor).

## Mídias

- **Vídeos**: `media/videos/<lessonId>.mp4` (ou bucket do Supabase). Sem arquivo, a aula mostra "O vídeo não carregou".
- **Podcasts**: `web/public/media/podcasts/m01.mp3 … m06.mp3`. Sem arquivo, a aula avisa e oferece a transcrição.
- **Infográficos**: renderizados a partir do JSON do módulo, com descrição equivalente. Para usar uma imagem final,
  preencha `infographic.src` (ex.: `/media/infographics/m02.png`) e `infographic.alt`.
- **Legendas e transcrições dos vídeos**: campos `captions` (arquivo `.vtt`) e `transcript` de cada aula.

Os textos do m02 seguem exatamente o Figma. Os títulos e itens dos infográficos de m01 e m03–m06 e as capas dos
vídeos foram derivados dos textos das aulas e devem ser revisados pelas equipes autoras.

## Contas e administração

- Cadastro com e-mail e senha (8 a 64 caracteres), como no Figma. Em **Minha conta** o usuário edita nome e e-mail,
  troca a senha, vê e encerra sessões em outros dispositivos e exclui a conta.
- E-mails listados em `ADMIN_EMAILS` recebem o perfil de administração. Em **Usuários** (`/admin/usuarios`) é possível
  buscar contas, alterar perfil, desativar/reativar, excluir e ver os acessos identificados por aula.
- Recuperação de senha: com `SMTP_*` configurado, o link é enviado por e-mail; sem SMTP, aparece no log da API
  (`docker compose logs server`).

## Desenvolvimento sem Docker

```bash
docker compose --profile local-db up db
```

```bash
cd server && mvn spring-boot:run -Dspring-boot.run.arguments="--app.session.cookie-secure=false"
```

```bash
cd web && npm install && npm run dev
```

O Vite (http://localhost:5173) encaminha `/api` para a API em http://localhost:8080.

## Testes

```bash
cd server && mvn test
```

```bash
cd web && npm test
```

Os testes da API incluem um fluxo completo contra PostgreSQL real via Testcontainers (requer Docker; sem Docker são
ignorados): cadastro, login, CSRF, vídeo protegido (200/401/404/503, URL assinada), deduplicação de acessos por
sessão+aula, logout no servidor, recuperação de senha, Minha conta e administração.

## Segurança

- Sessão no servidor com cookie HttpOnly/SameSite=Lax (Secure em produção: `COOKIE_SECURE=true` com HTTPS).
- Proteção CSRF (cookie `XSRF-TOKEN` + cabeçalho), senhas com BCrypt, limite de tentativas, respostas genéricas
  na recuperação de acesso, tokens armazenados apenas como hash.
- Vídeos só por URL assinada e temporária; o JSON público não contém endereços de vídeo.
- Cabeçalhos de segurança e CSP no nginx; a API não expõe `actuator` publicamente.
