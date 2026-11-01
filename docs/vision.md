# heya(仮)— 全体設計の地図

- 作成日: 2026-11-01
- 状態: ドラフト(本人のレビュー待ち)
- この文書の役割: 製品全体の地図。別セッションや別のエージェントが最初に読む文書。個々の機能の詳細は `docs/specs/` に置く
- 現状: コードはまだない。`docs/specs/2026-11-01-room-agent-spec.md`(部屋の理解と模様替え)が最初の仕様

---

## 1. 製品のビジョン

スマホで撮った部屋を、AIが「器」と「中身」に分けて理解し、どうぶつの森のようなデフォルメした部屋として表す。その部屋を土台に、片付けを続け、人に見せ、人と一緒に考えるSNS。

### 3つの核になる体験(本人の選択: A・B・C すべて)

| 記号 | 体験 | 人は毎日何をするか |
|---|---|---|
| A | 見せる・眺める | 自分の部屋を公開し、他の人の部屋を訪ねて眺める。模様替えのたびに部屋が更新される |
| B | 今日の片付けを共有する | 「今日はここを片付ける」「片付けた」を投稿し、部屋がきれいになっていく変化を見せ合う |
| C | 部屋を一緒に考える | 他の人の部屋に模様替え案を提案したり、相談したりする |

片付け(B)は大きなモジュールで、A と C はその上に載る。

## 2. 設計の原則

1. **器と中身を分ける**: 部屋の寸法・ドア・窓(器)と、家具・物(中身)は別のデータ。模様替えは「同じ器に中身を置き直す」操作。
2. **写真は理解のためだけに使い、人に見せるのはデフォルメ**: 写真と小物の情報は本人だけのもの。公開されるのは器と家具の配置を元にしたデフォルメの部屋。プライバシーは設計で守る。
3. **グリッドが共通の物理**: 1マス0.25mのグリッドと配置の検証器(はみ出し・重なり・ドア・窓・通路・固定)を、本人の模様替え、AIの提案、訪問者の提案のすべてで使う。誰が動かしても同じルールで成立を判定する。
4. **AIは提案し、コードが検証する**: VLMの出力は必ずスキーマと検証器を通す。通らない案は理由つきで残し、黙って捨てない。
5. **1つの境界でAIを囲う**: VLM呼び出しは `VisionModel` インターフェースの裏だけ。テストは偽物に差し替える。
6. **費用を見せる**: AIを使う操作は、使ったトークンと概算金額を表示する。

## 3. モジュールの地図

```
写真・動画
   │
   ▼
[capture 撮影セット]  HEIC変換・縮小・動画のコマ切り出し・間引き
   │  Capture(コマの集合)
   ▼
[understanding 部屋の理解] ──▶ VisionModel(Claude) ◀── [layout 配置エンジン]
   │  RoomModel(非公開): 器・ツリー・配置・所見            │  提案・検証・移動手順
   ├──────────────────────────────┬────────────────────────┘
   ▼                              ▼
[tidy 片付け]                 [render-2d 間取り図]
   │ 物の状態・今日の計画・完了確認・履歴
   ▼
[publish 公開射影]  RoomModel → PublicRoom(小物を落とし、寸法を丸める)
   │
   ▼
[social SNS]  部屋・訪問・反応・片付け投稿・訪問者の提案・フィード
   │
   ▼
[apps]  web(3D描画を含む)・ios(撮影とRoomPlan、後日)
```

### 各モジュールの責務

