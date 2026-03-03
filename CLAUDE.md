# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

艦これ 工廠任務廃棄マネージャー (Kancolle Scrap Manager) は, 艦これの複数の工廠任務(廃棄任務)を並列遂行する際に, 廃棄すべき装備の**必要最小限リスト**を算出するWebアプリケーション.

サーバーレス. 全データ処理はブラウザ内で完結する(プライバシー機能として告知).

## Tech Stack

- **Frontend**: React, Tailwind CSS, Lucide React
- **Language**: TypeScript (strict)
- **State**: Zustand (single store, slice pattern)
- **Build**: Vite
- **Validation**: Zod (v4)
- **Form**: react-hook-form + @hookform/resolvers
- **Testing**: Vitest (純粋関数テストのみ, jsdom不要)
- **Code Quality**: ESLint (flat config), Prettier, markdownlint-cli2, Husky + lint-staged

## Development Commands

```bash
npm run dev        # 開発サーバー起動
npm run build      # プロダクションビルド (dist/ に出力)
npm test           # テスト実行 (vitest run)
npm run test:watch # テスト監視モード (vitest)
npm run lint       # ESLint + markdownlint チェック
npm run format     # Prettier + ESLint --fix + markdownlint --fix
npm run deploy     # dist/ を Lolipop にアップロード
```

### Development Flow

1. `git status` でブランチ状態確認
1. issue と `docs/progress.md` で次タスク確認 (issueのコメントも必ず確認)
1. `main` からブランチ作成: `<prefix>/<yyyymm>/sakashita44/<issue番号>-<内容>`
1. 実装 → ローカル動作確認
1. タスクが進捗に影響する場合は `docs/progress.md` を更新
1. コミット → プッシュ → PR作成

## Architecture

### ディレクトリ構成

```text
src/
├── schema/          # Zodスキーマ + 型定義（constants, base, category, requirementCategoryGroup, equipment, mission, forms）
├── store/           # Zustand store（dataSlice, selectionSlice, uiSlice, storage）
├── domain/       # 純粋関数のビジネスロジック（scrapCalculation, categoryOperations, missionFilter）
├── components/  # UIコンポーネント（TSX）
├── hooks/        # カスタムhooks（useToggle, useMissionForm）
├── utils/        # ユーティリティ（cn, displayUtils, scrapListFormatters）
├── data/            # 公式マスタデータJSON（categories, requirementCategoryGroups, equipments, missions）
├── App.tsx          # ルートコンポーネント
└── index.tsx        # エントリポイント
```

### 状態管理

単一のZustand storeを3つのsliceに分割:

- **dataSlice**: カテゴリ・装備・任務のCRUD, LocalStorage永続化, 起動時バリデーション
- **selectionSlice**: 任務選択状態, SessionStorage永続化
- **uiSlice**: フィルタ, 展開/折りたたみ, モーダル, SessionStorage永続化

コンポーネントはセレクタ経由でstoreに直接アクセスする（Contextプロバイダは不要）.

### ドメインレイヤー

`src/domain/` の計算関数は**純粋関数**のみ. 副作用(状態更新, ストレージ操作)は呼び出し元(App.tsx)が担う.

### 要求(Requirement)モデル

任務の要求は `kind`/`id` で表現:

- `kind: "equipment"` + `id`: 特定装備の廃棄要求
- `kind: "category"` + `id`: カテゴリ内の任意装備の廃棄要求
- `kind: "categoryGroup"` + `id`: 複合カテゴリ（要求カテゴリグループ）内の任意装備の廃棄要求

カテゴリは直接要求対象として使用可能（カテゴリ代表装備の概念は廃止）.
要求カテゴリグループは `src/data/requirementCategoryGroups.json` のマスタ定義を参照する.

## Application Features

### 廃棄リスト計算(コア機能)

選択した任務(最大8件)から, 廃棄すべき最小装備セットを算出する. 計算ルール:

- **AND条件**: 同一任務内の要求は全て満たす必要がある
- **MAX集計**: 同じ装備を要求する複数任務がある場合, 最大値を使用(合計ではない)
- **OR条件(包含)**: カテゴリ要求と個別装備要求が混在する場合, 個別装備はカテゴリ要求を部分的に充足する

```text
例:
  任務A: 機銃(カテゴリ) ×5
  任務B: 25mm単装機銃(個別) ×2

  結果:
  - 25mm単装機銃: 2個
  - 機銃(カテゴリ): 3個  ← 5 - 2 = 3
```

詳細: `docs/calculation_logic.md`

### データ管理

ユーザーは以下のデータを追加・編集・削除できる:

- **カテゴリ**: 装備の分類(例: 小口径主砲, 機銃)
- **装備**: 廃棄対象の個別装備
- **任務**: 要求装備リスト(`reqs`)を持つ廃棄任務

公式マスタデータ(`src/data/*.json`)はアプリにバンドルされ, 読み取り専用.
ユーザー定義データはLocalStorageに保存.

### Import / Export

ユーザー定義の装備・任務をJSONファイルでエクスポート/インポートできる.
インポートはZodで全フィールドをバリデーションし, エラーがあれば取り込みを中断する.

エクスポートファイル名:

