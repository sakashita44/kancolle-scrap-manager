# v2.0.0 ロードマップ

最終更新: 2025-12-08

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

### Issue #90: useSelectedMissionsのロジック簡素化 (2025-12-04)

**ステータス**: 完了 (2025-12-04)
- PR #94: マージ済み

### Issue #91: 小規模リファクタリングの実施 (2025-12-04)

**実装内容**:

複数の小規模なリファクタリング機会を包括的に実施した:
1. `useToggle`フック導入によるboolean状態管理の共通化
2. `WarningCollector`クラスによる警告管理の統一
3. フィルタ状態の統合（`useReducer`による実装）

**ステータス**: 完了 (2025-12-04)
- PR #98: マージ済み

### Issue #97: 装備管理リストのアコーディオン化による操作性改善と並び替えバグ修正 (2025-12-04)

**問題の背景**:

1. **バグ**: 装備の並び替えがカテゴリ代表をまたいで動作しない
2. **UX課題**: カテゴリと装備の階層関係が視覚的に分かりにくい

**実装内容**:

1. **UI構造変更**:
   - フラットリストからカテゴリ単位のアコーディオン（トグル式）UIに変更
   - カテゴリヘッダーで展開/折りたたみ可能
   - カテゴリ代表装備を各カテゴリの先頭に固定表示

2. **並び替え機能の分離**:
   - カテゴリ間の並び替え: ユーザー定義カテゴリのみ対象、`onSwapCategoryOrder`で処理
   - カテゴリ内装備の並び替え: カテゴリ代表を除く個別装備のみ対象、`onSwapOrder`で処理
   - カテゴリをまたぐ並び替えが不可能になり、バグを根本解決

3. **ドメインロジック追加**:
   - `src/domain/categoryOperations.js`: `swapCategoryOrder()`関数を追加
   - カテゴリのorder値交換処理を統一

**変更箇所**:

- `src/components/EquipmentModal.jsx`: アコーディオンUI実装、グループ化ロジック追加
- `src/domain/categoryOperations.js`: `swapCategoryOrder()`追加
- `src/App.jsx`: `handleSwapCategoryOrder()`追加、`updateUserCategory`の取得、モーダルへの`onSwapCategoryOrder`プロップ追加

**効果**:

- バグ解消: 並び替えロジックが「カテゴリ間」と「カテゴリ内」に分離され、異なる種別をまたぐ必要がなくなり根本解決
- 操作性向上: カテゴリ単位での整理が容易、階層構造が明確
- 視認性向上: カテゴリと装備の関係が一目で分かる

**ステータス**: 実装完了 (2025-12-04)

## Phase 2: 計算ロジック拡張

### #75: 任務の実行回数選択を可能にする (2025-12-04)

**Priority**: P2 (中優先度)

**ユースケース**:

DailyやWeekly（あるいはMonthly...）を複数回実行することで、大量の廃棄を達成することが考えられる。

**実装内容**:

1. **データ構造変更**:
   - 選択中任務のデータ形式を `string[]` から `{ missionId: string, count: number }[]` に変更
   - SessionStorage の自動マイグレーション機能を実装（旧形式→新形式）

2. **UI追加**:
   - 選択中任務カードに実行回数選択UI（+/-ボタンと数値入力）を追加
   - 実行回数の範囲: 1〜99回
   - 選択中任務カードに必要装備の概要を表示

3. **計算ロジック**:
   - 実行回数を考慮した廃棄数の計算（要求数 × 実行回数）
   - 複数任務選択時も正しく動作（MAX集計）

**変更箇所**:

- `src/utils/sessionStorage.js`: データ保存形式変更、マイグレーション追加
- `src/hooks/useSelectedMissions.js`: 状態管理拡張、`updateMissionCount` 追加
- `src/hooks/useScrapCalculation.js`: 引数を `selectedMissions` に変更
- `src/domain/scrapCalculation.js`: 実行回数を考慮した計算に対応
- `src/components/SelectedMissionsSummary.jsx`: 実行回数UI追加、装備概要表示追加
- `src/App.jsx`: フック呼び出しとプロップ渡しを調整

**ステータス**: 完了 (2025-12-04)
- PR #101

