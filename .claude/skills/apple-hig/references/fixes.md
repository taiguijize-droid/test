# 症状 → 修正 対応表

`hig-audit.mjs` の `rule` 名と対応させている。

| rule | 症状 | 修正 (Web) | 修正 (SwiftUI) |
|---|---|---|---|
| `text-too-small` | 文字が 11px 未満 | `font-size` を 11px 以上に。補足は Caption 2 (11/13) か Footnote (13/18) | `.font(.caption2)` 以上。カスタムサイズを使わない |
| `body-small` | 本文 (p / li / td / 入力欄) が 15px 未満 | 本文を `17px/22px` に。密度を上げたいなら Subhead 15/20 まで。キャプション (label / small) は 11px 以上なら対象外 | `.font(.body)` または `.subheadline` |
| `light-weight` | font-weight 400 未満 | 400 / 500 / 600 / 700 に置換 | `.ultraLight` `.thin` `.light` を外す |
| `tap-target` | 操作要素が 44×44 未満 | `min-height:44px; min-width:44px`、またはパディングで当たり判定を広げる (見た目は小さくて良い) | `.frame(minWidth:44, minHeight:44)` または `.contentShape` で領域を広げる |
| `tap-spacing` | 隣接する操作要素の間隔 < 8px | `gap: 12px` (ベゼルあり) / `24px` (ベゼルなし) | `HStack(spacing: 12)` |
| `contrast` | コントラスト不足 | 文字色を `label` 相当 (light #000 / dark #fff) か secondary (light 60% / dark 60% の不透明) に。背景を systemBackground 系に。Bold にすると閾値が 3:1 に下がる | `Color.primary` / `.secondary`、背景は `Color(.systemBackground)` |
| `no-accessible-name` | ボタン・リンク・入力に名前がない | 可視テキストを入れる、`aria-label`、`<label for>`。アイコンだけのボタンは `aria-label` 必須 | `.accessibilityLabel("…")` |
| `img-no-alt` | 画像に alt がない | 内容を説明する alt、装飾なら `alt=""` | `Image(decorative:)` または `.accessibilityLabel` |
| `motion-no-reduce` | アニメーションがあるのに reduced-motion 対応がない | `@media (prefers-reduced-motion: reduce){ *{animation:none!important; transition:opacity .2s!important} }` を追加 | `@Environment(\.accessibilityReduceMotion)` で分岐、`withAnimation` を外す |
| `glass-in-content` | カード・リスト本体に backdrop-filter | コンテンツ層は不透明の `secondarySystemBackground` に。glass はツールバー等へ | `.glassEffect` をコントロールだけに |
| `color-only-state` (目視) | 色だけで状態を表す | アイコン (SF Symbols 相当)、文言、形を追加 | `Label("Error", systemImage: "exclamationmark.triangle")` |
| `accent-overuse` (目視) | 複数ボタンの背景がアクセント色 | 主要アクション 1 つだけ `prominent`。他はモノクロ | `.buttonStyle(.glassProminent)` は 1 つ、他は `.glass` |
| `horizontal-overflow` | 375px で横スクロール | `min-width:0`、`flex-wrap`、テーブルだけ `overflow-x:auto` | `ViewThatFits`、サイズクラスで分岐 |
| `no-safe-area` | 固定要素が画面端 0 | `padding-bottom: env(safe-area-inset-bottom)` など | `.ignoresSafeArea` を使わない |

## 修正の順番

1. サイズ系 (`text-too-small`, `tap-target`, `tap-spacing`) — レイアウトが変わるので最初
2. コントラスト (`contrast`) — ライト・ダーク両方
3. 名前とラベル (`no-accessible-name`, `img-no-alt`)
4. モーションとマテリアル
5. 再検証。ゼロになるまで 1 に戻る
