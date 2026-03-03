# 計算ロジック仕様

## 概要

本文書では,選択された任務から廃棄すべき装備の最小リストを算出するアルゴリズムを定義する.

## 計算の目的

複数の工廠任務(廃棄任務)を並列遂行する際,各任務の要求装備を単純に合計すると,重複分を無駄に廃棄してしまう.本システムは以下のルールに基づき,**必要最小限の廃棄数**を算出する.

### ゲーム内の廃棄任務の特性

1. **AND条件**: 一つの任務内の複数の要求装備は全て満たす必要がある
1. **並列達成**: 複数の任務を同時選択している場合,一度の廃棄操作で条件を共有できる
1. **MAX集計**: 同じ装備を要求する複数の任務がある場合,最大値が必要数となる(合計ではない)
1. **OR条件(包含関係)**: カテゴリ指定と個別装備指定が混在する場合,個別装備はカテゴリに包含される
1. **複合カテゴリ包含**: `categoryGroup` 指定は `equipment` / `category` 指定を包含できる

## 入力データ

### 選択任務リスト

ユーザーが選択した任務のエントリリスト(最大8件). 各エントリは任務IDと遂行回数(count)を持つ.

```typescript
const selectedMissions: SelectedMissionEntry[] = [
    { missionId: 'm_ms_daily_scrap_1', count: 1 },
    { missionId: 'm_ms_weekly_scrap_1', count: 1 },
];
```

### マスタデータ

- 装備マスタ: 全装備の情報（`Map<string, Equipment>`）
- カテゴリマスタ: 全カテゴリの情報（`Map<string, Category>`）
- 任務マスタ: 全任務の情報（`Mission[]`）

## 出力データ

廃棄すべき装備のリスト.

```typescript
interface ScrapListItem {
    targetKind: RequirementKind; // 'equipment' | 'category' | 'categoryGroup'
    targetId: string;
    name: string;
    categoryName: string;
    count: number;
}
```

```typescript
const scrapList: ScrapListItem[] = [
    {
        targetKind: 'equipment',
        targetId: 'm_eq_gun_12cm',
        name: '12cm単装砲',
        categoryName: '小口径主砲',
        count: 3,
    },
    {
        targetKind: 'category',
        targetId: 'm_cat_mg',
        name: '機銃（種別不問）',
        categoryName: '機銃',
        count: 2,
    },
];
```

## アルゴリズム

### フェーズ1: 事前チェック

1. 選択任務が0件の場合,空の廃棄リストを返して終了
1. 選択任務が8件を超える場合,エラーを返して終了(UI側で制御するため通常は発生しない)

### フェーズ2: 要求装備の展開

選択された各任務の要求装備リスト(`reqs`)を全て抽出する. 各要求の`count`は任務の遂行回数(`selected.count`)を乗算する.

```typescript
interface ExpandedRequirement {
    missionId: string;
    missionName: string;
    kind: RequirementKind; // 'equipment' | 'category' | 'categoryGroup'
    targetId: string;
    count: number;
}

for (const selected of selectedMissions) {
    const mission = allMissions.find((m) => m.id === selected.missionId);
    if (!mission) {
        warnings.push(`任務ID "${selected.missionId}" が見つかりません`);
        continue;
    }
    for (const req of mission.reqs) {
        allRequirements.push({
            missionId: mission.id,
            missionName: mission.name,
            kind: req.kind, // 'equipment' or 'category' or 'categoryGroup'
            targetId: req.id, // 装備ID or カテゴリID or 要求カテゴリグループID
            count: req.count * selected.count,
        });
    }
}
```

#### 整合性チェック

各要求装備の`id`が対応するマスタに存在するか確認する.

- `kind === 'equipment'`: 装備マスタ（`equipmentMap`）に存在するか
- `kind === 'category'`: カテゴリマスタ（`categoryMap`）に存在するか
- `kind === 'categoryGroup'`: 要求カテゴリグループマスタ（`requirementCategoryGroupMap`）に存在するか
- 存在しない場合: その要求は計算から除外し,該当任務に警告マークを表示する
- `categoryGroup` が保持する `categoryIds` に無効IDが含まれる場合: 無効IDは計算対象外として警告し,有効IDが1件もないグループ要求は除外する

### フェーズ3: 要求種別ごとにグループ化

要求装備を`kind`（`equipment`/`category`/`categoryGroup`）別に分ける.

```typescript
const equipmentReqs = validRequirements.filter(
    (req) => req.kind === REQUIREMENT_KIND.EQUIPMENT,
);
const categoryReqs = validRequirements.filter(
    (req) => req.kind === REQUIREMENT_KIND.CATEGORY,
);
const categoryGroupReqs = validRequirements.filter(
    (req) => req.kind === REQUIREMENT_KIND.CATEGORY_GROUP,
);
```

### フェーズ4: 個別装備要求の集計(MAX集計)