**追加対応** (2025-12-05):
- PR #101で追加されたマイグレーション処理をバリデーション対応に変更
- SessionStorageはタブ閉じで消去される一時データのため、v2.0の破壊的変更に伴い旧形式データは初期値にリセットする方針に変更
- `validation.js`: `validateSelectedMissions()`関数を追加（選択中任務データの形式検証）
- `sessionStorage.js`: マイグレーション処理を削除し、`validateSelectedMissions()`を呼び出してバリデーション処理を実装（不正形式の場合は初期値を返す）

## Phase 3: UX改善

### #76: 任務選択をベース任務と補助任務に分ける (2025-12-05)

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

**実装詳細**:

1. **データ構造変更**:
   - 選択中任務のデータ形式を `{missionId, count}[]` から `{baseMission: {missionId, count} | null, auxiliaryMissions: [{missionId, count}]}` に変更
   - SessionStorage の自動マイグレーション機能を実装（2段階: 旧形式→中間形式→新形式）
   - ベース任務: 1件のみ選択可能
   - 補助任務: 最大7件選択可能
   - 合計上限: 8件（ベース1 + 補助7）

2. **UI変更**:
   - 任務カードの選択: チェックボックスで選択（従来通り）
   - ベース任務の指定: 選択中任務エリアで「ベース任務に設定」ボタンをクリック
   - ベース任務の解除: 「ベース任務 (設定中)」ボタンをクリック
   - ベース任務のバツボタン: 選択自体を解除（補助任務に戻さない）
   - 補助任務のバツボタン: 選択を解除

3. **表示領域の追加**:
   - 廃棄リスト: 全選択任務（ベース+補助）の合計廃棄数を表示
   - ベース任務達成状況: StickyDashboard内に統合
     - ベース任務で指定されている装備: 通常背景色（赤/緑/青）
     - ベース任務で指定されていない装備: 灰色背景、灰色テキスト
     - 各装備の過不足表示: 「不足 -X」「余剰 +0」「余剰 +X」

4. **計算ロジック拡張**:
   - `calculateScrapComparison()`: ベース任務と補助任務の過不足を計算
     - `baseRequirements`: ベース任務の必要廃棄リスト
     - `auxiliaryScrapList`: 補助任務の廃棄リスト
     - `comparison`: 装備ごとの過不足情報（baseCount, auxiliaryCount, difference, status）
   - `useScrapComparison`: 計算結果を管理するカスタムフック
     - `allScrapList`: 全選択任務（ベース+補助）の合計廃棄リスト

**変更箇所**:

- `src/utils/sessionStorage.js`: データ保存形式変更、2段階マイグレーション追加
- `src/hooks/useSelectedMissions.js`: ベース/補助分離管理、選択解除ロジック修正
- `src/hooks/useScrapComparison.js`: 新規作成、比較計算と全選択廃棄リスト計算
- `src/domain/scrapCalculation.js`: `calculateScrapComparison()`追加
- `src/components/SelectedMissionsSummary.jsx`: ベース任務設定ボタン追加、バツボタンロジック修正
- `src/components/StickyDashboard.jsx`: ベース任務達成状況の表示追加、視覚的区別の実装
- `src/components/MissionCard.jsx`: ベース任務アイコン表示追加
- `src/components/MissionList.jsx`: `isBaseMission` プロップ追加
- `src/App.jsx`: フック呼び出しとプロップ渡しを調整

**ステータス**: 完了 (2025-12-05)

**実装タスク**:

* [x] データ構造変更
    * [x] `sessionStorage.js`: 2段階マイグレーション実装
    * [x] `useSelectedMissions.js`: ベース/補助分離管理
* [x] UI変更
    * [x] ベース任務選択UI（ボタン方式）
    * [x] ベース任務の視覚的区別（アイコン表示）
    * [x] バツボタンの挙動修正（選択解除）
* [x] 計算ロジック拡張
    * [x] `calculateScrapComparison()`: 過不足計算
    * [x] `useScrapComparison`: 計算フック
    * [x] 全選択廃棄リスト計算
* [x] 表示UI
    * [x] ベース任務達成状況表示（StickyDashboard内）
    * [x] 過不足の視覚的区別（背景色・テキスト色）
    * [x] ベース任務で指定されていない装備の灰色表示
* [x] テスト
    * [x] ベース/補助分離時の計算結果確認
    * [x] エッジケース確認（10パターン）

## Phase 4: 基盤・リファクタ（v2.0.0）

v2.0.0リリースに向けた基盤整備とリファクタリング。Phase 1-3完了後に実装。

### Issue間の依存関係

