/** Genera un id locale univoco (non serve un backend: basta essere unici sul dispositivo). */
export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
