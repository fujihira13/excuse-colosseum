import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const outputDir = path.join(root, "docs", "architecture");
const iconDir = path.join(outputDir, "icons");

const palette = {
  ink: "#232F3E",
  muted: "#5F6B7A",
  line: "#8793A1",
  border: "#CBD5E1",
  paper: "#FFFFFF",
  canvas: "#F7F8FA",
  aws: "#FF9900",
  awsSoft: "#FFF4E5",
  blue: "#146EB4",
  blueSoft: "#EAF4FB",
  green: "#1B7F5A",
  greenSoft: "#E9F6F0",
  purple: "#7A43B6",
  purpleSoft: "#F3ECFA"
};

const iconFiles = {
  apiGateway: "amazon-api-gateway.svg",
  bedrock: "amazon-bedrock.svg",
  cloudWatch: "amazon-cloudwatch.svg",
  cognito: "amazon-cognito.svg",
  dynamoDb: "amazon-dynamodb.svg",
  lambda: "aws-lambda.svg"
};

const iconSources = Object.fromEntries(
  Object.entries(iconFiles).map(([key, file]) => {
    return [key, fs.readFileSync(path.join(iconDir, file), "utf8")];
  })
);
const icons = Object.fromEntries(
  Object.entries(iconSources).map(([key, source]) => [
    key,
    `data:image/svg+xml;base64,${Buffer.from(source).toString("base64")}`
  ])
);
const drawioIcons = Object.fromEntries(
  Object.entries(iconSources).map(([key, source]) => [
    key,
    `data:image/svg+xml,${encodeURIComponent(source)}`
  ])
);

const frontendSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 56">
  <rect x="4" y="6" width="56" height="44" rx="5" fill="none" stroke="#111827" stroke-width="4"/>
  <path d="M4 17h56" stroke="#111827" stroke-width="4"/>
  <circle cx="12" cy="12" r="2" fill="#111827"/>
  <circle cx="19" cy="12" r="2" fill="#111827"/>
</svg>`;
icons.frontend = `data:image/svg+xml;base64,${Buffer.from(frontendSvg).toString("base64")}`;
drawioIcons.frontend = `data:image/svg+xml,${encodeURIComponent(frontendSvg)}`;

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function text(x, y, value, options = {}) {
  const {
    anchor = "start",
    color = palette.ink,
    size = 18,
    weight = 400,
    lines = 1
  } = options;
  const values = String(value).split("\n");
  const tspans = values
    .map(
      (line, index) =>
        `<tspan x="${x}" dy="${index === 0 ? 0 : size * 1.35}">${escapeXml(line)}</tspan>`
    )
    .join("");
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" fill="${color}" font-family="'Noto Sans JP','Yu Gothic',sans-serif" font-size="${size}" font-weight="${weight}" data-lines="${lines}">${tspans}</text>`;
}

function roundedRect(x, y, width, height, options = {}) {
  const {
    fill = palette.paper,
    stroke = palette.border,
    strokeWidth = 2,
    radius = 18,
    dash = ""
  } = options;
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"${dash ? ` stroke-dasharray="${dash}"` : ""}/>`;
}

function iconNode({ x, y, width = 180, height = 150, icon, title, detail, fill = palette.paper }) {
  return [
    roundedRect(x, y, width, height, { fill, stroke: palette.border, radius: 16 }),
    `<image href="${icon}" x="${x + width / 2 - 34}" y="${y + 18}" width="68" height="68"/>`,
    text(x + width / 2, y + 108, title, { anchor: "middle", size: 18, weight: 500 }),
    detail ? text(x + width / 2, y + 132, detail, { anchor: "middle", size: 13, color: palette.muted }) : ""
  ].join("");
}

