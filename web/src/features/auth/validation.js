// Validação no navegador para orientar antes do envio. O servidor valida novamente.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 64;

export function validateEmail(value) {
  if (!value.trim()) {
    return 'Informe seu e-mail.';
  }
  if (!EMAIL.test(value.trim())) {
    return 'Digite um e-mail válido, como nome@exemplo.com.';
  }
  return null;
}

export function validateNewPassword(value) {
  if (value.length < PASSWORD_MIN) {
    return `Use uma senha com pelo menos ${PASSWORD_MIN} caracteres.`;
  }
  if (value.length > PASSWORD_MAX) {
    return `Use uma senha com até ${PASSWORD_MAX} caracteres.`;
  }
  if (!value.trim()) {
    return 'A senha não pode conter apenas espaços.';
  }
  return null;
}

export function validateConfirmation(password, confirmation) {
  if (!confirmation) {
    return 'Repita a senha para conferir.';
  }
  return password === confirmation ? null : 'As senhas não são iguais. Digite a mesma senha.';
}