* **#85 → #100**: エラーハンドリング統一はデータ初期化機能の前提
* **#86 → #100**: バリデーション改善はデータ初期化機能の前提
* **#86 → #81**: バリデーション改善はハッシュベースID実装の前提
* **#85 + #86 + #81 → #12**: エラーハンドリング、バリデーション、ハッシュベースIDはインポート/エクスポート機能の前提

### v2.0.0に含めるタスク

#### #85: エラーハンドリングの統一と一元管理

* **Priority**: P1（v2.0.0の基盤）
* **実装内容**: アプリ全体でエラーハンドリングを統一し、一元管理する仕組みを導入
* **影響範囲**: `src/hooks/useErrorHandler.js` (新規), `src/components/ErrorDisplay.jsx` (新規), `src/App.jsx`
* **ステータス**: 完了 (2025-12-08)

**問題の背景**:

1. **未使用のエラー状態**: App.jxで `errors` state が定義されているが使用されていない
2. **部分的な統合**: `equipmentsCrudError` と `missionsCrudError` は統合されているが、一貫した処理がない
3. **エラー表示の不統一**: ミッションリストエリアにのみエラー表示、他の場所では表示されない

**実装内容**:

1. **統合エラーハンドリングフック作成**:
   - `src/hooks/useErrorHandler.js`: 全てのエラーを一元管理
   - エラー種別（critical, error, warning, info）の定義
   - エラー追加・削除・取得機能
   - **syncErrors機能**: タグベースのエラー同期（重複追加を防止）
   - **タグ管理**: エラーにタグを付与し、特定ソース別にエラーを管理

2. **エラー表示コンポーネント作成**:
   - `src/components/ErrorDisplay.jsx`: エラー種別ごとにスタイリング（Critical/Error/Warning/Info）
   - エラー個別削除機能（×ボタン）
   - lucide-reactアイコン使用（XCircle/AlertCircle/AlertTriangle/Info）

3. **App.jxのリファクタ**:
   - useErrorHandler 導入（syncErrors含む）
   - 以下のエラーソースを統合:
     - **CRUDエラー**: equipmentsCrudError, missionsCrudError（タグ: `crud-equipments`, `crud-missions`）
     - **破損データ警告**: corruptedEquipments, corruptedMissions（タグ: `corrupted-data`）
     - **計算警告**: useScrapComparisonのwarnings（タグ: `calculation`）
   - ErrorDisplayコンポーネント配置
   - 未使用 errors state の削除
   - FooterAreaコンポーネントのerrors propsを削除（ErrorDisplayに統合）

**統合されたエラーソース**:

| エラーソース | タグ | 種別 | 説明 |
|:------------|:-----|:-----|:-----|
| CRUD操作失敗 | `crud-equipments`, `crud-missions` | ERROR | LocalStorage保存失敗など |
| 破損データ | `corrupted-data` | WARNING | 起動時のデータ整合性エラー |
| 計算警告 | `calculation` | WARNING/ERROR | 存在しないID参照、選択数超過など |

**期待される効果**:

* エラー処理の一貫性向上
* 重複エラー表示の防止（syncErrorsによる同期管理）
* #100（データ初期化）、#12（インポート/エクスポート）でのエラーハンドリングが容易に
* 将来的なエラーソース追加が容易（タグベース管理）

#### #86: validation.jsの重複パターンをスキーマベースに共通化

* **Priority**: P1（v2.0.0の基盤）
* **実装内容**: スキーマ定義ベースの汎用バリデーション関数を作成し、コードの重複を削減
* **影響範囲**: `src/utils/validation.js`
* **ステータス**: 未着手

**問題の背景**:

* validateEquipment と validateMission で同じチェックパターンが繰り返されている（必須フィールド、文字数制限、XSS対策など）

**実装方針**:

1. **スキーマ定義作成**: 各データ型のバリデーションルールをスキーマとして定義
2. **汎用バリデーション関数実装**: `validateSchema(data, schema)` 関数を作成
3. **既存関数のリファクタ**: validateEquipment, validateMission を簡素化

**期待される効果**:

* コードの重複削減
* 保守性・拡張性向上
* #100（データ初期化）、#81（ハッシュベースID）、#12（インポート/エクスポート）でのバリデーション実装が容易に

#### #84: ユーザーデータ管理フックの統合