| モジュール | 役割 | 入力 → 出力 | 依存 | AIを使うか |
|---|---|---|---|---|
| schema | 全パッケージ共通のデータ型(Zod)。JSON Schemaとしても出力し、Swiftなど他言語にも配る | — | なし | いいえ |
| capture | 写真・動画をコマの集合にする。HEIC→JPEG、長辺1568px縮小、毎秒1コマ、dHashで間引き、上限で均等抜き取り | ファイル → Capture | sharp, ffmpeg | いいえ |
| understanding | コマから器・ツリー・配置・所見を作る。`VisionModel` インターフェースを定義する | Capture + ヒント → RoomModel | schema, VisionModel | はい(境界越し) |
| layout | グリッド、検証器(6ルール)、移動手順、模様替え案の生成(AI案→検証→再試行) | RoomModel + 目的 + 固定 → Proposal[] | schema, VisionModel | はい(提案のみ) |
| tidy | 物の定位置、状態(定位置/散らかり/不明)、今日の計画、再撮影による完了確認、履歴 | RoomModel(時系列) → TidyPlan, TidyLog | schema, understanding | いいえ(計画は規則で) |
| render-2d | 真上から見たSVG | 器 + 配置 → SVG | schema | いいえ |
| publish | 非公開の RoomModel から公開用 PublicRoom を作る。小物を落とす、寸法を丸める、コマ参照を消す。公開範囲を適用 | RoomModel + 公開設定 → PublicRoom | schema | いいえ |
| ai-claude | `VisionModel` のClaude実装。プロンプト、構造化出力、ストリーミング、フォールバック、費用集計 | — | Anthropic SDK | はい |
| cli | `room-agent` コマンド。Phase 0 の成果物。上のモジュールを束ねる | — | 上すべて | — |
| apps/api | HTTP API、認証、保存、公開、イベント、フィード | — | schema, publish, layout, tidy, DB | — |
| apps/web | 画面。3D描画(Three.js)を含む。PublicRoom を読んでデフォルメの部屋を描く | — | schema, api | — |
| apps/ios | 撮影、RoomPlan による器の取得、アップロード(後日) | — | api, JSON Schema | — |

## 4. データの層(プライバシーの設計)

| 層 | 中身 | 見られる人 | 保存場所と期限 |
|---|---|---|---|
| 元データ | 元の写真・動画 | 本人のみ | 一時領域。分析が終わったら既定で削除 |
| 作業データ(非公開) | 縮小したコマ、RoomModel 全体(小物のツリーを含む)、所見、片付けの状態と履歴 | 本人のみ | DB + オブジェクト保存(暗号化)。コマは既定30日で削除、本人が延長・即時削除できる |
| 公開データ(射影) | PublicRoom: 丸めた器の寸法、家具のカテゴリと配置、デフォルメの見た目、片付け度のバッジ(任意)、片付け投稿、提案 | 公開範囲(非公開/フォロワー/全体)に応じて | DB の公開テーブル。公開時に射影を作って保存する(非公開データを配信経路に乗せない) |
| 外部送信 | 縮小したコマ → Anthropic API のみ | — | 送るだけ。保存しない |

公開データは常に `publish` モジュールが作る。他のモジュールが RoomModel を直接配信することはない。

## 5. インターフェース(契約)

### モジュール間の契約(言語に依らない形で)

- `VisionModel.analyzeRoom(frames, hints) → RoomAnalysis`(器・ツリー・配置の候補)
- `VisionModel.proposeLayouts(request) → CandidateLayout[]`(器・家具・開口部・固定・目的・前回の違反 → 配置案)
- `capture.fromFiles(paths, options) → Capture`
- `understanding.analyze(capture, hints, vision) → RoomModel`
- `layout.validate(layout, shell, rules) → ValidationReport`
- `layout.planMoves(current, target) → MoveStep[]`
- `layout.propose(roomModel, goal, pins, vision) → Proposal[]`(採用・不採用の両方を返す)
- `tidy.assignHomes(roomModel) → ItemHome[]`(各物の定位置)
- `tidy.planToday(roomModel, preferences) → TidyPlan`
- `tidy.verify(before, after, plan) → TidyResult`(再撮影の RoomModel と比較)
- `render2d.svg(shell, layout, labels) → string`
- `publish.toPublic(roomModel, visibility) → PublicRoom`

### HTTP API(apps/api)の面

| 目的 | エンドポイントの形 |
|---|---|
| 取り込みと分析 | 撮影セットのアップロード、部屋の分析開始、進行と費用の取得 |
| 自分の部屋 | RoomModel の取得、器の寸法の上書き、スナップショット履歴 |
| 模様替え | 案の生成(目的・固定)、案の採用、移動手順の取得 |
| 片付け | 今日の計画の作成、タスクの完了、再撮影での確認、履歴 |
| 公開 | 公開範囲の設定、公開(射影の作成)、PublicRoom の取得(ハンドル名で) |
| 訪問(A) | 他人の PublicRoom の取得、反応、コメント |
| 投稿(B) | 片付け投稿の作成(計画・完了・デフォルメの前後比較)、取得 |
| 提案(C) | 訪問者が配置案を送る(同じ検証器を通す)、持ち主が採用・却下 |
| つながり | フォロー、フィード(フォロー中の部屋の更新・投稿・提案) |

