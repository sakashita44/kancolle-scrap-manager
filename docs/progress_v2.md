# v2.0.0 ロードマップ

最終更新: 2025-12-04

## 概要

v2.0.0では、v1.0.0-betaリリース後に明確になったユースケースの改善と、データ構造の根本的な見直しを行う。これにより、より柔軟で保守性の高いアプリケーションを実現する。

## 実装の優先順位と依存関係

v2.0.0の機能は以下の順序で実装する：

1. **Phase 1: データ構造改善** (#74) - 最優先、全体の基盤
2. **Phase 2: 計算ロジック拡張** (#75) - Phase 1に依存
3. **Phase 3: UX改善** (#76) - Phase 2に依存
4. **Phase 4: バグ修正・小規模改善** (#72, #73, #12, #43, #11, #10, #9) - 破壊的変更後に実装

**実装方針の理由**:

* Phase 1のデータ構造変更は破壊的変更を含むため、v1.0.0-betaリリース直後の今、最優先で実施
* 小規模な機能追加（Phase 4）はデータ構造変更後でも対応可能
* Phase 1-3を完了させることで、ユーザー体験の根本的な改善を実現

## Phase 1: データ構造改善

最優先で実施。Phase 2/3の基盤となる破壊的変更。

### #74: カテゴリ代表装備の動的生成によるデータ整合性の改善

**Priority**: P2 (中優先度)

**問題の背景**:

* 現状、カテゴリ定義（`categories.json`）とカテゴリ代表装備（`equipments.json`の`type="Category"`）が二重管理されている
* ユーザーが装備追加時に`type="Category"`を選択でき、同一カテゴリに複数のカテゴリ代表が存在しうる
* カテゴリ代表が重複すると、廃棄リスト計算で別々の装備として扱われる問題がある

**解決策**:

カテゴリとアイテムを明確に分離し、カテゴリ代表装備をランタイムで動的生成することで、データ整合性を構造的に保証する。

**主な変更**:

1. **データスキーマ変更**
   * `equipments.json`: カテゴリ代表11個を削除、`type`フィールド削除
   * `missions.json`: `targetType`フィールド追加（`"category"` | `"item"`）
   * カテゴリ要求時は`targetId`にカテゴリIDを直接指定
2. **ランタイム処理**
   * `useEquipments`: 全カテゴリのカテゴリ代表を動的生成
   * `type`フィールドは`isMaster`と同様に保存時削除
3. **UI改善**
   * 装備管理モーダル: 「装備を追加」「カテゴリを追加」をラジオボタンで切替
   * カテゴリ削除時: そのカテゴリの全装備を自動削除（警告あり）

**影響範囲**:

* `src/data/equipments.json`, `src/data/missions.json`
* `src/hooks/useEquipments.js`
* `src/utils/localStorage.js`, `src/utils/validation.js`
* `src/utils/calculateScrapList.js`
* `src/components/EquipmentModal.jsx`
* `src/App.jsx`
* `docs/schema.md`, `src/types/schema.js`

**実装タスク**:

* [x] データスキーマ更新
    * [x] `equipments.json`: カテゴリ代表11個削除
    * [x] `missions.json`: `targetType`追加、targetId修正
* [x] ランタイムロジック
    * [x] `useEquipments`: カテゴリ代表動的生成、`type`付与、categories引数化
    * [x] `useCategories`: `categoryMap`追加、ユーザーカテゴリCRUD実装
    * [x] `localStorage`: 保存時に`type`削除、カテゴリ保存・読込追加
    * [x] `validation`: 現行スキーマベースのバリデーション
    * [x] `calculateScrapList`: `targetType`判定ロジック
    * [x] `useScrapCalculation`: 引数変更（equipmentMap, categoryMap）
    * [x] `MissionModal`: `targetType`自動判定
    * [x] `idGenerator`: `generateCategoryId`追加
* [x] UI変更
    * [x] `EquipmentModal`: モード切替UI追加（装備追加/カテゴリ追加）、同名カテゴリチェック追加
    * [x] `App.jsx`: カテゴリ追加・削除処理実装、useEquipments/useCategoriesの呼び出し順変更
* [x] ドキュメント更新
    * [x] `schema.md`: スキーマ仕様更新
    * [x] `types/schema.js`: TypeScript型定義更新
* [x] テスト
    * [x] 動的生成の動作確認
    * [x] 計算ロジックの確認
    * [x] 任務選択・廃棄リスト表示の確認
    * [x] ユーザーカテゴリ追加・削除の動作確認

**進捗**: 完了 (2025-12-03)
- コミット: e9cdf12（Phase 0-1）、ca8b7d5（MissionCard修正）、c232760（scrapListFormatters修正）
- Phase 2-4: ランタイムロジック、UI変更の実装完了
- Phase 5: ユーザーカテゴリ機能の実装完了、動作確認OK
- 今後の課題: コードベースのリファクタが必要（詳細は以下）

### Phase 1完了後のリファクタ検討 (2025-12-03)

Issue74実装後、責務分離が曖昧になった点を調査し、複数のリファクタIssueを起票した。

**調査結果**:

1. **データ変換処理の散在**: `isMaster`付与が4箇所、`type`除外が3箇所に分散
2. **フック層の責務過多**: 変換 + 状態管理 + CRUD + Map生成を1つのフックで実施
3. **localStorage層の責務混在**: 永続化とデータ変換の2つの責務を持つ
4. **App.jxの肥大化**: ビジネスロジックがUI層に混在（344行）
5. **エラーハンドリングの不統一**: 未使用エラー状態、部分的な統合

**起票したリファクタIssue**:

| Issue | タイトル | 優先度 | 説明 | ステータス |
|:------|:---------|:-------|:-----|:-----------|
| [#80](https://github.com/sakashita44/kancolle-scrap-manager/issues/80) | データ変換層の導入によるコード責務の明確化 | 高 | 永続化形式とランタイム形式の変換を専用層に集約 | ✅ 完了 |
| [#83](https://github.com/sakashita44/kancolle-scrap-manager/issues/83) | App.jxのビジネスロジックをドメイン層に分離 | 中 | カテゴリ削除などのビジネスロジックをドメイン層に移動 | ✅ 完了 |
| [#89](https://github.com/sakashita44/kancolle-scrap-manager/issues/89) | ID Map生成ユーティリティの作成 | 中 | Map生成パターンを共通化 | ✅ 完了 |
| [#90](https://github.com/sakashita44/kancolle-scrap-manager/issues/90) | useSelectedMissionsのロジック簡素化 | 中 | toggleMissionの重複ロジックを削減 | ✅ 完了 |
| [#91](https://github.com/sakashita44/kancolle-scrap-manager/issues/91) | 小規模リファクタリングの実施 | 低 | useMemo最適化、フィルタ統合など | 未着手 |
| [#84](https://github.com/sakashita44/kancolle-scrap-manager/issues/84) | ユーザーデータ管理フックの統合 | 低 | useUserDataLoaderとuseUserDataCRUDを1つに統合 | 未着手 |
| [#85](https://github.com/sakashita44/kancolle-scrap-manager/issues/85) | エラーハンドリングの統一と一元管理 | 低 | 全てのエラーを統一された方法で管理 | 未着手 |
| [#86](https://github.com/sakashita44/kancolle-scrap-manager/issues/86) | validation.jsの重複パターンをスキーマベースに共通化 | 低 | スキーマ定義ベースの汎用バリデーション関数を作成 | 未着手 |

**推奨実装順序**:

1. **最優先**: Issue #80（データ変換層の導入） - 他のリファクタの基盤となる ✅ 完了
2. **次点**: Issue #83（App.jxのビジネスロジック分離） - 機能追加前に対処推奨 ✅ 完了
3. **その後**: Issue #89（ID Map生成ユーティリティ）, #90（useSelectedMissions簡素化） - 中優先度、即効性あり ✅ 完了
4. **その後**: Issue #91, #84, #85, #86 - 必要に応じて実装

### Issue #80: データ変換層の導入 (2025-12-03)

**実装内容**:

新規ファイル `src/utils/dataConverter.js` を作成し、以下を集約：
- `toRuntimeCategories()`, `toRuntimeEquipments()`, `toRuntimeMissions()` - 永続化形式 → ランタイム形式
- `toPersistCategories()`, `toPersistEquipments()`, `toPersistMissions()` - ランタイム形式 → 永続化形式
- `generateCategoryRepresentatives()` - カテゴリ代表装備の動的生成
- `addEquipmentType()` - 装備にtypeフィールドを付与
- `createCategoryMaps()`, `createEquipmentMap()` - Map生成

命名規則の統一も同時に実施:
- `allEquipmentsForUI` → `equipmentsForUI`
- `App.jsx`での使用箇所も更新

**リファクタした箇所**:
- `src/hooks/useCategories.js`: `toRuntimeCategories()`, `createCategoryMaps()`を使用
- `src/hooks/useEquipments.js`: `toRuntimeEquipments()`, `generateCategoryRepresentatives()`, `addEquipmentType()`, `createEquipmentMap()`を使用
- `src/hooks/useMissions.js`: `toRuntimeMissions()`を使用
- `src/utils/localStorage.js`: `toPersist*()`, `toRuntime*()`を使用して変換処理を集約

**効果**:
- データ変換処理の重複を解消（4箇所 → 1箇所）
- 責務の明確化（永続化層、変換層、フック層の分離）
- 保守性とテスタビリティの向上

**ステータス**: 完了 (2025-12-03)

### Issue #83: App.jxのビジネスロジックをドメイン層に分離 (2025-12-03)

**実装内容**:

3段階のステップでビジネスロジックをドメイン層に分離:

**Step 1: カテゴリ操作の分離**
- `src/domain/categoryOperations.js` を新規作成
- `analyzeCategoryDeletionImpact()`: カテゴリ削除の影響分析
- `buildCategoryDeletionMessage()`: 確認メッセージ構築
- `executeCategoryDeletion()`: カスケード削除実行
- App.jxの`handleDeleteCategory`: 42行 → 9行に削減

**Step 2: 計算ロジックの移行**
- `src/utils/calculateScrapList.js` → `src/domain/scrapCalculation.js` に移動
- 純粋なビジネスロジックをutilsからdomainに移行

**Step 3: 装備操作の移行**
- `src/domain/equipmentOperations.js` を新規作成
- `swapEquipmentOrder()`: 装備のorder値交換ロジック
- App.jxの`handleSwapEquipmentOrder`: 11行 → 3行に削減

**効果**:
- App.jxの行数削減: 約50行
- 責務の明確化: UI層/ドメイン層/utils層の役割が明確に
- テスタビリティ向上: ドメインロジックを独立してテスト可能

**ステータス**: 完了 (2025-12-03)
- PR #92: マージ済み

### Issue #89: ID Map生成ユーティリティの作成 (2025-12-04)

**実装内容**:

`categoryMap`, `equipmentMap` などのID→オブジェクトのMap生成パターンが複数箇所で重複していたため、共通ユーティリティを作成してコードの重複を削減した。

**変更箇所**:

1. **新規ファイル作成**:
   - `src/hooks/useIdMap.js`: ID→オブジェクトのMapを作成・メモ化するカスタムフック

2. **ユーティリティ関数追加**:
   - `src/utils/dataManagement.js`: `createIdMap()`関数を追加

3. **既存コードのリファクタ**:
   - `src/utils/dataConverter.js`: `createCategoryMaps()`, `createEquipmentMap()`で`createIdMap()`を使用

**効果**:

- コードの重複削減: 約10行
- 一貫性向上: Map生成パターンが統一
- 保守性向上: 最適化が必要な場合1箇所の修正で済む

**ステータス**: 完了 (2025-12-04)

## Phase 2: 計算ロジック拡張

### #75: 任務の実行回数選択を可能にする

**Priority**: P2 (中優先度)

**ユースケース**:

DailyやWeekly（あるいはMonthly...）を複数回実行することで、大量の廃棄を達成することが考えられる。

**実装内容**:

* 任務選択時（あるいは選択中任務部分）に実行回数選択機能を追加
* 計算ロジックで回数を考慮した廃棄数を算出

**依存関係**:

* Phase 1 (#74) の完了が前提
* 計算ロジックが`targetType`ベースに変更されている必要がある

**実装タスク**:

* [ ] データスキーマ検討
    * [ ] 選択中任務の回数をどこに保存するか（SessionStorage）
* [ ] UI実装
    * [ ] 選択中任務一覧に回数選択UI追加
    * [ ] 回数変更時の再計算
* [ ] 計算ロジック修正
    * [ ] `calculateScrapList`: 回数による乗算処理
* [ ] テスト
    * [ ] 複数回実行時の計算結果確認

## Phase 3: UX改善

### #76: 任務選択をベース任務と補助任務に分ける

**Priority**: P2 (中優先度)

**ユースケース**:

1. ある特定の廃棄任務をクリアしたい
2. そのために並列で実行できる任務はないか

という流れが多い。

**実装内容**:

* ベース任務とそれを達成する際についでに達成できる補助任務を明確に分ける
* 補助任務の計算ロジックは現状維持
* ベース任務と補助任務の合計を比較して、ベース任務達成までに何が足りないか/何が過剰に捨てることになるかを確認できるようにする

**依存関係**:

* Phase 2 (#75) の完了が前提
* #75との実装順調整が必要

**実装タスク**:

* [ ] UI設計
    * [ ] ベース任務選択UI
    * [ ] 補助任務選択UI
    * [ ] 過不足表示UI
* [ ] 状態管理
    * [ ] ベース/補助の分離管理
* [ ] 計算ロジック拡張
    * [ ] ベース任務の必要数算出
    * [ ] 補助任務との差分計算
* [ ] テスト
    * [ ] ベース/補助分離時の計算結果確認

## Phase 4: バグ修正・小規模改善

破壊的変更のないバグ修正と小規模な機能追加。Phase 1-3完了後に実装。

### バグ修正

#### #72: 初回起動時にAboutモーダルが自動表示されない問題

* **Status**: Open (bug)
* **Priority**: P1
* **実装方針**: useAboutModalカスタムフック作成、初回起動判定ロジック実装
* **影響範囲**: `src/hooks/useAboutModal.js` (新規), `src/App.jsx`

### 基本機能追加

#### #73: 任務の編集機能

* **Priority**: P2
* **実装内容**: 既存任務の編集モーダル、MissionCardに編集ボタン追加
* **影響範囲**: `src/components/MissionModal.jsx`, `src/components/MissionCard.jsx`, `src/App.jsx`

#### #12: インポート/エクスポート処理

* **Priority**: P2
* **実装内容**: JSON形式でのデータインポート/エクスポート機能
* **影響範囲**: `src/components/Header.jsx`, `src/utils/importExport.js` (新規)

#### #43: インポートデータのサイズ制限

* **Priority**: P3
* **依存**: #12
* **実装内容**: インポート時のファイルサイズ制限、バリデーション強化

### UX改善

#### #11: フィルタ永続化

* **Priority**: P3
* **実装内容**: SessionStorageにフィルタ状態を保存
* **影響範囲**: `src/hooks/useMissionFilter.js`

#### #10: storage監視

* **Priority**: P3
* **実装内容**: 他タブでの更新検知、リロード通知
* **影響範囲**: `src/App.jsx`, `src/hooks/useStorageSync.js` (新規)

### エラー処理強化

#### #9: プライベートモード検出

* **Priority**: P2
* **実装内容**: LocalStorage使用不可時の読み取り専用モード
* **影響範囲**: `src/utils/localStorage.js`, `src/App.jsx`

### UI改善

#### #78: ダークモードの追加

* **Priority**: P3
* **実装内容**: ダークモード対応、テーマ切り替え機能
* **影響範囲**: `src/App.jsx`, CSS/Tailwind設定

## その他

### #46: キャッシュ戦略の仕様明確化

* **Priority**: P3 (低優先度)
* **実装内容**: データバンドル方式のため、キャッシュ戦略の明確化が必要かを再検討

### #30: バックエンド実装

* **Priority**: P3 (低優先度)
* **実装内容**:
    * 問い合わせリダイレクト（PHP経由でGoogleフォームへ）
    * 動的設定配信（config.php, get_settings.php）

## 棚上げ/実装不要

* ❌ #8: ネットワークリトライ・タイムアウト実装
    * **理由**: データバンドル化により不要（obsolete）
* ❌ #45: LocalStorage容量警告
    * **理由**: 保存失敗時のエラー表示で十分と判断（not planned）

## 実装スケジュール（案）

| Phase | Issue | 優先度 | 推定工数 | 依存関係 | 備考 |
|-------|-------|--------|---------|---------|------|
| Phase 1 | #74 | P1 | 大 | なし | 破壊的変更、最優先 |
| Phase 2 | #75 | P2 | 中 | #74 | Phase 1完了後 |
| Phase 3 | #76 | P2 | 大 | #75 | Phase 2完了後 |
| Phase 4 | #72 | P1 | 小 | Phase 1-3 | Phase 1-3完了後 |
| Phase 4 | #73, #12, #43 | P2-P3 | 中 | Phase 1-3 | Phase 1-3完了後 |
| Phase 4 | #11, #10, #9, #78 | P2-P3 | 小-中 | Phase 1-3 | Phase 1-3完了後 |
| その他 | #46, #30 | P3 | 小-中 | なし | 優先度低 |

## 備考

* v1.0.0-betaリリース直後のため、マイグレーション処理は起動時バリデーションで対応
* 破壊的変更を含むため、v2.0.0としてメジャーバージョンアップ
* Phase間の依存関係を考慮し、Phase 1→2→3→4の順で実装
* データ構造変更（Phase 1）を最優先で実施し、全体の基盤を確立
