# Verificação da integração

Roteiro de aceite técnico (página 03 do Figma). Os testes são das equipes desenvolvedoras, não atividades dos cursistas.

## Automatizado

| Verificação | Onde |
|---|---|
| 6 módulos, 18 aulas, IDs m01…m06 / m01-a01…m06-a03, sem campos proibidos no JSON público | `web/tests/content.test.js` |
| `returnTo` aceita só `/modulos` ou aula existente; destino preservado ao alternar telas | `web/tests/content.test.js` |
| Aula pública: texto livre, vídeo pede login com retorno à mesma aula | `web/tests/pages.test.jsx` |
| Login pelo vídeo: estado de erro, retorno à aula e registro `lesson_open` | `web/tests/pages.test.jsx` |
| Vídeo indisponível (503): "Tentar novamente" e "Ler o texto da aula" | `web/tests/pages.test.jsx` |
| CSRF obrigatório em operações que alteram dados | `server/.../ApiIntegrationTest` |
| Cadastro, login (e-mail sem diferenciar maiúsculas), sessão HttpOnly, logout invalida no servidor | `server/.../ApiIntegrationTest` |
| Vídeo: 401 sem sessão, 404 aula desconhecida, 503 sem arquivo, URL assinada e assinatura adulterada → 403 | `server/.../ApiIntegrationTest` |
| Acessos: 201 na primeira abertura, 200 duplicate na recarga, nova sessão conta novamente, aula inválida → 404 | `server/.../ApiIntegrationTest` |
| Recuperação: resposta genérica, token de uso único, sessões antigas encerradas | `server/.../ApiIntegrationTest` |
| Minha conta: nome, troca de e-mail com senha, troca de senha encerra outros dispositivos, exclusão | `server/.../ApiIntegrationTest` |
| Administração: 403 para cursista, busca, desativação encerra sessões, resumo de acessos | `server/.../ApiIntegrationTest` |

## Resultado da última verificação (11/11/2026)

- `server`: 12 testes (5 unitários + 7 de integração contra PostgreSQL 17 via Testcontainers) — todos passaram.
- `web`: 10 testes (Vitest + Testing Library) — todos passaram; build de produção sem erros.
- Stack Docker (`--profile local-db`): migrações V1/V2 aplicadas; cadastro, CSRF, vídeo 503 sem arquivo,
  acesso 201 → 200 duplicate, `/actuator` bloqueado no nginx; login pelo vídeo retorna à mesma aula no navegador;
  sessão e deduplicação mantidas após reiniciar a API; sem rolagem horizontal em 320 px.
- Não verificado: conexão com um projeto Supabase real, envio de e-mail por SMTP, reprodução de mídias reais
  (os arquivos de vídeo e áudio ainda não existem).

## Manual (antes do aceite final)

- Teclado: navegar todas as telas só com Tab/Shift+Tab/Enter; foco sempre visível.
- Leitor de tela: títulos anunciados ao trocar de página; erros de formulário anunciados.
- Reflow em 320 px e layouts em 390 px e 1440 px.
- Persistência após reinício: `docker compose restart server` mantém sessões e contagem de acessos.
- Mídias reais: vídeos com legendas, podcasts e infográficos finais de cada módulo.
- E-mail de recuperação com SMTP real.