同じ`targetId`を持つ要求を集約し,最大値を採用する.

```typescript
const equipmentCountMap = new Map<string, number>();

for (const req of equipmentReqs) {
    const current = equipmentCountMap.get(req.targetId) ?? 0;
    equipmentCountMap.set(req.targetId, Math.max(current, req.count));
}

// 結果例: Map { "m_eq_gun_12cm" => 3, "m_eq_mg_25mm" => 2 }
```

### フェーズ5: カテゴリ要求の集計(MAX集計)

同じ`targetId`を持つ要求を集約し,最大値を採用する.

```typescript
const categoryCountMap = new Map<string, number>();

for (const req of categoryReqs) {
    const current = categoryCountMap.get(req.targetId) ?? 0;
    categoryCountMap.set(req.targetId, Math.max(current, req.count));
}

// 結果例: Map { "m_cat_gun_s" => 2, "m_cat_mg" => 3 }
```

### フェーズ6: 包含関係の解決(OR条件)

個別装備要求とカテゴリ要求が同じカテゴリに属する場合,個別装備の廃棄数をカテゴリの要求数から差し引く.
さらに,カテゴリグループ要求は同グループ配下カテゴリの個別装備要求とカテゴリ要求を合算して差し引く.

**重要**: 包含は一方向で扱う. つまり,`categoryGroup` 要求は `category`/`equipment` で充足できるが,`category` 要求を `categoryGroup` 要求だけで充足したとはみなさない.

#### OR条件の処理手順

1. 各カテゴリ要求に対して,同じカテゴリに属する個別装備要求の合計数を計算
1. カテゴリ要求数から個別装備合計数を差し引く
1. 差分が0以下の場合,カテゴリ要求は削除(個別装備だけで満たされるため)
1. 差分が正の場合,カテゴリ要求の`count`を差分に更新

```typescript
for (const [categoryId, categoryCount] of categoryCountMap) {
    // 同じカテゴリに属する個別装備要求の合計を計算
    let itemTotalInCategory = 0;
    for (const [eqId, eqCount] of equipmentCountMap) {
        const equipment = equipmentMap.get(eqId);
        if (equipment && equipment.categoryId === categoryId) {
            itemTotalInCategory += eqCount;
        }
    }

    // カテゴリ要求数から個別装備合計を差し引く
    const remaining = categoryCount - itemTotalInCategory;

    if (remaining <= 0) {
        // 個別装備だけで満たされるのでカテゴリ要求は不要
        categoryCountMap.delete(categoryId);
    } else {
        // 残数を更新
        categoryCountMap.set(categoryId, remaining);
    }
}
```

#### 包含関係の例

##### 例1: 個別装備がカテゴリ要求を満たす

- 任務A: 小口径主砲(category) ×3
- 任務B: 12cm単装砲(equipment, categoryId="m_cat_gun_s") ×2
- 任務C: 10cm連装高角砲(equipment, categoryId="m_cat_gun_s") ×2

結果:

- 12cm単装砲: 2個
- 10cm連装高角砲: 2個
- 小口径主砲(category): 0個(削除) ← (3 - 2 - 2 = -1)

##### 例2: カテゴリ要求が残る

- 任務A: 機銃(category) ×5
- 任務B: 25mm単装機銃(equipment, categoryId="m_cat_mg") ×2

結果:

- 25mm単装機銃: 2個
- 機銃(category): 3個 ← (5 - 2 = 3)

##### 例3: 複数の異なる個別装備が同じカテゴリに属する

- 任務A: 機銃(category) ×10
- 任務B: 25mm単装機銃(equipment, categoryId="m_cat_mg") ×3
- 任務C: 25mm三連装機銃(equipment, categoryId="m_cat_mg") ×4

結果:

- 25mm単装機銃: 3個
- 25mm三連装機銃: 4個
- 機銃(category): 3個 ← (10 - 3 - 4 = 3)

解説: カテゴリ要求数から、同じカテゴリに属する全ての個別装備要求の合計を差し引く

### フェーズ7: 廃棄リストの生成

`equipmentCountMap`と`categoryCountMap`を結合し,廃棄リストを生成する.

```typescript
const scrapList: ScrapListItem[] = [];

// 個別装備要求を追加
for (const [eqId, count] of equipmentCountMap) {
    const equipment = equipmentMap.get(eqId);
    if (equipment) {
        const category = categoryMap.get(equipment.categoryId);
        scrapList.push({
            targetKind: REQUIREMENT_KIND.EQUIPMENT,
            targetId: equipment.id,
            name: equipment.name,
            categoryName: category?.name ?? equipment.categoryId,
            count,
        });
    }
}

// カテゴリ要求を追加
for (const [categoryId, count] of categoryCountMap) {
    const category = categoryMap.get(categoryId);
    if (category) {
        scrapList.push({
            targetKind: REQUIREMENT_KIND.CATEGORY,
            targetId: categoryId,
            name: category.name + '（種別不問）',
            categoryName: category.name,
            count,
        });
    }
}

// カテゴリ名でソート
scrapList.sort((a, b) => a.categoryName.localeCompare(b.categoryName, 'ja'));
```