### イベント(フィードの元)

`RoomAnalyzed`, `RoomPublished`, `LayoutChanged`, `TidyPlanCreated`, `TidyTaskCompleted`, `ProposalSubmitted`, `ProposalAccepted`

### 画面(UIの面)

1. 取り込み: 撮る/選ぶ、進行、費用の表示
2. マイルーム: デフォルメ3D、2D間取り図、ツリー(フォルダ)、所見、寸法の修正
3. 今日の片付け(B): タスク、完了、再撮影で確認、投稿
4. 模様替え: 目的の入力、固定の指定、案の比較、採用、移動手順
5. 訪問(A): 他人の部屋を3Dで見る、反応、コメント、模様替えを提案(C)
6. フィード: フォロー中の部屋の更新、片付け投稿、提案
7. 設定: 公開範囲、写真の保持、モデルの選択、費用の上限

## 6. フォルダ構造(モノレポ)

```
heya/
├─ CLAUDE.md                 # エージェント向けの作業規約(第9章)
├─ docs/
│  ├─ vision.md              # この地図
│  ├─ glossary.md            # ドメイン用語(唯一の語彙)
│  ├─ specs/                 # サブプロジェクトごとの仕様
│  ├─ plans/                 # 実装計画
│  └─ decisions/             # ADR(設計判断の記録)
├─ .claude/skills/           # リポジトリ専用スキル(第9章)
├─ packages/
│  ├─ schema/                # Zodスキーマ + JSON Schema出力
│  ├─ capture/
│  ├─ understanding/         # VisionModel インターフェースを定義
│  ├─ layout/
│  ├─ tidy/
│  ├─ render-2d/
│  ├─ publish/
│  ├─ ai-claude/             # VisionModel のClaude実装
│  └─ cli/                   # room-agent コマンド
├─ apps/
│  ├─ web/                   # 画面と3D描画
│  ├─ api/                   # HTTP API、認証、保存
│  └─ ios/                   # 後日
├─ assets/furniture/         # ローポリ家具(CC0)とカテゴリ→モデル対応表(JSON)
├─ fixtures/                 # サンプル部屋、偽 VisionModel の応答、評価セット
└─ infra/                    # docker-compose、デプロイ設定
```

パッケージの依存は一方向。`schema` ← 各モジュール ← `cli` / `apps`。`ai-claude` 以外は Anthropic SDK に依存しない。

## 7. データ格納

### 段階ごとの保存先

| 段階 | 保存先 | 理由 |
|---|---|---|
| Phase 0(CLI) | ファイル(room.json、SVG、フォルダ書き出し) | 可能性の確認が目的。DB不要 |
| Phase 1–2(Web、本人だけ) | SQLite + ローカルのファイル保存 | 1人で使う。セットアップが最小 |
| Phase 3(SNS) | PostgreSQL + S3互換のオブジェクト保存 | 複数人、公開、履歴。ORMを揃えておけば移行は小さい |

### 主なテーブル(概略)

- `users`(認証はライブラリに任せる)
- `rooms`(持ち主、ハンドル名、公開範囲)
- `room_snapshots`(部屋ID、版、RoomModel のJSON、作成日時)— 部屋は時間とともに変わる。B の「変化」を見せる元
- `frames`(スナップショットID、保存キー、期限)— 縮小コマ。期限で自動削除
- `public_rooms`(部屋ID、PublicRoom のJSON、公開日時)— 射影の保存
- `proposals`(部屋ID、作者、出所: ai/owner/visitor、配置、検証レポート、状態)
- `tidy_homes`, `tidy_plans`, `tidy_tasks`, `tidy_logs`
- `posts`(B の投稿。デフォルメの前後比較を参照)、`reactions`, `comments`, `follows`
- `feed_events`(第5章のイベント)

### 保持の既定

元の写真・動画は分析後に削除。縮小コマは30日。RoomModel とその履歴は本人が消すまで保持。すべて設定で変えられ、本人は一括削除できる。

## 8. 技術選定(OSS)

### 推奨: TypeScript 一本