* **Priority**: P2（v2.0.0のリファクタ）
* **実装内容**: useUserDataLoader と useUserDataCRUD を1つの統合フックにまとめる
* **影響範囲**: `src/hooks/useUserData.js` (新規), `src/hooks/useCategories.js`, `src/hooks/useEquipments.js`, `src/hooks/useMissions.js`
* **ステータス**: 未着手

**問題の背景**:

* useUserDataLoader と useUserDataCRUD が常にセットで使用されている
* 各データフックで同じパターンが繰り返されている

**実装方針**:

1. **統合フック作成**: `src/hooks/useUserData.js` を作成し、ロード + CRUD操作を一元管理
2. **既存フックのリファクタ**: useCategories, useEquipments, useMissions で統合フックを使用
3. **旧フックの削除**: useUserDataLoader.js, useUserDataCRUD.js を削除

**期待される効果**:

* コードの重複削減（各データフックで約10行削減）
* 使用パターンの統一
* 保守性向上

#### #100: データ初期化機能の実装とインポート時のデータ整合性強化

* **Priority**: P1（v2.0.0の必須機能）
* **実装内容**: データの完全初期化機能と、インポート時の自動修復機能
* **影響範囲**: `src/components/Header.jsx`, `src/utils/localStorage.js`
* **ステータス**: 未着手
* **依存**: #85（エラーハンドリング統一）, #86（バリデーション改善）

**背景**:

* LocalStorageに不正なデータが残った場合、ユーザー側で解消する手段がない
* インポート時に一部でも不正なデータがあると、インポート失敗または不具合の原因になる

**実装方針**:

1. **データ初期化（全削除）機能**:
   - ヘッダーの設定メニューに「データを初期化（全削除）」項目を追加
   - 確認ダイアログ表示後、LocalStorage内の本アプリ関連データ（`ksp_*`）を全て削除
   - アプリをリロードして初期状態に戻す

2. **インポート時の自動修復**:
   - 参照エラー、ID重複、スキーマ違反を検出
   - 不正なデータを除外してインポートする提案をユーザーに表示
   - 承認後、有効なデータのみを保存

**期待される効果**:

* ユーザー自身でデータトラブルから復旧可能
* 外部共有データファイルの安全な取り込みが可能

#### #81: ID生成方法の見直し（UUID→ハッシュベース）

* **Priority**: P1（v2.0.0のデータ構造変更）
* **実装内容**: 名前ベースのハッシュIDに変更し、ID生成を決定論的にする
* **影響範囲**: `src/utils/idGenerator.js`, `src/utils/hash.js` (新規), `src/components/EquipmentModal.jsx`, `docs/schema.md`
* **ステータス**: 未着手
* **依存**: #86（バリデーション改善）

**問題の背景**:

1. **UUID方式の課題**:
   - 非決定的: 同じ名前でも毎回異なるIDが生成される
   - 重複チェックが複雑: 名前ベースでの重複チェックを別途実装する必要がある
   - デバッグしにくい: IDから元の名前が推測できない

2. **データ共有時の課題**:
   - 他人の「12.7cm単装砲」と自分の「12.7cm単装砲」が別IDになる
   - #12（インポート/エクスポート）でのID衝突問題の原因

**実装方針**:

1. **ハッシュベースID生成**:
   - カテゴリID: `u_cat_<hash(カテゴリ名)>`
   - 装備ID: `u_eq_<hash(カテゴリ名/装備名)>`
   - SHA-256の最初の8文字を使用

2. **後方互換性の確保**:
   - 既存のUUIDベースIDはそのまま使用可能
   - バリデーションで両フォーマット（UUID/ハッシュ）を受け入れる
   - 新規データ生成時のみハッシュベース方式を使用

3. **衝突検出と対処**:
   - ID生成時に既存IDとの衝突をチェック
   - 衝突時はsuffixを追加（例: `u_eq_a1b2c3d4_1`）

4. **名前変更の明示的な禁止**:
   - 名前変更は「削除→再作成」とする
   - ドキュメントに明記

**期待される効果**:

* 重複検出が容易（同じ名前なら同じIDになる）
* 決定論的でテストが書きやすい
* #12（インポート/エクスポート）でのID衝突問題が一部解決

**注意点**:

* 既存ユーザーデータへの影響なし（後方互換性あり）
* v3まで変更不可のため、v2.0.0で実装しておくべき

### v2.0.0の完了済みタスク

#### #72: 初回起動時にAboutモーダルが自動表示されない問題

* **Priority**: P1
* **ステータス**: 完了 (2025-12-05)