### フェーズ8: 結果の返却

廃棄リストと警告リストを返す.

```typescript
return {
    scrapList: scrapList,
    warnings: warnings, // CalcWarning[]
};
```

## エッジケースの処理

### ケース1: 同一任務内で同じ装備を複数回要求

- **処理方針**:
    - スキーマバリデーション時にエラーとして検出すべき
    - 計算ロジックに到達した場合は,MAX集計により自動的に最大値が採用される

### ケース2: 存在しない装備IDを参照

- **処理方針**:
    - フェーズ2の整合性チェックで除外
    - 該当任務に警告マーク(⚠️)を表示
    - 警告メッセージ: 「装備ID {id} が存在しません」

### ケース3: 選択任務が0件

- **処理方針**:
    - フェーズ1で空の廃棄リストを返す
    - 廃棄リスト表示エリアは「任務を選択してください」と表示

### ケース4: 全てのカテゴリ要求が個別装備で満たされる

- **処理方針**:
    - フェーズ6で`categoryCountMap`から該当エントリを削除
    - 廃棄リストには個別装備のみが表示される

### ケース5: カテゴリ要求のみで個別装備要求がない

- **処理方針**:
    - フェーズ6の差し引き処理で個別装備合計が0となる
    - カテゴリ要求はそのまま廃棄リストに追加される

### ケース6: `categoryGroup` に無効カテゴリIDが含まれる

- **処理方針**:
    - 無効カテゴリIDは警告して計算対象から除外する
    - 有効カテゴリIDが1件以上ある場合は,有効分のみで計算継続する
    - 有効カテゴリIDが0件の場合は,その `categoryGroup` 要求自体を除外する

### ケース7: 逆方向包含（base=`category`, auxiliary=`categoryGroup`）

- **処理方針**:
    - `auxiliary` の `categoryGroup` は `base` の `category` を充足しない
    - 比較結果では `base` 側 `category` は不足のまま, `auxiliary` 側 `categoryGroup` は過剰として表示する

## 計算例

### 例1: 基本的なMAX集計

選択任務:

- 任務A: 12cm単装砲 ×2
- 任務B: 12cm単装砲 ×3

計算結果:

- 12cm単装砲: 3個 ← MAX(2, 3)

### 例2: カテゴリと個別装備の包含関係

選択任務:

- 任務A: 小口径主砲(category) ×3
- 任務B: 12cm単装砲(equipment, categoryId="m_cat_gun_s") ×2

計算過程:

1. 個別装備集計: 12cm単装砲 = 2
1. カテゴリ集計: 小口径主砲 = 3
1. 包含解決: 小口径主砲 = 3 - 2 = 1

計算結果:

- 12cm単装砲: 2個
- 小口径主砲(category): 1個

### 例3: 複数カテゴリと複数個別装備

選択任務:

- 任務A: 機銃(category) ×5
- 任務B: 小口径主砲(category) ×2
- 任務C: 25mm単装機銃(equipment, categoryId="m_cat_mg") ×2
- 任務D: 12cm単装砲(equipment, categoryId="m_cat_gun_s") ×3

計算過程:

1. 個別装備集計:
    - 25mm単装機銃 = 2
    - 12cm単装砲 = 3
1. カテゴリ集計:
    - 機銃 = 5
    - 小口径主砲 = 2
1. 包含解決:
    - 機銃 = 5 - 2 = 3
    - 小口径主砲 = 2 - 3 = -1 → 削除

計算結果:

- 25mm単装機銃: 2個
- 12cm単装砲: 3個
- 機銃(category): 3個

## パフォーマンス考慮事項

### 計算量

- 選択任務数: 最大8件
- 各任務の要求装備数: 平均3〜5件と想定
- 全装備数: 数百件規模と想定

### 時間計算量

- フェーズ2: O(M × R) ← M=任務数, R=要求数/任務
- フェーズ4-5: O(T) ← T=総要求数
- フェーズ6: O(C × I) ← C=カテゴリ要求数, I=個別装備要求数
- 合計: O(M × R + C × I) ≈ O(数十〜数百)

**結論**: 現実的な規模では十分高速であり,最適化は不要.

## 実装上の注意事項

1. **不変性の維持**: 元の任務データを変更せず,計算結果は新しいオブジェクトとして生成する
1. **エラーハンドリング**: 各フェーズで例外が発生した場合,空の廃棄リストと詳細なエラーメッセージを返す
1. **テスタビリティ**: 各フェーズを独立した関数として実装し,ユニットテストを容易にする

テストの実装は `src/domain/__tests__/scrapCalculation.test.ts` を参照.