- 装備: `kancolle_scrap_equipments_YYYYMMDD.json`
- 任務: `kancolle_scrap_missions_YYYYMMDD.json`

## Data Schema Contracts

### ID 体系

| データ種別               | プレフィックス | 例                   | 生成                  | 削除 |
| :----------------------- | :------------- | :------------------- | :-------------------- | :--- |
| 公式カテゴリ             | `m_cat_`       | `m_cat_gun_s`        | 手動定義              | 不可 |
| 公式要求カテゴリグループ | `m_rcg_`       | `m_rcg_radar`        | 手動定義              | 不可 |
| 公式装備                 | `m_eq_`        | `m_eq_gun_12cm`      | 手動定義              | 不可 |
| 公式任務                 | `m_ms_`        | `m_ms_daily_scrap_1` | 手動定義              | 不可 |
| ユーザーカテゴリ         | `u_cat_`       | `u_cat_<UUID>`       | `crypto.randomUUID()` | 可   |
| ユーザー装備             | `u_eq_`        | `u_eq_<UUID>`        | `crypto.randomUUID()` | 可   |
| ユーザー任務             | `u_ms_`        | `u_ms_<UUID>`        | `crypto.randomUUID()` | 可   |

- IDは一度発行したら**変更不可**(ユーザーデータが参照するため)
- 廃止はマスタデータを`【廃止】...`にリネームして論理削除
- プレフィックスは推奨だが必須ではない

### JSON スキーマ (永続化形式)

保存形式(JSON/LocalStorage)には `source` フィールドは**含まれない**. ランタイムでデータソースから自動付与する(改竄防止).

```json
// categories.json
{ "version": "1.0.0", "categories": [{ "id": "m_cat_gun_s", "name": "小口径主砲", "order": 1 }] }

// equipments.json
{ "version": "1.0.0", "equipments": [{ "id": "m_eq_gun_12cm", "name": "12cm単装砲", "categoryId": "m_cat_gun_s", "order": 100 }] }

// missions.json
{ "version": "1.0.0", "missions": [{ "id": "m_ms_daily_scrap_1", "name": "装備の整理", "period": "Daily", "reqs": [{ "kind": "equipment", "id": "m_eq_gun_12cm", "count": 3 }], "order": 0 }] }
```

スキーマバージョニングはSemVer準拠. 後方互換変更のみ許容(フィールド追加のみ, 削除・型変更は不可).

### Storage Keys

| ストレージ     | キー                        | 内容                     |
| :------------- | :-------------------------- | :----------------------- |
| LocalStorage   | `ksp_app_version`           | アプリバージョン         |
| LocalStorage   | `ksp_user_categories`       | ユーザー定義カテゴリ     |
| LocalStorage   | `ksp_user_equipments`       | ユーザー定義装備         |
| LocalStorage   | `ksp_user_missions`         | ユーザー定義任務         |
| LocalStorage   | `ksp_about_shown`           | Aboutモーダル表示フラグ  |
| SessionStorage | `ksp_selected_missions`     | 選択中の任務IDリスト     |
| SessionStorage | `ksp_filter_period`         | 期間フィルタ選択状態     |
| SessionStorage | `ksp_filter_category`       | カテゴリフィルタ選択状態 |
| SessionStorage | `ksp_mission_list_expanded` | 任務リスト展開状態       |

### 表示順序

全エンティティに `order` フィールド(整数)を持つ. ソートは `source` (`"master"` 優先) → `order` 昇順.

公式装備の `order` 割り振り: カテゴリごとに100番台区切り(小口径主砲: 100〜199, 中口径主砲: 200〜299 ...). 詳細は `docs/maintenance.md`.

## Error Handling

4レベルで分類する:

| レベル   | 影響       | 対応                              |
| :------- | :--------- | :-------------------------------- |
| Critical | アプリ停止 | モーダル表示, リロード必須        |
| Error    | 機能停止   | 該当機能無効化, 他機能は継続      |
| Warning  | 継続可能   | 警告表示のみ(GlobalWarningBanner) |
| Info     | なし       | 情報通知                          |

起動時にLocalStorageデータをZodでバリデーション. 壊れたエントリは自動除去して警告表示.

詳細: `docs/error_handling.md`

## UI / UX Constraints

- **最大8任務同時選択**: ゲームの制約. UIで選択数を制御(超過時は選択不可)
- **バリデーションUX**: 無効フォームは保存ボタンをdisabled, インラインエラー表示. エラーポップアップは使わない
- **初回起動モーダル**: `ksp_about_shown` がない場合, Aboutモーダルを自動表示(免責事項). 2回目以降は設定メニューから
- **データ不変性**: 計算時に元データを変更しない. 計算結果は新規オブジェクトで生成

## Key Documentation Files

- `docs/progress.md` - ロードマップと進捗
- `docs/calculation_logic.md` - 廃棄計算アルゴリズム詳細(8フェーズ)
- `docs/schema.md` - データ構造定義, バリデーションルール, `order` 仕様
- `docs/ui_specification.md` - UI/UX詳細仕様(モーダル挙動, フィルタ組み合わせ)
- `docs/error_handling.md` - エラー分類と回復戦略
- `docs/import_export.md` - インポート/エクスポート仕様
- `docs/maintenance.md` - マスタデータ更新ルール(`order` 割り振り等)
