import { describe, expect, it } from 'vitest';
import { getLesson, getLessonNeighbors, getModules } from '../src/content/index.js';
import { authPath, sanitizeReturnTo } from '../src/features/auth/return-to.js';

describe('conteúdo do curso', () => {
  const modules = getModules();
  const lessons = modules.flatMap((module) => module.lessons);

  it('tem 6 módulos (m01…m06) e 18 aulas (m01-a01…m06-a03)', () => {
    expect(modules.map((m) => m.id)).toEqual(['m01', 'm02', 'm03', 'm04', 'm05', 'm06']);
    expect(lessons).toHaveLength(18);
    for (const module of modules) {
      expect(module.lessons.map((l) => l.id)).toEqual(
        [1, 2, 3].map((n) => `${module.id}-a0${n}`),
      );
    }
  });

  it('cada aula tem os campos do contrato e nenhum campo proibido', () => {
    for (const lesson of lessons) {
      for (const field of ['id', 'moduleId', 'title', 'order', 'description', 'workedExample', 'videoId']) {
        expect(lesson[field], `${lesson.id}.${field}`).toBeTruthy();
      }
      expect(lesson.videoId).toBe(lesson.id);
      // O JSON público não carrega URLs de vídeo, atividades, notas ou conclusão.
      const keys = Object.keys(lesson).join(' ');
      expect(keys).not.toMatch(/url|score|grade|activit|answer|complet|progress/i);
      expect(JSON.stringify(lesson)).not.toMatch(/https?:\/\/|\.mp4/i);
    }
  });

  it('podcast e infográfico pertencem ao módulo', () => {
    for (const module of modules) {
      expect(module.podcast.transcript).toHaveLength(3);
      expect(module.infographic.longDescription.length).toBeGreaterThan(40);
      for (const lesson of module.lessons) {
        expect(lesson.podcast).toBeUndefined();
        expect(lesson.infographic).toBeUndefined();
      }
    }
  });

  it('navegação anterior/próxima fica dentro do módulo', () => {
    expect(getLessonNeighbors('m01-a01')).toEqual({ previous: null, next: getLesson('m01-a02') });
    expect(getLessonNeighbors('m02-a02').previous.id).toBe('m02-a01');
    expect(getLessonNeighbors('m02-a03').next).toBeNull();
  });
});

describe('returnTo', () => {
  it('aceita apenas /modulos ou /aulas/:lessonId existente', () => {
    expect(sanitizeReturnTo('/aulas/m02-a02')).toBe('/aulas/m02-a02');
    expect(sanitizeReturnTo('/modulos')).toBe('/modulos');
    expect(sanitizeReturnTo('/aulas/m09-a01')).toBe('/modulos');
    expect(sanitizeReturnTo('https://exemplo.com')).toBe('/modulos');
    expect(sanitizeReturnTo('//exemplo.com')).toBe('/modulos');
    expect(sanitizeReturnTo('/minha-conta')).toBe('/modulos');
    expect(sanitizeReturnTo(null)).toBe('/modulos');
  });

  it('preserva o destino ao alternar entre as telas de acesso', () => {
    expect(authPath('/criar-acesso', '/aulas/m02-a02')).toBe('/criar-acesso?returnTo=%2Faulas%2Fm02-a02');
    expect(authPath('/entrar', '/modulos')).toBe('/entrar');
  });
});
