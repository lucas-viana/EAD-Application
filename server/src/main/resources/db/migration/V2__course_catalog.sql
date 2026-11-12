-- IDs publicados pela E2. Os IDs permanecem iguais quando o título mudar.
-- video_object_path: nome do arquivo no diretório de mídia local ou no bucket privado do Supabase Storage.

insert into ead.course_modules (id, title, position) values
  ('m01', 'Primeiros passos no computador', 1),
  ('m02', 'Organização de arquivos e pastas', 2),
  ('m03', 'Navegação e pesquisa na internet', 3),
  ('m04', 'Comunicação por e-mail', 4),
  ('m05', 'Produção de documentos de texto', 5),
  ('m06', 'Introdução às planilhas', 6);

insert into ead.lessons (id, module_id, position, title, video_object_path) values
  ('m01-a01', 'm01', 1, 'Conhecendo o computador', 'm01-a01.mp4'),
  ('m01-a02', 'm01', 2, 'Utilizando o mouse', 'm01-a02.mp4'),
  ('m01-a03', 'm01', 3, 'Utilizando o teclado', 'm01-a03.mp4'),
  ('m02-a01', 'm02', 1, 'Área de trabalho e janelas', 'm02-a01.mp4'),
  ('m02-a02', 'm02', 2, 'Criando e nomeando pastas', 'm02-a02.mp4'),
  ('m02-a03', 'm02', 3, 'Organizando e localizando arquivos', 'm02-a03.mp4'),
  ('m03-a01', 'm03', 1, 'Acessando páginas', 'm03-a01.mp4'),
  ('m03-a02', 'm03', 2, 'Realizando uma pesquisa', 'm03-a02.mp4'),
  ('m03-a03', 'm03', 3, 'Verificando uma informação', 'm03-a03.mp4'),
  ('m04-a01', 'm04', 1, 'Conhecendo o ambiente de e-mail', 'm04-a01.mp4'),
  ('m04-a02', 'm04', 2, 'Escrevendo e respondendo', 'm04-a02.mp4'),
  ('m04-a03', 'm04', 3, 'Trabalhando com anexos', 'm04-a03.mp4'),
  ('m05-a01', 'm05', 1, 'Criando um documento', 'm05-a01.mp4'),
  ('m05-a02', 'm05', 2, 'Formatando o conteúdo', 'm05-a02.mp4'),
  ('m05-a03', 'm05', 3, 'Salvando e exportando', 'm05-a03.mp4'),
  ('m06-a01', 'm06', 1, 'Conhecendo uma planilha', 'm06-a01.mp4'),
  ('m06-a02', 'm06', 2, 'Organizando despesas', 'm06-a02.mp4'),
  ('m06-a03', 'm06', 3, 'Calculando e atualizando o total', 'm06-a03.mp4');
