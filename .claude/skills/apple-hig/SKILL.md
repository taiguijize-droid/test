---
name: apple-hig
description: Apple Human Interface Guidelines (HIG) の原則と数値仕様に沿って UI を「作る → 検証する → 直す」ための手順。iOS/macOS 風の画面、Web プロトタイプ、SwiftUI 画面を作るとき、既存 UI を Apple 流に見直すとき、「Apple っぽく」「HIG 準拠で」「Liquid Glass」「Dynamic Type」「VoiceOver」と言われたときに使う。
---

# Apple HIG で作る・検証する・直す

このスキルは Apple の一次資料 (HIG、Liquid Glass 技術概要) を `references/` に要約し、
Web 実装向けの自動検証スクリプトを `scripts/` に置いたもの。
出典は `references/sources.md`。数値は 2026-11 時点の HIG から転記した。

## いつ読むか

1. **作る前**: `references/principles.md` (8原則) と `references/specs.md` (数値) を読む。
2. **作っている最中**: specs.md の値をそのまま CSS / SwiftUI に使う。独自の値を発明しない。
3. **作った後**: `references/checklist.md` を上から通し、Web なら `scripts/hig-audit.mjs` を回す。
4. **直すとき**: 検証結果の各項目を `references/fixes.md` の対応表で修正し、再検証する。

## 手順 (必ずこの順)

### 1. 作る (Create)

- 画面の「目的」を一文で書く (Purpose)。目的に効かない要素は入れない (Simplicity)。
- 画面パターンはシステム標準から選ぶ: ナビゲーションバー + リスト、タブバー、サイドバー、シート、アラート。
  独自パターンは「標準で表現できない理由」を一行で書けるときだけ (Familiarity)。
- 文字は SF Pro / SF Pro Text 相当のシステムフォントスタック、サイズは **テキストスタイル表** (specs.md §1) から選ぶ。
  本文 17pt、最小 11pt (iOS)。Ultralight / Thin / Light は使わない。
- 色はセマンティックに。`label / secondaryLabel / separator / systemBackground / accent` の役割で定義し、
  ライト・ダーク・高コントラストの3変種を用意する (specs.md §3)。
- 操作要素は **44×44pt** 以上、要素間の余白は約 12pt (ベゼルあり) / 24pt (ベゼルなし)。
- Liquid Glass はコントロール層 (ツールバー、タブバー、サイドバー、浮くボタン) にだけ使う。
  コンテンツ層には使わない。色を付けるのは主要アクション 1 つだけ。
- モーションは目的があるときだけ。`prefers-reduced-motion` / Reduce Motion で、
  ズーム・スケール・z 軸移動をフェードに置き換える。
- 色だけで状態を伝えない。アイコン・形・テキストを併用する。
- すべての操作に非ジェスチャの代替 (ボタン) を用意し、ラベルを付ける (VoiceOver / Voice Control)。

### 2. 検証する (Verify)

Web (HTML / React など) の場合:

```bash
node .claude/skills/apple-hig/scripts/hig-audit.mjs <file.html または URL> [--json]
```

- 文字サイズ < 11px、本文の主要テキスト < 17px
- 操作要素 < 44×44 px、隣接する操作要素の間隔 < 8px
- 文字と背景のコントラスト比 < 4.5:1 (17px 以下)、< 3:1 (18px 以上 / Bold)
- font-weight < 400 の使用
- `prefers-reduced-motion` を扱っていないのにアニメーションがある
- `button` / `a` / `input` にアクセシブル名がない
- ダーク配色での再チェック (`--dark`)

を列挙する。終了コードは問題があれば 1。

SwiftUI / UIKit の場合: Xcode の Accessibility Inspector を使い、
`checklist.md` を手動で通す (Dynamic Type を AX5 まで上げて崩れを見る)。

どちらの場合も `references/checklist.md` を最後まで通し、各項目に ✅ / ❌ / N/A を書く。

### 3. 直す (Fix)

- 検証で出た項目を `references/fixes.md` の「症状 → 修正」で直す。
- 修正は一度に一分類ずつ (サイズ → コントラスト → ラベル → モーション)。
- 直したら必ず **2. 検証する** をもう一度回し、ゼロになるまで繰り返す。
- 直せない項目 (デザイン上の意図で残すもの) は理由を一行書いて残す。

## ハードゲート

- specs.md に無い数値を「それっぽく」決めない。無い場合は HIG の該当ページ (sources.md) を読む。
- 「検証した」と言う前に、スクリプトの出力またはチェックリストの結果を実際に貼る。
- 色だけで状態を伝える UI、44pt 未満のタップ領域、11pt 未満の文字は、理由なく残さない。
