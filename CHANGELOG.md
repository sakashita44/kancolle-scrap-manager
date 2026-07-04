# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [2.1.0] - 2026-07-04

### Added

- 別タブでのLocalStorage変更を自動同期（カテゴリ・装備・任務の追加/編集/削除を全タブへ即時反映） (#10)
- Wiki側の最新の工廠任務（F136〜F142）をマスタデータに追加

## [2.0.1] - 2026-03-04

### Fixed

- スマホでフィルタUIが崩れる不具合を修正 (#172)
    - 種別フィルタのドロップダウンが枠からはみ出す問題を修正
    - 文字列検索窓が小さすぎて入力内容が見えない問題を修正

## [2.0.0] - 2026-03-03

### Added

- 複合カテゴリ要求（categoryGroup）の導入 (#168)
- 任務/装備マスタデータの拡充（Pythonスクリプトによる自動生成） (#142)

### Changed

- JavaScript + Context API 構成を TypeScript + Zustand に全面リライト (#159)
- Zod v4 による全データ統一バリデーション
- react-hook-form + @hookform/resolvers による宣言的フォーム管理
- `targetType`/`targetId` → `kind`/`id`（要求モデル）
- `isMaster: boolean` → `source: "master" | "user"`（ランタイム付与）
- カテゴリ代表装備の概念を廃止（カテゴリを直接要求対象に使用）
- Context providers (7個) → Zustand single store (3 slices)
- ESLint (flat config) + Prettier + markdownlint-cli2 + Husky によるコード品質基盤 (#160)
- Vitest による回帰テスト導入 (#163)
- 全ドキュメントを現行実装に追従 (#130)
- 装備一覧の「公式」タグをユーザー定義装備の「ユーザー」タグに変更

### Fixed

- 装備0件のユーザー定義カテゴリが装備一覧に表示されない問題を修正
- フィルタ判定と任務回数保持の不具合を修正
- ベース任務切替時に一覧のハイライトが更新されない問題を修正
- セッション復元時に存在しない任務IDを除外する整合性チェックを追加
- エラー表示をGlobalWarningBannerに統一 (#148)

## [2.0.0-beta] - 2026-03-02

## [2.0.0-alpha] - 2025-11-23

### Added

- ベース任務/副任務の概念導入
- データ初期化機能（設定メニューから全データを削除可能）
- 任務の編集機能

### Changed

- DataContext / SelectionContext / UIContext 導入 (#107)
- domain層の純粋関数化 (#127)
- 任務保存ロジック集約 (#128)
- 破壊的操作の一元管理 (#129)
- MissionModal / EquipmentModal 分割 (#108, #109)
- Barrel File 導入 (#106)
- コードベースの重複削除・未使用コード除去 (#157)

## [1.0.1-beta] - 2025-11-09

### Fixed

- 初期バグ修正

## [1.0.0-beta] - 2025-11-03

### Added

- 廃棄リスト自動計算（MAX集計、包含解決）
- 装備・任務の追加・削除
- 周期/カテゴリフィルタ