#### #73: 任務の編集機能

* **Priority**: P2
* **ステータス**: 完了 (2025-12-05)

**実装詳細**:

1. **MissionModalの編集モード対応**:
   - `editingMission`プロップを追加（編集対象の任務、追加時はnull）
   - 編集時は既存の任務データを初期値として設定
   - 保存時に`id`と`order`を保持（編集時は既存値、追加時は新規生成）
   - ボタンテキストを「追加」「更新」に切り替え

2. **MissionCardの編集ボタン追加**:
   - ユーザー定義任務に編集ボタンを追加（Edit2アイコン）
   - 編集ボタンと削除ボタンを横並びで配置
   - 編集ボタンクリック時に`onEdit(mission)`を呼び出し

3. **App.jxの編集ロジック実装**:
   - `updateUserMission`を`useMissions`フックから取得
   - `editingMission`ステートを追加（編集中の任務を管理）
   - `handleEditMission`: 編集対象の任務を設定してモーダルを開く
   - `handleSaveMission`: 追加・編集を統合処理（`data.id`の有無で判定）
   - モーダルを閉じる際に`editingMission`をリセット
   - `MissionList`に`onEdit`プロップを渡す

4. **MissionListのプロップス追加**:
   - `onEdit`プロップを追加し、`MissionCard`に渡す

## Phase 5: v2.1.0以降のタスク

v2.0.0リリース後に実装する機能改善。

### データ管理機能（v2.1.0）

#### #12: インポート/エクスポート処理

* **Priority**: P2
* **実装内容**: JSON形式でのデータインポート/エクスポート機能
* **影響範囲**: `src/components/Header.jsx`, `src/utils/importExport.js` (新規)
* **ステータス**: 仕様検討中 (2025-12-07)
* **依存**: #85（エラーハンドリング統一）, #86（バリデーション改善）, #81（ハッシュベースID）

**仕様検討が必要な理由**:

1. **データ共有時の根本的な課題**:
   - 同名・別ID問題: 他人の「12.7cm単装砲」と自分の「12.7cm単装砲」は別UUID → #81で一部解決
   - マージ戦略が未定義: 完全上書き？IDベースマージ？名前ベースマージ？ユーザー選択式？

2. **参照整合性チェックの複雑性**:
   - ユーザーデータ内にも依存関係がある（カテゴリ→装備→任務）
   - インポートデータ + 公式マスタでの依存解決が必要
   - 解決失敗時の挙動（エラー？除外？警告？）

3. **未確定の仕様**:
   - ユースケース: 個人バックアップ？コミュニティ共有？
   - ID衝突時の挙動
   - 選択的インポート（必要な任務だけ取り込むなど）

**検討すべき項目**:
- ユースケースの明確化
- ID衝突時の挙動（エラー、上書き、マージ、ユーザー選択）
- マージ戦略（完全上書き、選択的インポート、差分マージ）
- 参照整合性チェックと依存解決のフロー
- UI/UX（確認ダイアログでの情報表示、エラー表示）

**実装は仕様確定後に延期** (v2.0.0には含めない)

#### #43: インポートデータのサイズ制限

* **Priority**: P3
* **依存**: #12
* **実装内容**: インポート時のファイルサイズ制限、バリデーション強化

### エラー処理強化（v2.1.0）

#### #9: プライベートモード検出

* **Priority**: P3
* **実装内容**: LocalStorage使用不可時の読み取り専用モード
* **影響範囲**: `src/utils/localStorage.js`, `src/App.jsx`

### UX改善（v2.1.0以降）

#### #11: フィルタ永続化

* **Priority**: P3
* **実装内容**: SessionStorageにフィルタ状態を保存
* **影響範囲**: `src/hooks/useMissionFilter.js`

#### #10: storage監視

* **Priority**: P3
* **実装内容**: 他タブでの更新検知、リロード通知
* **影響範囲**: `src/App.jsx`, `src/hooks/useStorageSync.js` (新規)

#### #78: ダークモードの追加

* **Priority**: P3
* **実装内容**: ダークモード対応、テーマ切り替え機能
* **影響範囲**: `src/App.jsx`, CSS/Tailwind設定

#### #93: 選択中任務一覧の表示アニメーション改善

* **Priority**: P3
* **実装内容**: CSSの transition プロパティを利用して、アコーディオンのように滑らかに展開・収納
* **影響範囲**: `src/components/SelectedMissionsSummary.jsx`

