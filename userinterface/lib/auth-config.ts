export interface AuthEnvironment {
  BETTER_AUTH_SECRET?: string;
  BETTER_AUTH_URL?: string;
  NODE_ENV?: string;
}

export interface AuthSettings {
  secret: string;
  baseURL: string;
  trustedOrigins: string[];
  emailAndPassword: { enabled: true; disableSignUp: boolean };
  user: {
    additionalFields: {
      role: { type: "string"; required: true; defaultValue: "customer"; input: boolean };
    };
  };
}

export function getAuthSettings(
  environment: AuthEnvironment,
  options: { allowSignUp?: boolean } = {},
): AuthSettings {
  const secret = environment.BETTER_AUTH_SECRET;
  if (!secret) throw new Error("BETTER_AUTH_SECRET muss gesetzt sein.");
  if (secret.length < 32) throw new Error("BETTER_AUTH_SECRET muss mindestens 32 Zeichen lang sein.");

  const baseURL = environment.BETTER_AUTH_URL;
  if (!baseURL) throw new Error("BETTER_AUTH_URL muss auf die öffentliche Anwendungs-URL zeigen.");

  let parsedURL: URL;
  try {
    parsedURL = new URL(baseURL);
  } catch {
    throw new Error("BETTER_AUTH_URL muss eine absolute HTTP(S)-URL sein.");
  }

  if (parsedURL.protocol !== "http:" && parsedURL.protocol !== "https:") {
    throw new Error("BETTER_AUTH_URL muss eine absolute HTTP(S)-URL sein.");
  }
  if (environment.NODE_ENV === "production" && parsedURL.protocol !== "https:") {
    throw new Error("BETTER_AUTH_URL muss in Produktion HTTPS verwenden.");
  }
  if (parsedURL.username || parsedURL.password) {
    throw new Error("BETTER_AUTH_URL darf keine Zugangsdaten enthalten.");
  }
  if (parsedURL.search || parsedURL.hash) {
    throw new Error("BETTER_AUTH_URL darf keine Query- oder Fragmentwerte enthalten.");
  }

  return {
    secret,
    baseURL,
    trustedOrigins: [parsedURL.origin],
    emailAndPassword: { enabled: true, disableSignUp: !options.allowSignUp },
    user: {
      additionalFields: {
        role: { type: "string", required: true, defaultValue: "customer", input: options.allowSignUp === true },
      },
    },
  };
}
