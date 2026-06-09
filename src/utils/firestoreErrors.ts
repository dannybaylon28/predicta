export function mapFirestoreError(error: unknown, fallback: string): Error {
  const code = (error as { code?: string }).code ?? "";

  if (code === "permission-denied") {
    return new Error(
      "Permisos insuficientes en la base de datos. Si eres el administrador, publica las reglas de Firestore actualizadas. Si el problema continua, contacta soporte.",
    );
  }

  if (error instanceof Error && error.message) {
    return error;
  }

  return new Error(fallback);
}
