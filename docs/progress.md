# v2.0.0 ロードマップ

## リリース戦略

```text
v1.0.0-beta
  ↓
Phase 1-3: コア機能実装 ── 完了
  ↓
Phase 4A: 破壊的変更（alpha前）── 完了
  ↓
v2.0.0-alpha ── リリース済み
  ↓
Phase 4B: 部分リファクタ ── 完了（#157で終了）
  ↓
Phase 5: TS + Zustand フルリライト ── #159 ── 完了
  ↓
#163: 回帰防止の最小テスト導入 ── 完了
  ↓
#130: ドキュメント最新化 ── 完了
  ↓
v2.0.0-beta ── リリース済み
  ↓
#142: マスタデータ拡充 ── 完了（PR #169）
  ↓
#168: 複合カテゴリ要求（categoryGroup）導入 ── 完了（PR #170）
  ↓
v2.0.0 正式版 ── リリース済み
```

## #163: 回帰防止の最小テスト導入 ── 完了

Vitest導入、回帰しやすいロジックに限定した最小テスト（10本）を追加.

- `src/domain/__tests__/scrapCalculation.test.ts`: 廃棄計算（MAX集計, 包含解決, count乗算, 過不足比較）
- `src/domain/__tests__/missionFilter.test.ts`: カテゴリフィルタ判定（App.tsxから純粋関数として抽出）
- `src/store/__tests__/selectionSlice.test.ts`: 選択スライス（ベース/補助切替count維持, countクランプ）

## Phase 5: フルリライト (#159) ── 完了

JavaScript + Context API 構成を TypeScript + Zustand に全面リライトした.
機能・UIは同等を維持し, 内部アーキテクチャを刷新.

### 技術スタック変更

| 項目           | 旧構成                          | 現行                           |
| :------------- | :------------------------------ | :----------------------------- |
| 言語           | JavaScript (JSX)                | TypeScript (TSX)               |
| 状態管理       | Context API × 7 + Facade        | Zustand (単一Store, slice構成) |
| バリデーション | Zod (部分適用)                  | Zod v4 (全データ統一)          |
| 永続化         | 各hook/コンポーネントで個別実装 | Store actions内で明示的に実行  |

### アーキテクチャ

```text
src/
  schema/          # Zodスキーマ + 型定義
  store/           # Zustand store + slices (data, selection, ui)
  domain/          # 純粋計算関数（廃棄計算等）
  components/      # UIコンポーネント
  hooks/           # カスタムhook（useToggle, useMissionForm）
  utils/           # ユーティリティ（cn, displayUtils, scrapListFormatters）
  data/            # マスターデータJSON
```

### 主な設計変更

- `targetType`/`targetId` → `kind`/`id`（要求モデル）
- `isMaster: boolean` → `source: "master" | "user"`（ランタイム付与）
- カテゴリ代表装備の概念を廃止（カテゴリを直接要求対象に使用）
- Context providers (7個) → Zustand single store
- 要求セレクタに composite `kind:id` 値エンコーディングを採用

## Phase 4B 完了済みタスク

| Issue        | タイトル                                           |
| :----------- | :------------------------------------------------- |
| #157         | コードベースの重複削除・未使用コード除去・簡素化   |
| #85          | エラーハンドリング統一（ErrorContext導入）         |
| #107 Step1-4 | Context API導入（Error/Data/Selection/UI）         |
| #127         | category/equipment operationsの純粋関数化          |
| #128         | 任務保存ロジック抽出（saveMission統一API）         |
| #129         | 破壊的操作operations化（useDestructiveOperations） |
| #148         | エラー表示統一（GlobalWarningBanner一本化）        |
| #118         | Zodネイティブ結果移行                              |
| #113         | react-hook-form導入                                |
| #114         | clsx + tailwind-merge導入                          |
| #109         | MissionModalフォーム分離                           |
| #108         | EquipmentModal分割                                 |
| #106         | Barrel File導入                                    |
| #140         | 微細なバグ修正                                     |

### Phase 4Bで中止したタスク

Issue #159(フルリライト)で対応するため中止.

- #119: StickyDashboard分割 → リライトで構成ごと書き直す
- #126: アーキテクチャ配置ルール(meta) → Zustand + 4区分で構造的に解決

### 別トラック

| Issue | タイトル                               | ステータス |
| :---- | :------------------------------------- | :--------- |
| #130  | ドキュメント最新化（現行実装への追従） | 完了       |

## v2.0.0-beta → v2.0.0 正式版

| Issue | タイトル                                            | ステータス      |
| :---- | :-------------------------------------------------- | :-------------- |
| #142  | 任務/装備マスタデータの拡充（Pythonスクリプト作成） | 完了（PR #169） |
| #168  | 複合カテゴリ要求（categoryGroup）の導入             | 完了（PR #170） |

## v2.0.0で導入済みライブラリ

| ライブラリ                            | 導入Issue | 用途                                                  |
| :------------------------------------ | :-------- | :---------------------------------------------------- |
| Zod (v4)                              | #86, #159 | スキーマベースバリデーション（Parse, don't validate） |
| react-hook-form + @hookform/resolvers | #113      | 宣言的フォーム管理, Zodスキーマ統合                   |
| clsx + tailwind-merge                 | #114      | 条件付きクラス名結合, Tailwind衝突解決                |
| Zustand                               | #159      | 状態管理(Context API置換)                             |
| TypeScript                            | #159      | 型安全性                                              |
| Vitest                                | #163      | 純粋関数の回帰テスト                                  |

## v2.1.0以降

| Issue | タイトル                           | 備考                                       |
| :---- | :--------------------------------- | :----------------------------------------- |
| #12   | インポート/エクスポート処理        | 仕様検討中（マージ戦略未定義）             |
| #43   | インポートデータのサイズ制限       | #12依存                                    |
| #9    | プライベートモード検出             | LocalStorage使用不可時の読み取り専用モード |
| #11   | フィルタ永続化                     | SessionStorageにフィルタ状態を保存         |
| #10   | storage監視                        | 他タブでの更新検知, リロード通知           |
| #78   | ダークモードの追加                 |                                            |
| #93   | 選択中任務一覧のアニメーション改善 | framer-motion導入                          |
| #115  | 通知UI（トースト）の導入           | react-hot-toast導入                        |
| #79   | Google Analytics (GA4) の導入      | react-ga4導入                              |
| #46   | キャッシュ戦略の仕様明確化         | 低優先度, 要否再検討                       |
| #30   | バックエンド実装                   | 低優先度                                   |

## 棚上げ/実装不要

- #8: ネットワークリトライ・タイムアウト — データバンドル化により不要
- #45: LocalStorage容量警告 — 保存失敗時のエラー表示で十分
- #84: フック統合 — DataContext導入で不要
- #110: ドメイン分離 — #127-#129へ分割完了