Room Agent の仕様では Python と書いたが、製品が「Web + 3D + SNS」と分かった今、言語を1つにそろえる方が速い。画像処理(sharp)、動画(ffmpeg)、Anthropic SDK、3D(Three.js)、API、画面、すべて TypeScript でそろう。型とスキーマを Zod で1か所に置き、全パッケージで共有できる。将来、端末内の画像認識など Python が要る処理が出たら、その部分だけ別サービスにする。

| 役割 | 選定 | 代替 | 理由 |
|---|---|---|---|
| 実行環境 | Node.js 22 | Bun | 安定。この環境に入っている |
| モノレポ | pnpm workspaces | Turborepo を後で足す | 最小構成 |
| スキーマ・型 | Zod 4(JSON Schema出力つき) | TypeBox | 1つの定義から型・検証・他言語向けスキーマ |
| 画像 | sharp | Jimp | 速い。縮小・形式変換 |
| HEIC | heic-convert | ffmpeg | iPhone写真の既定形式に対応 |
| 動画 | ffmpeg(ffmpeg-static)+ execa | — | コマ切り出し。環境に依存しない |
| AI | @anthropic-ai/sdk | — | 構造化出力、ストリーミング、フォールバック。既定モデル claude-opus-5-5 |
| CLI | commander | citty | 枯れている |
| API | Hono | Fastify | 軽く、TypeScript first、Node でも edge でも動く |
| 認証 | Better Auth | Supabase Auth | 自前DBで完結する。メール・パスキー・OAuth |
| ORM | Drizzle | Prisma | SQLite と PostgreSQL を同じ定義で |
| DB | SQLite → PostgreSQL | — | 第7章の段階に合わせる |
| オブジェクト保存 | ローカルFS → S3互換(MinIO / Cloudflare R2 / Supabase Storage) | — | 段階に合わせる |
| Web | Vite + React + React Router + TanStack Query | Next.js | 3D中心のアプリに軽い構成 |
| 3D | Three.js + React Three Fiber + drei | Babylon.js | デフォルメ部屋の描画。Reactと相性がよい |
| 家具アセット | Kenney Furniture Kit(CC0)、Quaternius(CC0) | 自作 | ローポリ、商用可、どうぶつの森的な質感に近い |
| UI | Tailwind CSS | — | 画面の速度 |
| テスト | Vitest、Playwright(e2e) | — | Playwright はこの環境に入っている |
| 整形・静的検査 | Biome | ESLint + Prettier | 1ツールで済む |
| デプロイ | docker-compose(自前)/ Fly.io または Railway(API+DB)+ R2 | Vercel + Supabase | 本人の好みで選ぶ |
| iOS(後日) | Swift, SwiftUI, RoomPlan | — | LiDAR の器の取得は iOS ネイティブだけ |

### 代替: Python コア + TypeScript Web

Room Agent の仕様どおり Python で中核を作り、Web と 3D は TypeScript。画像・動画処理に強いが、スキーマと型を2言語で保つ手間が出る。片付けや配置の検証器を Web 側(訪問者の提案)でも使うには、ロジックの二重実装か API 往復が要る。この点が TypeScript 一本を勧める最大の理由。

## 9. コンテクストとスキル(エージェントが一貫して作るために)

このリポジトリは、別セッションや別のエージェントが続きを作る前提。人に説明するのと同じ内容を、機械にも渡す。

### CLAUDE.md に書くこと

- 最初に読む文書の順番: `docs/vision.md` → `docs/glossary.md` → 該当する `docs/specs/` → `docs/decisions/`
- 進め方の規約: 仕様 → 計画 → 実装の順。仕様のない機能は作らない。1タスクごとにテスト → 実装 → コミット
- 言語の規約: 画面の文言・所見レポート・エラーは日本語。コードの識別子は英語で、用語集の英語名を使う
- プライバシーの規約: 写真やコマをログに出さない。PublicRoom に項目を足すときは `privacy-check` スキルを通す。Anthropic API 以外へ画像を送らない
- 動かし方: インストール、テスト、CLI の実行、Web の起動の各コマンド
- 禁止: 検証器を迂回する提案の採用、不採用案の黙殺、APIキーのコミット

### docs/glossary.md(用語集)