function arrow({ x1, y1, x2, y2, label = "", color = palette.ink, dashed = false, labelY }) {
  const marker = color === palette.aws ? "arrow-orange" : "arrow";
  const line = `<path d="M ${x1} ${y1} L ${x2} ${y2}" fill="none" stroke="${color}" stroke-width="3"${dashed ? ' stroke-dasharray="8 7"' : ""} marker-end="url(#${marker})"/>`;
  if (!label) {
    return line;
  }
  const labelX = (x1 + x2) / 2;
  const y = labelY ?? (y1 + y2) / 2 - 10;
  const labelWidth = Math.max(76, Math.min(132, [...label].length * 13 + 22));
  return `${line}${roundedRect(labelX - labelWidth / 2, y - 21, labelWidth, 30, {
    fill: palette.canvas,
    stroke: palette.canvas,
    strokeWidth: 0,
    radius: 8
  })}${text(labelX, y, label, { anchor: "middle", size: 13, color: palette.muted })}`;
}

function routedArrow({ points, label = "", labelX, labelY, color = palette.ink, dashed = false }) {
  const marker = color === palette.aws ? "arrow-orange" : "arrow";
  const [first, ...rest] = points;
  const path = rest.reduce(
    (value, point) => `${value} L ${point[0]} ${point[1]}`,
    `M ${first[0]} ${first[1]}`
  );
  const line = `<path d="${path}" fill="none" stroke="${color}" stroke-width="3"${dashed ? ' stroke-dasharray="8 7"' : ""} marker-end="url(#${marker})"/>`;
  if (!label) {
    return line;
  }
  const labelWidth = Math.max(76, Math.min(150, [...label].length * 13 + 22));
  return `${line}${roundedRect(labelX - labelWidth / 2, labelY - 21, labelWidth, 30, {
    fill: palette.canvas,
    stroke: palette.canvas,
    strokeWidth: 0,
    radius: 8
  })}${text(labelX, labelY, label, { anchor: "middle", size: 13, color: palette.muted })}`;
}

