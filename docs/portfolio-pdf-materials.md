# 言い訳コロシアム PDF作成用メモ

ポートフォリオサイトには表示せず、後でPDFへまとめるための技術構成資料です。

## 技術構成

### 画面から生成AIまでをAWSで接続

処理は次の順番で流れます。

1. ゲーム画面
2. Amazon API Gateway
3. AWS Lambda
4. Amazon Bedrock

## 使用技術と役割

| 技術 | 役割 |
| --- | --- |
| Next.js | 紹介ページ・ゲーム画面 |
| Amazon API Gateway | 画面からのリクエスト受付 |
| AWS Lambda | ゲーム進行とAI呼び出し |
| Amazon Bedrock | お題・審査コメントの生成 |
| Amazon Cognito | ログインとAPI保護 |
| Amazon DynamoDB | ゲームデータの一時保存 |
| Amazon CloudWatch | エラーログの確認 |
| AWS SAM | AWS構成のビルド・デプロイ |
