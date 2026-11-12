# Vídeos das aulas (VIDEO_PROVIDER=local)

Coloque aqui um arquivo por aula, com o ID da aula como nome:

```
m01-a01.mp4  m01-a02.mp4  m01-a03.mp4
m02-a01.mp4  …            m06-a03.mp4
```

- Até 3 minutos cada, em MP4 (H.264 + AAC) para compatibilidade com todos os navegadores.
- Legendas: publique o arquivo `.vtt` e preencha `captions` na aula em `web/src/content/modules/mNN.json`.
- Sem o arquivo, a API responde 503 e a aula mostra o estado "O vídeo não carregou", com o texto como alternativa.
- O diretório é montado somente leitura no contêiner da API e nunca é servido diretamente pelo nginx:
  o acesso exige sessão e uma URL assinada que expira (`VIDEO_URL_TTL`).
