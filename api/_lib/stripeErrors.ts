export function mapStripeError(error: unknown, fallback: string): string {
  const stripeError = error as {
    type?: string;
    message?: string;
    code?: string;
  };

  if (stripeError.type === "StripeAuthenticationError") {
    return "La configuracion de Stripe no es valida. Actualiza STRIPE_SECRET_KEY en Vercel.";
  }

  if (stripeError.type === "StripeInvalidRequestError") {
    if (stripeError.code === "amount_too_small") {
      return "El monto del plan es demasiado bajo para esta moneda.";
    }
    return stripeError.message || fallback;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