function svgShell({ width, height, title, subtitle, body }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">
  <title id="title">${escapeXml(title)}</title>
  <desc id="desc">${escapeXml(subtitle)}</desc>
  <defs>
    <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
      <path d="M0,0 L0,6 L9,3 z" fill="${palette.ink}"/>
    </marker>
    <marker id="arrow-orange" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
      <path d="M0,0 L0,6 L9,3 z" fill="${palette.aws}"/>
    </marker>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="130%">
      <feDropShadow dx="0" dy="3" stdDeviation="5" flood-color="#0F172A" flood-opacity="0.10"/>
    </filter>
  </defs>
  <rect width="${width}" height="${height}" fill="${palette.canvas}"/>
  ${text(60, 58, title, { size: 30, weight: 500 })}
  ${text(60, 88, subtitle, { size: 15, color: palette.muted })}
  ${body}
</svg>`;
}

function buildSystemArchitectureSvg() {
  const body = [
    roundedRect(40, 145, 330, 610, { fill: palette.paper, stroke: palette.border, radius: 22 }),
    text(70, 185, "利用者・フロントエンド", { size: 19, weight: 500 }),
    roundedRect(85, 250, 240, 135, { fill: palette.blueSoft, stroke: palette.blue, radius: 18 }),
    text(205, 292, "利用者のブラウザ", { anchor: "middle", size: 21, weight: 500 }),
    text(205, 323, "ログイン・ゲーム操作", { anchor: "middle", size: 15, color: palette.muted }),
    text(205, 348, "結果表示", { anchor: "middle", size: 15, color: palette.muted }),
    roundedRect(85, 490, 240, 160, { fill: palette.paper, stroke: "#111827", radius: 18 }),
    `<image href="${icons.frontend}" x="171" y="515" width="68" height="60"/>`,
    text(205, 604, "Next.js", { anchor: "middle", size: 21, weight: 500 }),
    text(205, 630, "公開ホスティングは未確定", { anchor: "middle", size: 14, color: palette.muted }),

    roundedRect(430, 120, 1010, 675, { fill: palette.paper, stroke: palette.aws, strokeWidth: 3, radius: 24 }),
    roundedRect(460, 142, 300, 42, { fill: palette.awsSoft, stroke: palette.aws, strokeWidth: 1, radius: 12 }),
    text(610, 171, "AWS Cloud（ap-northeast-1）", { anchor: "middle", size: 17, weight: 500 }),

    iconNode({
      x: 500,
      y: 225,
      width: 190,
      height: 165,
      icon: icons.cognito,
      title: "Amazon Cognito",
      detail: "デモユーザー認証",
      fill: palette.purpleSoft
    }),
    iconNode({
      x: 755,
      y: 225,
      width: 190,
      height: 165,
      icon: icons.apiGateway,
      title: "API Gateway",
      detail: "HTTP API / JWT認証",
      fill: palette.blueSoft
    }),

    roundedRect(700, 485, 360, 230, { fill: palette.awsSoft, stroke: palette.aws, radius: 20 }),
    `<image href="${icons.lambda}" x="730" y="525" width="72" height="72"/>`,
    text(822, 535, "AWS Lambda", { size: 21, weight: 500 }),
    text(822, 562, "Node.js 24 / 512 MB", { size: 14, color: palette.muted }),
    roundedRect(730, 620, 95, 54, { fill: palette.paper, stroke: palette.border, radius: 10 }),
    roundedRect(837, 620, 95, 54, { fill: palette.paper, stroke: palette.border, radius: 10 }),
    roundedRect(944, 620, 95, 54, { fill: palette.paper, stroke: palette.border, radius: 10 }),
    text(777, 643, "Start", { anchor: "middle", size: 15, weight: 500 }),
    text(777, 663, "回数制限・お題生成", { anchor: "middle", size: 12, color: palette.muted }),
    text(884, 643, "Submit", { anchor: "middle", size: 15, weight: 500 }),
    text(884, 663, "審査・判定", { anchor: "middle", size: 12, color: palette.muted }),
    text(991, 643, "Get", { anchor: "middle", size: 15, weight: 500 }),
    text(991, 663, "結果取得", { anchor: "middle", size: 12, color: palette.muted }),

    iconNode({
      x: 1190,
      y: 205,
      width: 205,
      height: 165,
      icon: icons.bedrock,
      title: "Amazon Bedrock",
      detail: "Claude Haiku 4.5",
      fill: palette.purpleSoft
    }),
    iconNode({
      x: 1190,
      y: 430,
      width: 205,
      height: 165,
      icon: icons.dynamoDb,
      title: "Amazon DynamoDB",
      detail: "オンデマンド / TTL 24時間",
      fill: palette.blueSoft
    }),
    iconNode({
      x: 1190,
      y: 630,
      width: 205,
      height: 130,
      icon: icons.cloudWatch,
      title: "CloudWatch Logs",
      detail: "ログ保持 7日",
      fill: palette.greenSoft
    }),

    arrow({ x1: 205, y1: 490, x2: 205, y2: 390, label: "画面配信", labelY: 454 }),
    arrow({ x1: 325, y1: 280, x2: 500, y2: 280, label: "ログイン情報", color: palette.aws, labelY: 266 }),
    arrow({ x1: 500, y1: 350, x2: 325, y2: 350, label: "JWT", color: palette.aws, labelY: 380 }),
    routedArrow({
      points: [
        [325, 365],
        [410, 365],
        [410, 430],
        [850, 430],
        [850, 390]
      ],
      label: "HTTPS API + JWT",
      labelX: 610,
      labelY: 420
    }),
    arrow({ x1: 850, y1: 390, x2: 850, y2: 485, label: "3ルート", labelY: 457 }),
    arrow({ x1: 1060, y1: 545, x2: 1190, y2: 300, label: "生成・評価", labelY: 394 }),
    arrow({ x1: 1060, y1: 580, x2: 1190, y2: 520, label: "保存・取得", labelY: 555 }),
    arrow({ x1: 1060, y1: 655, x2: 1190, y2: 695, label: "実行ログ", labelY: 665 }),

    text(465, 770, "実装済みの現在構成のみを記載（EKS・GPU・S3・Step Functionsは含まない）", {
      size: 14,
      color: palette.muted
    })
  ].join("");

  return svgShell({
    width: 1500,
    height: 850,
    title: "言い訳コロシアム｜システム構成図",
    subtitle: "Next.jsフロントエンドとAWSサーバーレスバックエンド",
    body
  });
}

function buildGameFlowSvg() {
  const lanes = [
    { x: 45, width: 210, title: "利用者", fill: palette.blueSoft },
    { x: 255, width: 230, title: "Next.js", fill: palette.paper },
    { x: 485, width: 230, title: "Cognito / API Gateway", fill: palette.purpleSoft },
    { x: 715, width: 245, title: "AWS Lambda", fill: palette.awsSoft },
    { x: 960, width: 220, title: "Amazon Bedrock", fill: palette.purpleSoft },
    { x: 1180, width: 255, title: "Amazon DynamoDB", fill: palette.blueSoft }
  ];

  const laneMarkup = lanes
    .map(
      (lane) =>
        `${roundedRect(lane.x, 145, lane.width, 1480, {
          fill: lane.fill,
          stroke: palette.border,
          strokeWidth: 1,
          radius: 12
        })}${text(lane.x + lane.width / 2, 185, lane.title, {
          anchor: "middle",
          size: 17,
          weight: 500
        })}<path d="M ${lane.x} 210 L ${lane.x + lane.width} 210" stroke="${palette.border}" stroke-width="1"/>`
    )
    .join("");

  const task = ({ x, y, width, height = 76, number, title, detail = "", fill = palette.paper, stroke = palette.border }) =>
    [
      roundedRect(x, y, width, height, { fill, stroke, radius: 14 }),
      `<circle cx="${x + 22}" cy="${y + 22}" r="15" fill="${palette.ink}"/>`,
      text(x + 22, y + 28, number, { anchor: "middle", size: 13, color: palette.paper, weight: 500 }),
      text(x + 44, y + 31, title, { size: 15, weight: 500 }),
      detail ? text(x + 18, y + 59, detail, { size: 12, color: palette.muted }) : ""
    ].join("");

  const body = [
    laneMarkup,
    task({ x: 72, y: 245, width: 155, number: 1, title: "ログイン入力", detail: "メール / パスワード", fill: palette.blueSoft, stroke: palette.blue }),
    task({ x: 515, y: 245, width: 170, number: 2, title: "Cognito認証", detail: "デモユーザーを確認", fill: palette.purpleSoft, stroke: palette.purple }),
    arrow({ x1: 227, y1: 283, x2: 515, y2: 283, label: "認証要求" }),

    task({ x: 285, y: 380, width: 170, number: 3, title: "JWTを保持", detail: "有効期限 1時間", fill: palette.paper, stroke: palette.border }),
    arrow({ x1: 515, y1: 418, x2: 455, y2: 418, label: "IDトークン", color: palette.aws }),

    task({ x: 72, y: 520, width: 155, number: 4, title: "ゲーム開始", detail: "ボタンを押す", fill: palette.blueSoft, stroke: palette.blue }),
    task({ x: 515, y: 520, width: 170, number: 5, title: "開始API", detail: "POST /api/game/start", fill: palette.purpleSoft, stroke: palette.purple }),
    task({ x: 750, y: 520, width: 175, number: 6, title: "Start Lambda", detail: "1日20回の上限確認", fill: palette.awsSoft, stroke: palette.aws }),
    task({ x: 990, y: 520, width: 160, number: 7, title: "お題生成", detail: "Bedrock 1回", fill: palette.purpleSoft, stroke: palette.purple }),
    task({ x: 1215, y: 520, width: 185, number: 8, title: "開始状態を保存", detail: "TTL 24時間", fill: palette.blueSoft, stroke: palette.blue }),
    arrow({ x1: 227, y1: 558, x2: 515, y2: 558, label: "JWT付きHTTPS" }),
    arrow({ x1: 685, y1: 558, x2: 750, y2: 558 }),
    arrow({ x1: 925, y1: 558, x2: 990, y2: 558 }),
    arrow({ x1: 1150, y1: 558, x2: 1215, y2: 558 }),

    task({ x: 285, y: 675, width: 170, number: 9, title: "お題を表示", detail: "sessionIdを保持", fill: palette.paper, stroke: palette.border }),
    arrow({ x1: 1215, y1: 713, x2: 455, y2: 713, label: "お題JSON" }),

    task({ x: 72, y: 825, width: 155, number: 10, title: "言い訳を送信", detail: "自由入力", fill: palette.blueSoft, stroke: palette.blue }),
    task({ x: 515, y: 825, width: 170, number: 11, title: "審査API", detail: "POST /api/game/submit", fill: palette.purpleSoft, stroke: palette.purple }),
    task({ x: 750, y: 825, width: 175, number: 12, title: "Submit Lambda", detail: "セッションを取得", fill: palette.awsSoft, stroke: palette.aws }),
    task({ x: 1215, y: 825, width: 185, number: 13, title: "セッション読込", detail: "GetItem", fill: palette.blueSoft, stroke: palette.blue }),
    arrow({ x1: 227, y1: 863, x2: 515, y2: 863, label: "JWT + 言い訳" }),
    arrow({ x1: 685, y1: 863, x2: 750, y2: 863 }),
    arrow({ x1: 925, y1: 863, x2: 1215, y2: 863, label: "GetItem" }),

    task({ x: 990, y: 995, width: 160, number: 14, title: "審査員×3", detail: "並列生成", fill: palette.purpleSoft, stroke: palette.purple }),
    task({ x: 750, y: 995, width: 175, number: 15, title: "スコア集計", detail: "5軸・100点満点", fill: palette.awsSoft, stroke: palette.aws }),
    arrow({ x1: 1215, y1: 1033, x2: 1150, y2: 1033 }),
    arrow({ x1: 990, y1: 1033, x2: 925, y2: 1033, label: "3コメント" }),

    task({ x: 990, y: 1165, width: 160, number: 16, title: "最終判定", detail: "Bedrock 1回", fill: palette.purpleSoft, stroke: palette.purple }),
    task({ x: 1215, y: 1165, width: 185, number: 17, title: "完了結果を保存", detail: "status: completed", fill: palette.blueSoft, stroke: palette.blue }),
    arrow({ x1: 925, y1: 1203, x2: 990, y2: 1203 }),
    arrow({ x1: 1150, y1: 1203, x2: 1215, y2: 1203 }),

    task({ x: 285, y: 1340, width: 170, number: 18, title: "結果JSONを受信", detail: "画面を更新", fill: palette.paper, stroke: palette.border }),
    task({ x: 72, y: 1340, width: 155, number: 19, title: "判定を確認", detail: "スコア・コメント", fill: palette.blueSoft, stroke: palette.blue }),
    arrow({ x1: 1215, y1: 1378, x2: 455, y2: 1378, label: "結果JSON" }),
    arrow({ x1: 285, y1: 1378, x2: 227, y2: 1378, label: "表示" }),

    roundedRect(745, 1455, 655, 88, { fill: palette.paper, stroke: palette.aws, radius: 16 }),
    text(775, 1488, "1プレイのBedrock呼び出し", { size: 16, weight: 500 }),
    text(775, 1517, "お題1回 + 審査員3回（並列）+ 最終判定1回 = 基本5回", {
      size: 14,
      color: palette.muted
    })
  ].join("");

  return svgShell({
    width: 1480,
    height: 1680,
    title: "言い訳コロシアム｜1プレイの処理フロー",
    subtitle: "ログインからAI審査・判定結果の表示まで",
    body
  });
}

function drawioCell(id, value, style, x, y, width, height, parent = "1") {
  return `<mxCell id="${id}" value="${escapeXml(value)}" style="${escapeXml(style)}" vertex="1" parent="${parent}"><mxGeometry x="${x}" y="${y}" width="${width}" height="${height}" as="geometry"/></mxCell>`;
}

function drawioEdge(id, source, target, value = "", style = "") {
  const edgeStyle = `edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;endArrow=block;endFill=1;strokeWidth=2;strokeColor=${palette.ink};fontFamily=Yu Gothic;fontSize=12;${style}`;
  return `<mxCell id="${id}" value="${escapeXml(value)}" style="${escapeXml(edgeStyle)}" edge="1" parent="1" source="${source}" target="${target}"><mxGeometry relative="1" as="geometry"/></mxCell>`;
}

function drawioIconStyle(icon, fill = palette.paper) {
  return `shape=image;verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;imageAspect=0;aspect=fixed;image=${icon};fontFamily=Yu Gothic;fontSize=14;fontStyle=1;spacingTop=8;fillColor=${fill};strokeColor=none;`;
}

function drawioDocument({ name, width, height, cells }) {
  return `<mxfile host="app.diagrams.net" modified="${new Date().toISOString()}" agent="Codex" version="30.0.4" type="device" compressed="false">
  <diagram id="${name.toLowerCase().replaceAll(" ", "-")}" name="${escapeXml(name)}">
    <mxGraphModel dx="1422" dy="794" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="${width}" pageHeight="${height}" math="0" shadow="0">
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>
        ${cells.join("\n        ")}
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`;
}

function buildSystemDrawio() {
  const cells = [
    drawioCell("title", "言い訳コロシアム｜システム構成図", "text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontFamily=Yu Gothic;fontSize=24;fontStyle=1;fontColor=#232F3E;", 40, 20, 600, 45),
    drawioCell("external", "利用者・フロントエンド", "swimlane;html=1;rounded=1;startSize=35;horizontal=1;fontFamily=Yu Gothic;fontStyle=1;fontSize=16;fillColor=#FFFFFF;strokeColor=#CBD5E1;", 40, 100, 310, 650),
    drawioCell("browser", "利用者のブラウザ<br><font style='font-size:12px;color:#5F6B7A'>ログイン・ゲーム操作・結果表示</font>", "rounded=1;whiteSpace=wrap;html=1;fillColor=#EAF4FB;strokeColor=#146EB4;fontFamily=Yu Gothic;fontSize=16;fontStyle=1;", 80, 205, 230, 100),
    drawioCell("vercel", "Next.js<br><font style='font-size:12px;color:#5F6B7A'>公開ホスティングは未確定</font>", drawioIconStyle(drawioIcons.frontend), 145, 430, 100, 125),
    drawioCell("aws", "AWS Cloud（ap-northeast-1）", "swimlane;html=1;rounded=1;startSize=38;horizontal=1;fontFamily=Yu Gothic;fontStyle=1;fontSize=16;fillColor=#FFFFFF;strokeColor=#FF9900;strokeWidth=3;", 405, 90, 980, 680),
    drawioCell("cognito", "Amazon Cognito<br><font style='font-size:11px'>デモユーザー認証</font>", drawioIconStyle(drawioIcons.cognito, palette.purpleSoft), 470, 190, 110, 130),
    drawioCell("api", "API Gateway<br><font style='font-size:11px'>HTTP API / JWT</font>", drawioIconStyle(drawioIcons.apiGateway, palette.blueSoft), 685, 190, 110, 130),
    drawioCell("lambdaGroup", "AWS Lambda / Node.js 24", "swimlane;html=1;rounded=1;startSize=35;horizontal=1;fontFamily=Yu Gothic;fontStyle=1;fontSize=15;fillColor=#FFF4E5;strokeColor=#FF9900;", 650, 410, 360, 210),
    drawioCell("start", "Start<br><font style='font-size:11px'>回数制限・お題生成</font>", drawioIconStyle(drawioIcons.lambda), 680, 465, 80, 115),
    drawioCell("submit", "Submit<br><font style='font-size:11px'>審査・判定</font>", drawioIconStyle(drawioIcons.lambda), 790, 465, 80, 115),
    drawioCell("get", "Get<br><font style='font-size:11px'>結果取得</font>", drawioIconStyle(drawioIcons.lambda), 900, 465, 80, 115),
    drawioCell("bedrock", "Amazon Bedrock<br><font style='font-size:11px'>Claude Haiku 4.5</font>", drawioIconStyle(drawioIcons.bedrock, palette.purpleSoft), 1110, 160, 120, 135),
    drawioCell("dynamo", "Amazon DynamoDB<br><font style='font-size:11px'>オンデマンド / TTL 24時間</font>", drawioIconStyle(drawioIcons.dynamoDb, palette.blueSoft), 1110, 365, 120, 135),
    drawioCell("logs", "CloudWatch Logs<br><font style='font-size:11px'>ログ保持 7日</font>", drawioIconStyle(drawioIcons.cloudWatch, palette.greenSoft), 1110, 565, 120, 135),
    drawioCell("note", "現在の実装のみ（EKS・GPU・S3・Step Functionsは含まない）", "text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontFamily=Yu Gothic;fontSize=12;fontColor=#5F6B7A;", 450, 720, 500, 30),
    drawioEdge("e1", "vercel", "browser", "画面配信"),
    drawioEdge("e2", "browser", "cognito", "ログイン情報", "strokeColor=#FF9900;exitX=1;exitY=0.3;exitDx=0;exitDy=0;entryX=0;entryY=0.3;entryDx=0;entryDy=0;"),
    drawioEdge("e2b", "cognito", "browser", "JWT", "strokeColor=#FF9900;exitX=0;exitY=0.75;exitDx=0;exitDy=0;entryX=1;entryY=0.75;entryDx=0;entryDy=0;"),
    drawioEdge("e3", "browser", "api", "HTTPS API + JWT", "exitX=1;exitY=0.9;exitDx=0;exitDy=0;entryX=0.5;entryY=1;entryDx=0;entryDy=0;"),
    drawioEdge("e4", "api", "lambdaGroup", "3ルート"),
    drawioEdge("e5", "lambdaGroup", "bedrock", "生成・評価"),
    drawioEdge("e6", "lambdaGroup", "dynamo", "保存・取得"),
    drawioEdge("e7", "lambdaGroup", "logs", "実行ログ")
  ];
  return drawioDocument({ name: "System Architecture", width: 1450, height: 850, cells });
}

function buildFlowDrawio() {
  const laneStyle = (fill) => `swimlane;html=1;rounded=1;startSize=38;horizontal=1;fontFamily=Yu Gothic;fontStyle=1;fontSize=14;fillColor=${fill};strokeColor=#CBD5E1;`;
  const taskStyle = (fill = palette.paper, stroke = palette.border) => `rounded=1;whiteSpace=wrap;html=1;fillColor=${fill};strokeColor=${stroke};fontFamily=Yu Gothic;fontSize=13;spacing=8;`;
  const cells = [
    drawioCell("title", "言い訳コロシアム｜1プレイの処理フロー", "text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontFamily=Yu Gothic;fontSize=24;fontStyle=1;fontColor=#232F3E;", 40, 20, 650, 45),
    drawioCell("laneUser", "利用者", laneStyle(palette.blueSoft), 40, 100, 180, 1100),
    drawioCell("laneFront", "Next.js", laneStyle(palette.paper), 220, 100, 210, 1100),
    drawioCell("laneGateway", "Cognito / API Gateway", laneStyle(palette.purpleSoft), 430, 100, 230, 1100),
    drawioCell("laneLambda", "AWS Lambda", laneStyle(palette.awsSoft), 660, 100, 230, 1100),
    drawioCell("laneBedrock", "Amazon Bedrock", laneStyle(palette.purpleSoft), 890, 100, 210, 1100),
    drawioCell("laneDynamo", "Amazon DynamoDB", laneStyle(palette.blueSoft), 1100, 100, 230, 1100),
    drawioCell("login", "ログイン情報を入力", taskStyle(palette.blueSoft, palette.blue), 65, 170, 130, 60),
    drawioCell("auth", "Cognitoで認証<br><font style='font-size:11px'>JWTを取得</font>", taskStyle(palette.purpleSoft, palette.purple), 475, 170, 140, 60),
    drawioCell("startClick", "ゲーム開始", taskStyle(palette.blueSoft, palette.blue), 65, 290, 130, 55),
    drawioCell("startPost", "POST<br>/api/game/start", taskStyle(), 255, 290, 140, 55),
    drawioCell("startAuth", "JWT検証", taskStyle(palette.purpleSoft, palette.purple), 475, 290, 140, 55),
    drawioCell("startLambda", "StartGameFunction<br><font style='font-size:11px'>1日20回の上限確認</font>", taskStyle(palette.awsSoft, palette.aws), 705, 290, 140, 60),
    drawioCell("scenario", "お題を生成<br><font style='font-size:11px'>Bedrock 1回</font>", taskStyle(palette.purpleSoft, palette.purple), 925, 290, 140, 60),
    drawioCell("saveStart", "セッション保存<br><font style='font-size:11px'>awaiting_excuse / TTL 24時間</font>", taskStyle(palette.blueSoft, palette.blue), 1135, 290, 160, 65),
    drawioCell("showScenario", "お題を表示", taskStyle(), 255, 430, 140, 55),
    drawioCell("excuse", "言い訳を入力・送信", taskStyle(palette.blueSoft, palette.blue), 65, 545, 130, 60),
    drawioCell("submitPost", "POST<br>/api/game/submit", taskStyle(), 255, 545, 140, 60),
    drawioCell("submitAuth", "JWT検証", taskStyle(palette.purpleSoft, palette.purple), 475, 545, 140, 55),
    drawioCell("submitLambda", "SubmitExcuseFunction", taskStyle(palette.awsSoft, palette.aws), 700, 545, 150, 55),
    drawioCell("load", "セッション読込", taskStyle(palette.blueSoft, palette.blue), 1145, 545, 140, 55),
    drawioCell("judges", "審査員3名を並列生成<br><font style='font-size:11px'>検察官・弁護人・民衆</font>", taskStyle(palette.purpleSoft, palette.purple), 915, 690, 160, 70),
    drawioCell("aggregate", "5軸のスコア集計<br><font style='font-size:11px'>TypeScriptで計算</font>", taskStyle(palette.awsSoft, palette.aws), 700, 800, 150, 65),
    drawioCell("final", "最終判定を生成<br><font style='font-size:11px'>Bedrock 1回</font>", taskStyle(palette.purpleSoft, palette.purple), 925, 800, 140, 65),
    drawioCell("saveFinal", "完了結果を保存<br><font style='font-size:11px'>status: completed</font>", taskStyle(palette.blueSoft, palette.blue), 1145, 915, 140, 65),
    drawioCell("display", "スコア・コメント・判定を表示", taskStyle(palette.blueSoft, palette.blue), 60, 1035, 140, 70),
    drawioEdge("f1", "login", "auth", "認証"),
    drawioEdge("f2", "auth", "startClick", "JWT"),
    drawioEdge("f3", "startClick", "startPost"),
    drawioEdge("f4", "startPost", "startAuth"),
    drawioEdge("f5", "startAuth", "startLambda"),
    drawioEdge("f6", "startLambda", "scenario"),
    drawioEdge("f7", "scenario", "saveStart", "生成結果"),
    drawioEdge("f8", "saveStart", "showScenario", "sessionId + お題"),
    drawioEdge("f9", "showScenario", "excuse"),
    drawioEdge("f10", "excuse", "submitPost"),
    drawioEdge("f11", "submitPost", "submitAuth"),
    drawioEdge("f12", "submitAuth", "submitLambda"),
    drawioEdge("f13", "submitLambda", "load", "GetItem"),
    drawioEdge("f14", "load", "judges", "セッション"),
    drawioEdge("f15", "judges", "aggregate", "3コメント"),
    drawioEdge("f16", "aggregate", "final", "集計スコア"),
    drawioEdge("f17", "final", "saveFinal", "最終判定"),
    drawioEdge("f18", "saveFinal", "display", "結果JSON")
  ];
  return drawioDocument({ name: "Game Flow", width: 1400, height: 1250, cells });
}

async function writeDiagram(baseName, svg, drawio) {
  const svgPath = path.join(outputDir, `${baseName}.svg`);
  const pngPath = path.join(outputDir, `${baseName}.png`);
  const drawioPath = path.join(outputDir, `${baseName}.drawio`);
  fs.writeFileSync(svgPath, svg, "utf8");
  fs.writeFileSync(drawioPath, drawio, "utf8");
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(pngPath);
}

fs.mkdirSync(outputDir, { recursive: true });
await writeDiagram("system-architecture", buildSystemArchitectureSvg(), buildSystemDrawio());
await writeDiagram("game-flow", buildGameFlowSvg(), buildFlowDrawio());

console.log("Generated architecture diagrams in docs/architecture.");
