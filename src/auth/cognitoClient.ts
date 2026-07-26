import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand
} from "@aws-sdk/client-cognito-identity-provider";

const authStorageKey = "iiwake-colosseum-auth";

export type AuthSession = {
  idToken: string;
  accessToken: string;
  expiresAt: number;
  email: string;
};

function getRegion() {
  return process.env.NEXT_PUBLIC_AWS_REGION || "ap-northeast-1";
}

function getClientId() {
  return process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || "";
}

export function isCognitoAuthConfigured() {
  return Boolean(getClientId());
}

function getCognitoClient() {
  return new CognitoIdentityProviderClient({ region: getRegion() });
}

function decodeJwtPayload(token: string): Record<string, unknown> {
  const [, payload] = token.split(".");
  if (!payload) {
    return {};
  }

  const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return JSON.parse(window.atob(padded)) as Record<string, unknown>;
}

export async function signInWithCognito(email: string, password: string): Promise<AuthSession> {
  const clientId = getClientId();
  if (!clientId) {
    throw new Error("Cognito client ID is not configured.");
  }

  const response = await getCognitoClient().send(
    new InitiateAuthCommand({
      AuthFlow: "USER_PASSWORD_AUTH",
      ClientId: clientId,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password
      }
    })
  );

  if (response.ChallengeName === "NEW_PASSWORD_REQUIRED") {
    throw new Error("一時パスワードの変更が必要です。AWSコンソールで恒久パスワードを設定してください。");
  }

  const idToken = response.AuthenticationResult?.IdToken;
  const accessToken = response.AuthenticationResult?.AccessToken;
  if (!idToken || !accessToken) {
    throw new Error("ログインに失敗しました。メールアドレスとパスワードを確認してください。");
  }

  const payload = decodeJwtPayload(idToken);
  const expiresAt = typeof payload.exp === "number" ? payload.exp * 1000 : Date.now() + 60 * 60 * 1000;

  return {
    idToken,
    accessToken,
    expiresAt,
    email
  };
}

export function saveAuthSession(session: AuthSession) {
  window.localStorage.setItem(authStorageKey, JSON.stringify(session));
}

export function loadAuthSession(): AuthSession | null {
  const raw = window.localStorage.getItem(authStorageKey);
  if (!raw) {
    return null;
  }

  try {
    const session = JSON.parse(raw) as AuthSession;
    if (!session.idToken || session.expiresAt <= Date.now()) {
      clearAuthSession();
      return null;
    }
    return session;
  } catch {
    clearAuthSession();
    return null;
  }
}

export function clearAuthSession() {
  window.localStorage.removeItem(authStorageKey);
}