Room Agent 仕様の用語(撮影セット、器、開口部、部屋ツリー、エリア、家具、物、配置、グリッド、模様替え案、所見レポート)に、本地図の用語を足す: 定位置(Item Home)、片付けタスク(Tidy Task)、片付け度(Tidiness)、公開射影(Public Room)、訪問(Visit)、片付け投稿(Tidy Post)、訪問者提案(Visitor Proposal)、スナップショット(Room Snapshot)。コード・画面・文書で同じ語を使う。

### docs/decisions/(ADR。最初の候補)

1. モノレポと TypeScript 一本(第8章の判断)
2. 公開は射影で行い、非公開データは配信経路に乗せない(第4章)
3. グリッド 0.25m と6つの検証ルール(閾値を含む)
4. VLM は `VisionModel` の1境界に閉じる
5. 写真の保持期限の既定(元データ即時削除、コマ30日)

### .claude/skills/(リポジトリ専用スキル)

| スキル | いつ使うか | 中身 |
|---|---|---|
| room-schema | RoomModel / PublicRoom / Proposal の型を触るとき | スキーマの場所、版の上げ方、JSON Schema の再生成、互換性の確認 |
| layout-rules | 配置の検証や提案を触るとき | 6ルールと閾値、ルールの追加手順(テスト先行)、違反レポートの形 |
| vlm-prompts | `ai-claude` のプロンプトや構造化出力を触るとき | プロンプトの構成、基準物による寸法推定の指示、fixtures の更新、評価セットの回し方、費用の見方 |
| privacy-check | 公開データ・ログ・外部送信に関わる変更の前 | チェックリスト: PublicRoom に足す項目は小物か、寸法は丸めたか、コマ参照は消えたか、ログに画像が出ないか |
| furniture-assets | 家具カテゴリや3Dモデルを足すとき | カテゴリ→モデル対応表の形、CC0 の出所の記録、寸法の正規化 |
| tidy-rules | 片付けの計画や完了判定を触るとき | 定位置の決め方、今日の計画の分け方、再撮影での完了判定の規則 |

### 評価セット

`fixtures/eval/` に、サンプル部屋の写真と「期待する家具一覧」を置き、VLM の拾い漏れと誤検出を測る。プロンプトやモデルを変えたら回す。作り方は Claude API の評価の作法(build-eval)に従う。

## 10. ロードマップ

| Phase | 作るもの | 確かめること | 主な技術 |
|---|---|---|---|
| 0 | CLI: capture, understanding, layout, render-2d, cli, ai-claude, schema | 写真から器・ツリー・配置・模様替え案がどこまで出るか(可能性の確認)。仕様: Room Agent | TypeScript, sharp, ffmpeg, Anthropic SDK |
| 1 | Web(本人だけ): 取り込み → マイルーム(2D) → 今日の片付け(B、非公開)→ 模様替え(C、自分用) | 毎日使えるか。片付けの完了確認が再撮影で成立するか | Hono, Drizzle, SQLite, Vite + React |
| 2 | デフォルメ3D + 公開射影 | 自分の部屋が「見せたい見た目」になるか。公開データに非公開情報が漏れないか | Three.js, R3F, CC0 家具 |
| 3 | SNS: 認証、公開、訪問(A)、反応、片付け投稿(B)、訪問者の提案(C)、フィード | 他人の部屋に行く体験と、提案が同じ検証器で成立するか | Better Auth, PostgreSQL, S3互換 |
| 4 | iOS: 撮影、RoomPlan、アップロード | LiDAR の器が推定より良いか | Swift, RoomPlan |

各 Phase は、仕様(`docs/specs/`)→ 計画(`docs/plans/`)→ 実装の順に進める。Phase 0 の仕様は書いてある。

## 11. 本人に決めてもらうこと

1. **言語**: TypeScript 一本(推奨)か、Python コア + TypeScript Web か。TypeScript なら Room Agent 仕様の「実装言語は Python」を書き換える
2. **名前**: 仮称 heya。決まったらリポジトリ名も合わせる
3. **置き場所(Phase 3 で)**: 自前(docker-compose)か、Fly.io / Railway か、Vercel + Supabase か
4. **写真の保持の既定**: 元データ即時削除・コマ30日(案)でよいか

## 12. 範囲外(今は作らない)

写実的な3D復元、写真そのものの公開、複数の部屋、センチ単位の計測、模様替え後の写実画像生成、通知・DM・課金。必要になったら仕様から始める。