### その他（v2.1.0以降）

#### #79: Google Analytics (GA4) の導入

* **Priority**: P3
* **実装内容**: ユーザーのアクセス状況を分析するため、GA4を導入
* **影響範囲**: `src/index.jsx`, `.env`

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

## 実装スケジュール

| Phase | Issue | 優先度 | 推定工数 | 依存関係 | ステータス |
|-------|-------|--------|---------|---------|-----------|
| Phase 1 | #74 | P1 | 大 | なし | ✅ 完了 |
| Phase 2 | #75 | P2 | 中 | #74 | ✅ 完了 |
| Phase 3 | #76 | P2 | 大 | #75 | ✅ 完了 |
| Phase 4 (v2.0.0) | #72, #73 | P1-P2 | 小 | Phase 1-3 | ✅ 完了 |
| Phase 4 (v2.0.0) | #85 | P1 | 中 | なし | ✅ 完了 |
| Phase 4 (v2.0.0) | #86 | P1 | 中 | なし | 未着手 |
| Phase 4 (v2.0.0) | #84 | P2 | 小 | なし | 未着手 |
| Phase 4 (v2.0.0) | #100 | P1 | 中 | #85, #86 | 未着手 |
| Phase 4 (v2.0.0) | #81 | P1 | 中 | #86 | 未着手 |
| Phase 5 (v2.1.0) | #12 | P2 | 大 | #85, #86, #81 | 仕様検討中 |
| Phase 5 (v2.1.0) | #43 | P3 | 小 | #12 | 未着手 |
| Phase 5 (v2.1.0以降) | #9, #11, #10, #78, #93, #79 | P3 | 小-中 | なし | 未着手 |
| その他 | #46, #30 | P3 | 小-中 | なし | 優先度低 |

## 今後の方針 (2025-12-08更新)

### 完了状況

* ✅ **Phase 1**: データ構造改善 - 完了
  - Issue #74, #80, #83, #89, #90, #91, #97: 完了
* ✅ **Phase 2**: 計算ロジック拡張 - 完了
  - Issue #75: 完了
* ✅ **Phase 3**: UX改善 - 完了
  - Issue #76: ベース任務と補助任務の分離 - 完了
* ⏳ **Phase 4**: 基盤・リファクタ（v2.0.0） - 進行中
  - 完了: #72, #73, #85
  - 残り: #86, #84, #100, #81

### v2.0.0リリースに向けたスコープ

Phase 1-3のコア機能が完成したため、v2.0.0リリースに向けて基盤整備とリファクタリングを実施する。

**v2.0.0に含めるタスク** (5件):

1. **#85**: エラーハンドリングの統一と一元管理（P1、基盤）
2. **#86**: validation.jsの重複パターンをスキーマベースに共通化（P1、基盤）
3. **#84**: ユーザーデータ管理フックの統合（P2、リファクタ）
4. **#100**: データ初期化機能の実装（P1、必須機能）
5. **#81**: ID生成方法の見直し（P1、データ構造変更）

**v2.1.0以降に延期するタスク**:

* **#12**: インポート/エクスポート（仕様検討中、#85/#86/#81の完了後に実装）
* **#9, #11, #10, #78, #93, #79, #43**: UX改善・その他機能

**延期の理由**:

* v2.0.0は基盤整備に集中し、早期リリースを目指す
* #12は仕様が未確定で実装規模が大きい（v2.1.0で実装）
* UX改善系はv2リリースに必須ではない（v2.1.0以降で順次実装）
* #81（ハッシュベースID）はv3まで変更不可のため、v2.0.0で実装必須

### v2.0.0推奨実装順序

**依存関係を考慮した実装順序**:

1. **#85**: エラーハンドリング統一（全体の基盤）
2. **#86**: バリデーション改善（#100/#81の前提）
3. **#84**: フック統合（並行可能、他に依存しない）
4. **#100**: データ初期化（#85/#86を使用）
5. **#81**: ハッシュベースID（#86を使用、データ構造変更）

**実装後**: v2.0.0リリース → v2.1.0で#12等の機能追加

## 備考

* v1.0.0-betaリリース直後のため、マイグレーション処理は起動時バリデーションで対応
* 破壊的変更を含むため、v2.0.0としてメジャーバージョンアップ
* Phase間の依存関係を考慮し、Phase 1→2→3→4の順で実装
* データ構造変更（Phase 1）を最優先で実施し、全体の基盤を確立
