// Seis módulos e 18 aulas são dados (contrato E2). Um arquivo por módulo e equipe autora.
// O JSON público não contém URLs privadas de vídeo: videoId é apenas uma referência.
import m01 from './modules/m01.json';
import m02 from './modules/m02.json';
import m03 from './modules/m03.json';
import m04 from './modules/m04.json';
import m05 from './modules/m05.json';
import m06 from './modules/m06.json';

export const MODULES = [m01, m02, m03, m04, m05, m06].sort((a, b) => a.order - b.order);

const LESSONS = MODULES.flatMap((module) => module.lessons);
const MODULE_BY_ID = new Map(MODULES.map((module) => [module.id, module]));
const LESSON_BY_ID = new Map(LESSONS.map((lesson) => [lesson.id, lesson]));

export const getModules = () => MODULES;

export const getModule = (moduleId) => MODULE_BY_ID.get(moduleId) ?? null;

export const getLesson = (lessonId) => LESSON_BY_ID.get(lessonId) ?? null;

export const isKnownLesson = (lessonId) => LESSON_BY_ID.has(lessonId);

/**
 * Navegação dentro do módulo (sem atalhos para outro módulo):
 * primeira aula → "Todos os módulos" + "Próxima aula";
 * última aula → "Aula anterior" + "Voltar ao módulo".
 */
export function getLessonNeighbors(lessonId) {
  const lesson = getLesson(lessonId);
  if (!lesson) {
    return { previous: null, next: null };
  }
  const siblings = getModule(lesson.moduleId).lessons;
  const index = siblings.findIndex((item) => item.id === lessonId);
  return {
    previous: siblings[index - 1] ?? null,
    next: siblings[index + 1] ?? null,
  };
}

export const moduleNumber = (module) => module.order;

export const lessonLabel = (lesson) => {
  const module = getModule(lesson.moduleId);
  return `Módulo ${module.order} · Aula ${lesson.order} de ${module.lessons.length}`;
};

export const twoDigits = (value) => String(value).padStart(2, '0');
