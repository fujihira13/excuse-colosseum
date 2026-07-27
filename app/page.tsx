import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "言い訳コロシアム | AWS・生成AI 学習プロジェクト",
  description: "Amazon Bedrockを使った、AI審査員と「言い訳」で勝負するテキストゲームの紹介ページです。"
};

const playSteps = [
  {
    title: "お題を受ける",
    body: "AIが、世界線・事件・被告の立場・怒っている相手を組み合わせた理不尽なお題を作ります。"
  },
  {
    title: "言い訳を考える",
    body: "最大600文字で自由に弁明します。反省、交渉、詭弁、泣き落とし。使えるものは何でも使えます。"
  },
  {
    title: "AI審判団が審査する",
    body: "検察官・弁護人・民衆の3人が異なる立場から採点し、最後にランクと判定結果を返します。"
  }
];

export default function Home() {
  return (
    <main className="portfolio-page">
      <header className="portfolio-header">
        <Link className="portfolio-brand" href="/" aria-label="言い訳コロシアム 紹介ページ">
          <img src="/arena-glyph.svg" alt="" />
          <span>言い訳コロシアム</span>
        </Link>
        <nav aria-label="ページ内ナビゲーション">
          <a href="#about">概要</a>
          <Link className="portfolio-login-link" href="/game">
            ログイン
          </Link>
        </nav>
      </header>

      <section className="portfolio-hero" aria-labelledby="portfolio-title">
        <div>
          <h1 id="portfolio-title">その言い訳、AI審判団を納得させられるか。</h1>
          <p className="portfolio-lead">
            「言い訳コロシアム」は、AIが生み出す理不尽なお題に対して、自分の言葉で弁明するテキストゲームです。
            3人のAI審査員が、それぞれの立場から言い訳を評価します。
          </p>
          <div className="portfolio-actions">
            <a className="portfolio-primary-link" href="#about">
              ゲームについて見る
            </a>
            <Link className="portfolio-secondary-link" href="/game">
              ゲームにログイン
            </Link>
          </div>
        </div>

        <aside className="portfolio-summary-card" aria-label="ゲームの概要">
          <p>AI審判団</p>
          <ul>
            <li>
              <span>検察官AI</span>
              <small>矛盾と責任を追及</small>
            </li>
            <li>
              <span>弁護人AI</span>
              <small>言い訳の可能性を擁護</small>
            </li>
            <li>
              <span>民衆AI</span>
              <small>面白さと共感で評価</small>
            </li>
          </ul>
          <div>
            <strong>5</strong>
            <span>つの評価軸</span>
          </div>
        </aside>
      </section>

      <section className="portfolio-section" id="about" aria-labelledby="about-title">
        <div className="portfolio-section-heading">
          <p>ゲーム概要</p>
          <h2 id="about-title">理不尽な事件に、言葉だけで挑む。</h2>
        </div>
        <div className="portfolio-intro-grid">
          <p>
            AIが毎回異なる世界と事件を生成するため、同じ展開になりにくいことが特徴です。正解を当てるゲームではなく、
            大喜利のような発想、誠実な謝罪、強引な交渉など、プレイヤーの言葉選びを楽しみます。
          </p>
          <dl>
            <div>
              <dt>プレイ形式</dt>
              <dd>1人用・テキスト入力</dd>
            </div>
            <div>
              <dt>評価</dt>
              <dd>説得力・面白さ・誠実さ・リスク回避力・整合性</dd>
            </div>
            <div>
              <dt>判定</dt>
              <dd>100点満点・S〜E／EXランク</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="portfolio-section portfolio-muted-section" aria-labelledby="flow-title">
        <div className="portfolio-section-heading">
          <p>遊び方</p>
          <h2 id="flow-title">1ゲーム、3つの流れ。</h2>
        </div>
        <ol className="portfolio-steps">
          {playSteps.map((step, index) => (
            <li key={step.title}>
              <span>{index + 1}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* PDFが完成したら、この位置にPDFへのリンクまたは表示欄を追加する。 */}

      <section className="portfolio-cta" aria-labelledby="cta-title">
        <div>
          <h2 id="cta-title">ゲームを開く</h2>
        </div>
        <Link className="portfolio-primary-link" href="/game">
          ログイン画面へ
        </Link>
      </section>
    </main>
  );
}
