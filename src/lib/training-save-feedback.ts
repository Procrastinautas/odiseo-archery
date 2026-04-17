const CONFLICT_ERROR_PATTERNS = [
  /conflict/i,
  /conflicto/i,
  /duplicate/i,
  /already exists/i,
  /ya existe/i,
  /unique constraint/i,
  /violates unique/i,
];

function normalizeErrorMessage(error: string) {
  return error.trim().replace(/\s+/g, " ");
}

export function getTrainingSaveToastMessage(
  entityLabel: string,
  error: string,
) {
  const normalizedError = normalizeErrorMessage(error);
  const isConflict = CONFLICT_ERROR_PATTERNS.some((pattern) =>
    pattern.test(normalizedError),
  );

  if (isConflict) {
    return `Hay un conflicto al guardar ${entityLabel}. Revisa la versión más reciente e inténtalo de nuevo.`;
  }

  return `No se pudo guardar ${entityLabel}. Intenta nuevamente.`;
}
