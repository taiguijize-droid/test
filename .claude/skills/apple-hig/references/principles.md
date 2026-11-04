# Apple の設計原則 (HIG「Design principles」2026-06-08 再掲版 の要約)

原文: https://developer.apple.com/design/human-interface-guidelines/design-principles

「唯一の正しい適用方法はない。競合する優先度を秤にかける道具」と Apple 自身が位置付けている。
UI を作るときは、各原則に対して **自分の画面が何をしているか一行で答えられる** 状態にする。

| 原則 | 一言 | 作るときに自問すること |
|---|---|---|
| **Purpose** 目的 | Make something meaningful | この画面で人が一番やりたいことは何か。それ以外を削れるか。既存の解決策を作り直していないか。 |
| **Agency** 主体性 | Let people do things their own way | 邪魔せずに直接タスクへ行けるか。特定の流れに閉じ込めていないか (スキップ可能か)。元に戻せるか。 |
| **Responsibility** 責任 | Act in people's best interest | 何をするアプリか最初から明確か。権限を求めるときに理由を示しているか。集めるデータは必要最小限か。 |
| **Familiarity** 慣れ | Build on what people know | 現実世界や他のソフトの概念を使っているか。見た目と操作が全画面で一貫しているか。フィードバック (利用可否、内容変化、アラート) は明確か。 |
| **Flexibility** 柔軟性 | Adapt to diverse contexts and needs | アクセシビリティを最初から優先しているか。プラットフォームや構成が変わっても内容と操作の位置は予測できるか。音声・タッチ・キーボードの各入力に対応しているか。 |
| **Simplicity** 単純さ | Be clear and direct | 必要なものだけか (ミニマリズムとは違う)。ラベルの言葉は最短か。階層が見てわかるか。 |
| **Craft** 技巧 | Care about every detail | 視覚・アニメーション・文言・音のすべてが意図的か。試作して捨てる勇気があるか。出荷後も更新するか。 |
| **Delight** 喜び | Make it human | 起こしたい感情を決めているか (元気づける / 落ち着かせる / 興奮させる)。装飾を喜びと取り違えていないか。 |

## Liquid Glass 時代の 3 語 (技術概要ページ)

原文: https://developer.apple.com/documentation/technologyoverviews/liquid-glass

- **Hierarchy** 階層: 最も重要なコンテンツに焦点が当たるレイアウトとナビゲーション構造。
- **Harmony** 調和: ソフトウェアとハードウェアの設計、デバイス間で要素が馴染む。
- **Consistency** 一貫性: 標準アイコンと予測可能なアクション配置をプラットフォーム横断で。

同ページの具体指針:
1. 最重要コンテンツが焦点になるレイアウトとナビゲーションを定義する。
2. アプリアイコンはシンプルで大胆なレイヤーで再設計する。
3. コントロールとナビゲーションの色は控えめにし、コンテンツが透けて見えるようにする。
4. デバイス間でソフト・ハードの設計に馴染ませる。
5. 標準アイコンと予測可能なアクション配置を採用する。

## 旧 HIG の 3 語 (参考)

2013〜2024 年版の HIG は **Clarity (明瞭) / Deference (控えめ) / Depth (奥行き)** を掲げていた。
現在の公式ページには無いが、レビューの語彙としては今も通じる。
Deference は「UI はコンテンツに譲る」、Depth は「層と動きで階層を伝える」の意で、Liquid Glass の階層の考え方に引き継がれている。

## アクセシビリティの 3 性質 (HIG「Accessibility」)

- **Intuitive** 直感的: 馴染みのある一貫した操作。
- **Perceivable** 知覚可能: 情報を一つの手段だけで伝えない (視覚・聴覚・触覚)。
- **Adaptable** 適応可能: システムのアクセシビリティ設定に追従する。
