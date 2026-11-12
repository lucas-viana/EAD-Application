const dateFormat = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' });
const dateTimeFormat = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

export const formatDate = (value) => (value ? dateFormat.format(new Date(value)) : '—');

export const formatDateTime = (value) => (value ? dateTimeFormat.format(new Date(value)) : '—');

/** Descrição simples do navegador e sistema, sem expor o texto técnico completo. */
export function describeDevice(userAgent) {
  if (!userAgent) {
    return 'Dispositivo desconhecido';
  }
  const browser = /Edg\//.test(userAgent)
    ? 'Edge'
    : /OPR\//.test(userAgent)
      ? 'Opera'
      : /Firefox\//.test(userAgent)
        ? 'Firefox'
        : /Chrome\//.test(userAgent)
          ? 'Chrome'
          : /Safari\//.test(userAgent)
            ? 'Safari'
            : 'Navegador';
  const system = /Android/.test(userAgent)
    ? 'Android'
    : /iPhone|iPad/.test(userAgent)
      ? 'iPhone/iPad'
      : /Windows/.test(userAgent)
        ? 'Windows'
        : /Mac OS X/.test(userAgent)
          ? 'macOS'
          : /Linux/.test(userAgent)
            ? 'Linux'
            : 'sistema desconhecido';
  return `${browser} no ${system}`;
}
