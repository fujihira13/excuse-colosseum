# 言い訳コロシアム｜アーキテクチャ資料

このページは、現在実装されている構成だけを対象にしています。追加機能を前提とした将来構成は含めていません。

## システム構成図

Next.jsのフロントエンドから、AWSの認証・API・Lambda・生成AI・データ保存・ログへ接続する全体像です。フロントエンドの公開ホスティング先は未確定です。

![言い訳コロシアムのシステム構成図](./system-architecture.png)

- [PNG](./system-architecture.png)：READMEやポートフォリオへの掲載用
- [SVG](./system-architecture.svg)：拡大表示用
- [draw.io](./system-architecture.drawio)：diagrams.netで編集するための元データ

## 1ゲームの処理フロー

```mermaid
sequenceDiagram
    autonumber
    actor User as 利用者
    participant Frontend as Next.js
    participant Cognito as Amazon Cognito
    participant Api as API Gateway
    participant Lambda as AWS Lambda
    participant Bedrock as Amazon Bedrock
    participant DynamoDB as Amazon DynamoDB

    User->>Frontend: メールアドレス・パスワードを入力
    Frontend->>Cognito: ログイン要求
    Cognito-->>Frontend: JWTを発行

    User->>Frontend: ゲーム開始
    Frontend->>Api: POST /api/game/start（JWT付き）
    Api->>Api: JWTを検証
    Api->>Lambda: StartGameFunction
    Lambda->>DynamoDB: 日本時間の日次利用回数を更新
    DynamoDB-->>Lambda: 20回未満なら継続
    Lambda->>Bedrock: お題を生成
    Bedrock-->>Lambda: お題JSON
    Lambda->>DynamoDB: セッションを保存（TTL 24時間）
    Lambda-->>Frontend: sessionId・お題

    User->>Frontend: 最大600文字の言い訳を送信
    Frontend->>Api: POST /api/game/submit（JWT付き）
    Api->>Api: JWTを検証
    Api->>Lambda: SubmitExcuseFunction
    Lambda->>DynamoDB: セッションを取得

    par 検察官AI
        Lambda->>Bedrock: 言い訳を審査
        Bedrock-->>Lambda: 評価・コメント
    and 弁護人AI
        Lambda->>Bedrock: 言い訳を審査
        Bedrock-->>Lambda: 評価・コメント
    and 民衆AI
        Lambda->>Bedrock: 言い訳を審査
        Bedrock-->>Lambda: 評価・コメント
    end

    Lambda->>Lambda: 3名の5軸スコアを集計
    Lambda->>Bedrock: 最終コメントを生成
    Bedrock-->>Lambda: 総評・改善ポイント
    Lambda->>DynamoDB: 完了結果を保存
    Lambda-->>Frontend: スコア・コメント・最終判定

    Note over Lambda,Bedrock: Bedrock呼び出しは通常5回
```

- [Mermaidソース](./game-flow.mmd)
- [詳細フロー PNG](./game-flow.png)
- [詳細フロー SVG](./game-flow.svg)
- [詳細フロー draw.io](./game-flow.drawio)

## AWS SAMテンプレート

[AWS SAMテンプレート](../../infra/template.yaml)には、現在使用する次のリソースを定義しています。

- Amazon Cognito User Pool / App Client
- Amazon API Gateway HTTP API / JWT Authorizer
- AWS Lambda 3関数
- Amazon DynamoDB
- Amazon CloudWatch Logs

`sam validate` と `sam build` はローカルの検証・配布用ファイル作成であり、それだけではAWSリソースの変更や料金発生はありません。AWSへ反映されるのは `sam deploy` を実行したときです。

## 技術スタック

各技術の役割は[技術スタック一覧](./TECH_STACK.md)にまとめています。

## 構成図を更新する

```bash
npm run architecture:generate
```

生成元は `scripts/generate-architecture-diagrams.mjs` です。PNG・SVG・draw.ioを同時に更新します。
