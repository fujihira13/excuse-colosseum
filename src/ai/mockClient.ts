import type { AiTextClient, GenerateTextRequest } from "./textClient";

const axisScores = {
  説得力: 14,
  面白さ: 16,
  誠実さ: 12,
  リスク回避力: 13,
  整合性: 15
};

export class MockTextClient implements AiTextClient {
  async generateText(request: GenerateTextRequest): Promise<string> {
    if (request.schemaName === "scenario") {
      return JSON.stringify({
        worldType: "宇宙船の出航式",
        incident: "銀河連盟の旗艦発進ボタンを、記念撮影の自撮りタイマーだと思って連打した。",
        defendantRole: "新人管制官",
        angryParty: "銀河連盟広報局長"
      });
    }

    if (request.schemaName.startsWith("judge:")) {
      const role = request.schemaName.replace("judge:", "");
      const names: Record<string, string> = {
        prosecutor: "検察官AI",
        defender: "弁護人AI",
        crowd: "民衆AI"
      };
      const comments: Record<string, string> = {
        prosecutor: "責任の所在はまだ曖昧ですが、事故後の説明に一貫性はあります。再発防止策を先に出せば、追及は少し弱まります。",
        defender: "混乱した現場で即座に謝意を示している点は評価できます。失敗を笑いに変えつつ、被害の回復に話を戻せています。",
        crowd: "かなり苦しいのに、勢いで場を持たせています。観客席は半分あきれ、半分笑っている状態です。"
      };
      return JSON.stringify({
        role,
        displayName: names[role],
        comment: comments[role],
        axisScores,
        order: role === "prosecutor" ? 1 : role === "defender" ? 2 : 3
      });
    }

    return JSON.stringify({
      totalScore: 70,
      rank: "B",
      finalComment: "苦しい状況を、謝罪と機転でなんとか競技として成立させました。",
      improvementPoint: "次は最初に被害範囲と補償案を出すと、説得力が上がります。"
    });
  }
}
