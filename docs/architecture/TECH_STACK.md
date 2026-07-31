# 技術スタック

現在実装されている構成を基準にしています。

| 分類 | 使用技術 | このアプリでの役割 |
| --- | --- | --- |
| Frontend | Next.js 16 / React 18 / TypeScript | 公開紹介ページ、ログイン、ゲーム操作、結果表示 |
| Hosting | 未確定（Cloudflareを候補として検討中） | Next.jsフロントエンドの公開 |
| Authentication | Amazon Cognito | 管理者作成のデモアカウント認証とJWT発行 |
| API | Amazon API Gateway HTTP API | リクエスト受付、JWT認証、流量制限 |
| Compute | AWS Lambda / Node.js 24 | ゲーム開始、言い訳の審査、結果取得 |
| Generative AI | Amazon Bedrock / Claude Haiku 4.5 | お題生成、3人の並列評価、最終コメント |
| Database | Amazon DynamoDB | ゲームセッション、結果、日次利用回数を保存 |
| Monitoring | Amazon CloudWatch Logs | Lambda実行ログを7日間保存 |
| Infrastructure as Code | AWS SAM / AWS CloudFormation | AWSリソースを `infra/template.yaml` で定義 |
| Test | Vitest | ゲーム処理、API、保存処理、利用回数制限を自動検証 |

## 現在構成の要点

- API Gateway、Lambda、DynamoDB、Bedrockを中心としたサーバーレス構成
- DynamoDBはオンデマンド課金
- ゲームデータは作成から24時間後にTTLで自動削除
- CloudWatch Logsの保持期間は7日
- 全ゲームAPIでCognito JWTを検証
- API Gatewayは1秒あたり2リクエスト、バースト5に制限
- 共有デモアカウントは日本時間の1日あたり20ゲームまで
- 1ゲームのBedrock呼び出しは通常5回、再試行時は最大10回

## 資料との対応

- [システム構成図](./system-architecture.drawio)：現在の実装と接続関係を反映
- [1ゲームの処理フロー図](./game-flow.mmd)：通常の成功経路に限定
- AWSリソース定義：`infra/template.yaml`
