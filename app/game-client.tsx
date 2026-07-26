"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  clearAuthSession,
  isCognitoAuthConfigured,
  loadAuthSession,
  saveAuthSession,
  signInWithCognito,
  type AuthSession
} from "@/src/auth/cognitoClient";
import type { GameResult, Scenario } from "@/src/domain/types";
import { scoreAxes } from "@/src/domain/gameRules";

type ScreenState = "idle" | "scenario" | "judging" | "result";

type StartResponse = {
  sessionId: string;
  scenario: Scenario;
};

type SubmitResponse = {
  result: GameResult;
};

const judgeTone: Record<string, string> = {
  prosecutor: "追及",
  defender: "擁護",
  crowd: "喝采"
};

const apiBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");
const authEnabled = isCognitoAuthConfigured();

function apiUrl(path: string) {
  return `${apiBaseUrl}${path}`;
}

export function GameClient() {
  const [authReady, setAuthReady] = useState(!authEnabled);
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);
  const [screen, setScreen] = useState<ScreenState>("idle");
  const [sessionId, setSessionId] = useState("");
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [excuse, setExcuse] = useState("");
  const [result, setResult] = useState<GameResult | null>(null);
  const [error, setError] = useState("");
  const [revealedJudges, setRevealedJudges] = useState(0);

  const canSubmit = useMemo(() => excuse.trim().length > 0 && excuse.length <= 600, [excuse]);

  useEffect(() => {
    if (!authEnabled) {
      return;
    }

    setAuthSession(loadAuthSession());
    setAuthReady(true);
  }, []);

  useEffect(() => {
    if (screen !== "result" || !result) {
      return;
    }

    setRevealedJudges(0);
    const timer = window.setInterval(() => {
      setRevealedJudges((current) => {
        if (current >= result.judgeComments.length) {
          window.clearInterval(timer);
          return current;
        }
        return current + 1;
      });
    }, 650);

    return () => window.clearInterval(timer);
  }, [result, screen]);

  function requestHeaders(headers: Record<string, string> = {}) {
    if (!authEnabled || !authSession) {
      return headers;
    }

    return {
      ...headers,
      Authorization: `Bearer ${authSession.idToken}`
    };
  }

  function resetGame() {
    setScreen("idle");
    setSessionId("");
    setScenario(null);
    setExcuse("");
    setResult(null);
    setError("");
    setRevealedJudges(0);
  }

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoginBusy(true);

    try {
      const session = await signInWithCognito(loginEmail.trim(), loginPassword);
      saveAuthSession(session);
      setAuthSession(session);
      setLoginPassword("");
      resetGame();
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "ログインに失敗しました。");
    } finally {
      setLoginBusy(false);
    }
  }

  function handleSignOut() {
    clearAuthSession();
    setAuthSession(null);
    resetGame();
  }

  function handleUnauthorized() {
    if (!authEnabled) {
      return;
    }

    clearAuthSession();
    setAuthSession(null);
    setError("ログインの有効期限が切れました。もう一度ログインしてください。");
  }

  async function startGame() {
    setError("");
    setResult(null);
    setExcuse("");
    setScreen("judging");

    const response = await fetch(apiUrl("/api/game/start"), {
      method: "POST",
      headers: requestHeaders()
    });

    const body = (await response.json()) as StartResponse | { error: string };
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        handleUnauthorized();
      }
      setScreen("idle");
      setError("error" in body ? body.error : "お題の生成に失敗しました。");
      return;
    }

    const start = body as StartResponse;
    setSessionId(start.sessionId);
    setScenario(start.scenario);
    setScreen("scenario");
  }

  async function submitExcuse() {
    if (!canSubmit) {
      setError("言い訳は1〜600文字で入力してください。");
      return;
    }

    setError("");
    setScreen("judging");

    const response = await fetch(apiUrl("/api/game/submit"), {
      method: "POST",
      headers: requestHeaders({
        "Content-Type": "application/json"
      }),
      body: JSON.stringify({ sessionId, excuse })
    });

    const body = (await response.json()) as SubmitResponse | { error: string };
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        handleUnauthorized();
      }
      setScreen("scenario");
      setError("error" in body ? body.error : "審査に失敗しました。");
      return;
    }

    setResult((body as SubmitResponse).result);
    setScreen("result");
  }

  if (!authReady) {
    return (
      <main className="arena-shell">
        <section className="arena-stage" aria-live="polite">
          <div className="judging-panel">
            <div className="pulse-ring" />
            <p>ログイン状態を確認しています。</p>
          </div>
        </section>
      </main>
    );
  }

  if (authEnabled && !authSession) {
    return (
      <main className="arena-shell">
        <section className="arena-stage auth-stage" aria-live="polite">
          <div className="brand-strip">
            <img className="arena-mark" src="/arena-glyph.svg" alt="" />
            <div>
              <p className="kicker">認証が必要です</p>
              <h1>言い訳コロシアム</h1>
            </div>
          </div>

          <form className="auth-panel" onSubmit={handleSignIn}>
            <label htmlFor="login-email">メールアドレス</label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              value={loginEmail}
              onChange={(event) => setLoginEmail(event.target.value)}
              required
            />

            <label htmlFor="login-password">パスワード</label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={loginPassword}
              onChange={(event) => setLoginPassword(event.target.value)}
              required
            />

            <button className="primary-action compact" type="submit" disabled={loginBusy}>
              {loginBusy ? "ログイン中" : "ログイン"}
            </button>
          </form>

          {error ? <p className="error-text">{error}</p> : null}
        </section>
      </main>
    );
  }

  return (
    <main className="arena-shell">
      <section className="arena-stage" aria-live="polite">
        <div className="brand-strip">
          <img className="arena-mark" src="/arena-glyph.svg" alt="" />
          <div>
            <p className="kicker">AI審判団、開廷</p>
            <h1>言い訳コロシアム</h1>
          </div>
        </div>

        {authEnabled ? (
          <div className="session-strip">
            <span>{authSession?.email}</span>
            <button className="secondary-action compact" type="button" onClick={handleSignOut}>
              ログアウト
            </button>
          </div>
        ) : null}

        {screen === "idle" ? (
          <div className="start-grid">
            <div className="court-callout">
              <p className="label">今日の被告席</p>
              <p className="large-copy">理不尽な事件に、言葉だけで勝つ。</p>
            </div>
            <button className="primary-action" type="button" onClick={startGame}>
              お題を受ける
            </button>
          </div>
        ) : null}

        {scenario ? (
          <section className="scenario-panel">
            <div>
              <p className="label">世界線</p>
              <h2>{scenario.worldType}</h2>
            </div>
            <div className="incident-box">
              <p className="label">事件</p>
              <p>{scenario.incident}</p>
            </div>
            <dl className="scenario-facts">
              <div>
                <dt>被告</dt>
                <dd>{scenario.defendantRole}</dd>
              </div>
              <div>
                <dt>怒れる相手</dt>
                <dd>{scenario.angryParty}</dd>
              </div>
            </dl>
          </section>
        ) : null}

        {screen === "scenario" ? (
          <section className="excuse-panel">
            <label htmlFor="excuse">言い訳</label>
            <textarea
              id="excuse"
              maxLength={600}
              value={excuse}
              onChange={(event) => setExcuse(event.target.value)}
              placeholder="反省、交渉、詭弁、泣き落とし。使えるものは全部使ってください。"
            />
            <div className="input-footer">
              <span>{excuse.length}/600</span>
              <button className="primary-action compact" type="button" onClick={submitExcuse} disabled={!canSubmit}>
                審査へ進む
              </button>
            </div>
          </section>
        ) : null}

        {screen === "judging" ? (
          <section className="judging-panel">
            <div className="pulse-ring" />
            <p>審査員がざわついています。</p>
          </section>
        ) : null}

        {screen === "result" && result ? (
          <section className="result-panel">
            <div className="verdict">
              <p className="label">判定</p>
              <strong>{result.finalJudgement.rank}</strong>
              <span>{result.finalJudgement.totalScore}/100</span>
            </div>

            <div className="score-grid">
              {scoreAxes.map((axis) => (
                <div key={axis} className="score-tile">
                  <span>{axis}</span>
                  <meter min={0} max={20} value={result.finalJudgement.axisScores[axis]} />
                  <strong>{result.finalJudgement.axisScores[axis]}</strong>
                </div>
              ))}
            </div>

            <div className="judge-list">
              {result.judgeComments.slice(0, revealedJudges).map((judge) => (
                <article key={judge.role} className="judge-card">
                  <div>
                    <p className="label">{judgeTone[judge.role]}</p>
                    <h3>{judge.displayName}</h3>
                  </div>
                  <p>{judge.comment}</p>
                </article>
              ))}
            </div>

            {revealedJudges >= result.judgeComments.length ? (
              <div className="final-comment">
                <p>{result.finalJudgement.finalComment}</p>
                <small>{result.finalJudgement.improvementPoint}</small>
              </div>
            ) : null}

            <button className="secondary-action" type="button" onClick={startGame}>
              もう一度挑む
            </button>
          </section>
        ) : null}

        {error ? <p className="error-text">{error}</p> : null}
      </section>
    </main>
  );
}
