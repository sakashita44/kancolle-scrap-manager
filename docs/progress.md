# 開発進捗

最終更新: 2025-11-27 (共通処理の関数分離: CRUDエラーハンドリング修正)

## マイルストーン

### v1.0.0 初期リリース (目標: 2025-11-30)

* [x] コアロジック実装
    * [x] 計算ロジック
    * [x] バリデーション
    * [x] データフェッチ
    * [x] バリデーション強化 (#5, #6)
* [x] 基本UIコンポーネント実装 (#7)
    * [x] Phase 1-10完了
    * [x] 追加UI機能 (#17, #18, #19, #20)
    * [x] Global Warning Banner (#21, #31)
* [ ] コード品質改善
    * [x] SOLID原則違反の分析
    * [x] 過剰なリファクタリング提案の整理 (#26, #28 close)
    * [x] バリデーション統合 Phase 1 (#23)
    * [x] バリデーションUI実装 Phase 2 (#31)
    * [x] パフォーマンス最適化 (#24)
    * [x] App.jsxリファクタリング (#25)
    * [x] 周期フィルタ実装とフィルタロジックのhook化 (#18)
    * [x] 共通処理の関数分離 (#50)
    * [ ] エラーログ出力統一 (#27)
* [ ] セキュリティ・安定性強化
    * [ ] XSS対策の強化 (#42)
* [ ] リリース準備
    * [ ] ユーザーマニュアル整備 (#49)
    * [ ] リリース前QAチェックリスト実施 (#47)
    * [ ] 本番環境デプロイフロー整備 (#48)

### v1.1.0 以降 (機能追加・UX改善)

* 追加機能
    * インポート/エクスポート処理 (#12)
    * インポートデータのサイズ制限 (#43)
    * LocalStorage容量警告 (#45)
    * storage監視 (#10)
    * フィルタ永続化 (#11)
    * キャッシュ戦略の仕様明確化 (#46)
* エラー処理強化
    * ネットワークリトライ・タイムアウト (#8)
    * プライベートモード検出 (#9)
* バックエンド実装 (#30)

## 機能別実装状況

### データ層

| 機能                   | 状況     | Issue | 備考                                  |
| :--------------------- | :------- | :---- | :------------------------------------ |
| 装備マスタフェッチ     | ✅ 完了   | -     | GitHub Pages + ローカルフォールバック |
| 任務マスタフェッチ     | ✅ 完了   | -     | GitHub Pages + ローカルフォールバック |
| LocalStorage管理       | ✅ 完了   | -     | ユーザー定義データの永続化            |
| SessionStorage管理     | ✅ 完了   | -     | 選択任務の永続化                      |
| リトライ・タイムアウト | ❌ 未実装 | #8    | Priority 2                            |

### バリデーション

| 機能                         | 状況   | Issue | 備考                                                         |
| :--------------------------- | :----- | :---- | :----------------------------------------------------------- |
| 基本バリデーション           | ✅ 完了 | -     | 必須フィールド、型、文字数制限                               |
| ID形式チェック               | ✅ 完了 | -     | プレフィックスチェック                                       |
| ID空チェック                 | ✅ 完了 | #5    | プレフィックス後が空でないこと                               |
| 重複要求チェック             | ✅ 完了 | #6    | 同一任務内での装備重複                                       |
| 公式マスタバリデーション     | ✅ 完了 | #23   | dataFetch.js: フェッチ後にバリデーション、フォールバック対応 |
| 起動時バリデーション         | ✅ 完了 | #23   | localStorage.js: 破損データ自動削除                          |
| Hooksバリデーション統合      | ✅ 完了 | #23   | useEquipments/useMissions: corruptedItems対応                |
| Modal フォームバリデーション | ✅ 完了 | #31   | リアルタイムバリデーション、エラー表示、保存ボタン無効化     |
| Global Warning Banner        | ✅ 完了 | #31   | 破損データ通知バナー、Header下に配置、[×]で非表示            |

### 計算ロジック

| 機能                         | 状況   | Issue | 備考                                   |
| :--------------------------- | :----- | :---- | :------------------------------------- |
| MAX集計                      | ✅ 完了 | -     | 同じ装備を要求する複数任務の最大値採用 |
| 包含関係解決                 | ✅ 完了 | -     | ItemとCategoryのOR条件処理             |
| エッジケース対応             | ✅ 完了 | -     | 存在しない装備ID、選択任務0件等        |
| 装備検索パフォーマンス最適化 | ✅ 完了 | #24   | Map化によるO(1)アクセス                |

### カスタムフック

| 機能                | 状況   | Issue | 備考                                             |
| :------------------ | :----- | :---- | :----------------------------------------------- |
| useEquipments       | ✅ 完了 | -     | 装備データ管理                                   |
| useMissions         | ✅ 完了 | -     | 任務データ管理                                   |
| useSelectedMissions | ✅ 完了 | -     | 選択任務の状態管理                               |
| useScrapCalculation | ✅ 完了 | -     | 廃棄リスト計算                                   |
| useMissionFilter    | ✅ 完了 | #18   | フィルタロジック統合（テキスト・周期・カテゴリ） |

### UI

| 機能                         | 状況   | Issue   | 備考                                         |
| :--------------------------- | :----- | :------ | :------------------------------------------- |
| Header                       | ✅ 完了 | #7      | アプリ名表示（設定メニューは#20）            |
| Sticky Dashboard             | ✅ 完了 | #7      | 廃棄リスト表示                               |
| Control Bar                  | ✅ 完了 | #7, #18 | テキスト検索、周期フィルタ、カテゴリフィルタ |
| Mission List                 | ✅ 完了 | #7      | 任務カード一覧、選択機能                     |
| Footer Area                  | ✅ 完了 | #7      | エラーログ表示                               |
| 装備管理モーダル             | ✅ 完了 | #7      | 装備の追加・削除・一覧                       |
| 任務追加/編集モーダル        | ✅ 完了 | #7      | 任務の作成（全周期対応）                     |
| Modal共通コンポーネント      | ✅ 完了 | #7      | 汎用モーダルベース                           |
| 選択中任務一覧               | ✅ 完了 | #17     | フィルタ適用時でも選択任務を常に表示         |
| 削除確認ダイアログ           | ✅ 完了 | #19     | ConfirmDialogコンポーネント、DIP原則適用     |
| Header設定メニュー           | ✅ 完了 | #20     | 設定ドロップダウン、Aboutモーダル            |
| Global Warning Banner        | ✅ 完了 | #31     | 破損データ通知、マスタフェッチ警告対応       |
| Modal フォームバリデーション | ✅ 完了 | #31     | リアルタイムバリデーション、エラー表示       |

### その他機能

| 機能                   | 状況     | Issue | 備考                                              |
| :--------------------- | :------- | :---- | :------------------------------------------------ |
| インポート処理         | ❌ 未実装 | #12   | Priority 3                                        |
| エクスポート処理       | ❌ 未実装 | #12   | Priority 3                                        |
| フィルタ永続化         | ❌ 未実装 | #11   | Priority 3: SessionStorage                        |
| storage監視            | ❌ 未実装 | #10   | Priority 3: 他タブでの更新検知                    |
| プライベートモード検出 | ❌ 未実装 | #9    | Priority 2                                        |
| 問い合わせリダイレクト | ❌ 未実装 | #30   | Priority 3: PHP経由でGoogleフォームへリダイレクト |
| 動的設定配信           | ❌ 未実装 | #30   | Priority 3: config.php, get_settings.php          |

### コード品質・リファクタリング

| 項目                     | 状況     | Issue | 備考                                     |
| :----------------------- | :------- | :---- | :--------------------------------------- |
| SOLID原則違反の分析      | ✅ 完了   | -     | 密結合・責務過多などの課題を特定         |
| リファクタリング提案整理 | ✅ 完了   | -     | 過剰な抽象化提案を削除（YAGNI原則適用）  |
| App.jsxリファクタリング  | ✅ 完了   | #25   | ID生成ユーティリティ化、カテゴリ生成分離 |
| フィルタロジックのhook化 | ✅ 完了   | #18   | useMissionFilter.js作成、SRP適合         |
| エラーログ出力統一       | ❌ 未実装 | #27   | Priority 2: logger.js作成、軽量版実装    |

## 完了済みタスク

* ✅ 選択中任務一覧の実装 (2025-11-26) (#17)
    * src/components/SelectedMissionsSummary.jsx作成（折り畳み可能な選択中任務一覧）
    * StickyDashboard直下に配置、フィルタ適用時でも選択任務を常に表示
    * 選択数バッジ、全解除ボタン、個別解除機能
    * 開閉アイコン、ミニカード形式で横スクロール対応
    * StickyDashboard.jsxから選択数バッジと全解除ボタンを移動、責務分離
    * App.jsxでselectedMissionIds配列のfilter処理修正（.has() → .includes()）
* ✅ Header設定メニューとAboutモーダルの実装 (2025-11-26) (#20)
    * src/components/AboutModal.jsx作成（アプリ情報、概要、データ取り扱い、ライセンス、免責事項）
    * Header.jsxに設定ドロップダウンメニュー実装（エクスポート/インポート/About/GitHub）
    * メニュー外クリック・Escキー対応
    * App.jsxにAboutモーダルstate管理追加
    * エクスポート/インポートプレースホルダー実装（issue #12で完成予定）
* ✅ 削除確認モーダルの実装 (2025-11-26) (#19)
    * src/components/ConfirmDialog.jsx作成（汎用確認ダイアログ）
    * variant対応（danger/warning/info）、キーボード操作対応（Esc/Enter）
    * App.jsxでwindow.confirm → ConfirmDialog置き換え
    * 装備削除・任務削除の確認フロー統一
    * DIP原則適用、テスタビリティ向上
* ✅ UI/UX改善 (2025-11-24) (#36)
    * Header: タイトルを「工廠任務廃棄マネージャー」に修正
    * StickyDashboard: 「廃棄リスト」に修正、選択数表示を「x/8」形式に変更
    * MissionCard: 選択上限時にチェックボックス無効化、カード全体を灰色表示
    * EquipmentModal: 区分フィールドに説明追加、カテゴリフィールドをselect/input切替式に改善
* ✅ 周期フィルタ実装とフィルタロジックのhook化 (2025-11-24) (#18)
    * src/hooks/useMissionFilter.js作成（テキスト・周期・カテゴリの統合管理）
    * ControlBar.jsxに周期フィルタドロップダウン追加（全周期/Daily/Weekly/Monthly/Quarterly/Yearly/OneTime）
    * App.jsxからフィルタロジックをhookに移行（SRP適合）
    * 複合フィルタ対応（AND条件）、既存機能の退行なし
* ✅ App.jsxの責務分離とユーティリティ関数化 (2025-11-24) (#25)
    * Phase 1: src/utils/idGenerator.js作成（generateEquipmentId/generateMissionId）
    * Phase 3: useEquipments.jsにcategoriesをuseMemoで追加
    * App.jsx内のID生成とカテゴリ生成ロジックを削除
    * SRP適合、テスタビリティ向上
* ✅ 装備検索のMap化によるパフォーマンス最適化 (2025-11-24) (#24)
    * calculateScrapList.jsでequipmentMapを生成、find()をget()に置換
    * App.jsxでequipmentMap生成、フィルタリングロジック最適化
    * MissionCard.jsxでequipmentMap使用（O(n)→O(1)アクセス）
* ✅ プロジェクトセットアップ (Vite + React + Tailwind CSS)
* ✅ 仕様ドキュメント作成
    * `docs/design.md`
    * `docs/calculation_logic.md`
    * `docs/error_handling.md`
    * `docs/schema.md`
    * `docs/ui_specification.md`
* ✅ コアロジック実装
    * `src/utils/calculateScrapList.js`
    * `src/utils/validation.js`
    * `src/utils/dataFetch.js`
    * `src/utils/localStorage.js`
    * `src/utils/sessionStorage.js`
* ✅ カスタムフック実装
    * `src/hooks/useEquipments.js`
    * `src/hooks/useMissions.js`
    * `src/hooks/useSelectedMissions.js`
    * `src/hooks/useScrapCalculation.js`
* ✅ スキーマ定義
    * `src/types/schema.js`
* ✅ マスタデータ作成
    * `public/data/equipments.json`
    * `public/data/missions.json`
* ✅ コードレビュー実施 (2025-11-23)
* ✅ 仕様レビュー・修正完了 (2025-11-23)
    * タイムゾーン仕様の明確化
    * エラーログ仕様の整理（履歴不要、現在のみ）
    * バージョン管理方針の変更（スキーマバリデーションベース）
    * 包含解決の詳細例追加
    * 統合ファイルエラー処理の追加
* ✅ バリデーション強化 (2025-11-23)
    * ユーザー定義IDの空チェック実装 (#5)
    * 同一任務内での装備重複要求チェック実装 (#6)
* ✅ UIコンポーネント実装 Phase 1-10 (2025-11-24) (#7)
    * Header, StickyDashboard, ControlBar, MissionList, FooterArea
    * Modal, EquipmentModal, MissionModal
    * SOLID原則に基づくリファクタリング
    * 配列/SetのAPI混同バグ修正
    * 全解除ボタン、ローディング表示統合
* ✅ SOLID原則違反の分析と課題の特定 (2025-11-24)
    * 密結合の特定（App.jsx, MissionCard, dataFetch等）
    * コード重複の特定（useEquipments/useMissions）
    * パフォーマンスボトルネックの特定（装備検索）
    * 6件の改善issueを作成 (#23-#28)
    * 既存issueへのリファクタリング提案を追記 (#18, #19)
* ✅ リファクタリング提案の整理 (2025-11-24)
    * 過剰な抽象化提案を削除（YAGNI, KISS原則に基づく判断）
    * #26 (Hooks共通化) をclose: Rule of Three原則（3つ目まで抽象化しない）
    * #28 (環境変数化) をclose: 個人プロジェクトには不要
    * #27を軽量版に変更: エラーログ出力統一（logger.jsのみ）
* ✅ バリデーション統合 Phase 1 (2025-11-24) (#23)
    * 公式マスタバリデーション実装（dataFetch.js）
    * 起動時バリデーション実装（localStorage.js）
    * Hooksにバリデーション統合（useEquipments/useMissions）
    * 破損データ自動削除とcorruptedItems対応
    * .env.example作成（環境変数設定）
    * Phase 2（UI実装）は#31で継続
* ✅ バリデーションUI実装 Phase 2 (2025-11-24) (#31)
    * EquipmentModalにリアルタイムバリデーション実装
        * 必須フィールド、文字数制限チェック
        * 同名警告表示
        * 文字数カウンター表示
        * エラー時の保存ボタン無効化
    * MissionModalにリアルタイムバリデーション実装
        * 任務名、要求装備、必要数の検証
        * エラー時の保存ボタン無効化
    * GlobalWarningBannerコンポーネント実装
        * 破損データ通知（装備・任務）
        * [×]ボタンで非表示機能
        * type指定でwarning/error/info対応
    * App.jsxにGlobalWarningBanner統合
* ✅ order・isMaster設計の導入とデータ構造変更 (2025-11-26) (#39)
    * isMaster自動付与と並び替えロジックの実装
        * dataFetch.js: マスタデータにisMaster:true付与
        * localStorage.js: ユーザーデータにisMaster:false付与、保存時に除外
        * useEquipments.js: isMaster→order順ソート
        * useMissions.js: period→isMaster→order順ソート
    * orderとcategoryIdフィールドのバリデーション追加
        * validation.js: equipment.orderとmission.orderのバリデーション追加
        * validation.js: equipment.category→categoryIdに修正
    * category→categoryId移行と表示ロジック整理
        * EquipmentModal.jsx: categoryIdベースの表示に変更、order追加
        * useMissionFilter.js: categoryIdベースのフィルタリング
    * order自動採番とcategories.json活用でバグ修正
        * useEquipments.js/useMissions.js: getNextOrder()関数追加（最大order+1）
        * EquipmentModal.jsx/MissionModal.jsx: order固定値→自動採番に修正
        * dataFetch.js: fetchCategories()追加、categoriesバリデーション実装
        * useCategories.js: 新規作成（categories.jsonからカテゴリマスタ取得）
        * App.jsx: useCategories()使用、カテゴリ取得元を変更
        * calculateScrapList.js: categoryNameMapを引数で受け取るよう修正
        * useEquipments.js: categoryNameMap/getCategoryName削除（責務分離）
* ✅ 共通処理の関数分離 (2025-11-27) (#50 完了)
    * **CRUDエラーハンドリング修正**
      * useEquipments.js: crudError state追加、useUserDataCRUDにsetCrudError渡し
      * useMissions.js: crudError state追加、useUserDataCRUDにsetCrudError渡し
      * App.jsx: equipmentsCrudError/missionsCrudError受取、errorMessage統合
      * エラー種別の分離（マスタデータフェッチエラー vs CRUD操作エラー）
      * LocalStorage quota超過やJSON serialization失敗を捕捉可能に
    * **ValidationErrorDisplayコンポーネント実装**
      * src/components/ValidationErrorDisplay.jsx作成（エラー・警告表示の統一）
      * EquipmentModal.jsx: 12行削減、ValidationErrorDisplay使用
      * MissionModal.jsx: 9行削減、ValidationErrorDisplay使用
      * エラー表示UIの完全統一、保守性向上

## 次のステップ

### v1.0.0 残タスク (Priority 1)

* コード品質改善
    * エラーログ出力統一 (#27)
* セキュリティ・安定性強化
    * XSS対策の強化 (#42)
* リリース準備
    * ユーザーマニュアル整備 (#49)
    * リリース前QAチェックリスト実施 (#47)
    * 本番環境デプロイフロー整備 (#48)

### v1.1.0 以降 (Priority 2-3)

* 追加機能実装
    * インポート/エクスポート処理 (#12)
    * インポートデータのサイズ制限 (#43)
    * LocalStorage容量警告 (#45)
    * storage監視 (#10)
    * フィルタ永続化 (#11)
    * キャッシュ戦略の仕様明確化 (#46)
* エラー処理強化
    * ネットワークリトライ・タイムアウト実装 (#8)
    * プライベートモード検出実装 (#9)
* バックエンド実装
    * 問い合わせリダイレクトと動的設定配信 (#30)

## 備考

* UIコンポーネントは段階的に実装することを推奨
* バージョン管理: スキーマバリデーションベースで対応. バージョン番号は人間用情報として使用
* スキーマ変更時は後方互換性を維持. 互換破棄時の変換器実装は現時点では予定なし
* リファクタリング方針:
    * SOLID原則は重要だが、YAGNI、KISSも考慮
    * 過剰な抽象化は避ける（環境変数化、複雑なエラークラス体系等）
    * 実用的で効果が大きい改善を優先
    * 抽象化は実際に必要になってから実施
* コード品質改善はUX改善と並行して進めることを推奨. 相互に影響する部分（フィルタロジック、削除確認等）は統合して実装
