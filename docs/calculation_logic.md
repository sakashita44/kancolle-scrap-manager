# 計算ロジック仕様

## 概要

本文書では,選択された任務から廃棄すべき装備の最小リストを算出するアルゴリズムを定義する.

## 計算の目的

複数の工廠任務(廃棄任務)を並列遂行する際,各任務の要求装備を単純に合計すると,重複分を無駄に廃棄してしまう.本システムは以下のルールに基づき,**必要最小限の廃棄数**を算出する.

### ゲーム内の廃棄任務の特性

1. **AND条件**: 一つの任務内の複数の要求装備は全て満たす必要がある
2. **並列達成**: 複数の任務を同時選択している場合,一度の廃棄操作で条件を共有できる
3. **MAX集計**: 同じ装備を要求する複数の任務がある場合,最大値が必要数となる(合計ではない)
4. **OR条件(包含関係)**: カテゴリ指定とItem指定が混在する場合,Itemはカテゴリに包含される

## 入力データ

### 選択任務リスト

ユーザーがチェックした任務のIDリスト(最大8件).

```javascript
const selectedMissionIds = [
  "m_ms_daily_scrap_1",
  "m_ms_weekly_scrap_1"
];
```

### マスタデータ

* 装備マスタ: 全装備の情報(`equipments.json` + ユーザー定義装備)
* 任務マスタ: 全任務の情報(`missions.json` + ユーザー定義任務)

## 出力データ

廃棄すべき装備のリスト.

```javascript
const scrapList = [
  {
    equipmentId: "m_eq_gun_12cm",
    equipmentName: "12cm単装砲",
    category: "小口径主砲",
    count: 3,
    type: "Item"
  },
  {
    equipmentId: "m_eq_cat_machine_gun",
    equipmentName: "機銃",
    category: "機銃",
    count: 2,
    type: "Category"
  }
];
```

## アルゴリズム

### フェーズ1: 事前チェック

1. 選択任務が0件の場合,空の廃棄リストを返して終了
2. 選択任務が8件を超える場合,エラーを返して終了(UI側で制御するため通常は発生しない)

### フェーズ2: 要求装備の展開

選択された各任務の要求装備リスト(`reqs`)を全て抽出する.

```javascript
// 疑似コード
const allRequirements = [];
for (const missionId of selectedMissionIds) {
  const mission = findMissionById(missionId);
  if (!mission) {
    console.warn(`任務ID ${missionId} が見つかりません`);
    continue;
  }
  for (const req of mission.reqs) {
    allRequirements.push({
      missionId: mission.id,
      missionName: mission.name,
      targetId: req.targetId,
      count: req.count
    });
  }
}
```

#### 整合性チェック

各要求装備の`targetId`が装備マスタに存在するか確認する.

* 存在しない場合: その要求は計算から除外し,該当任務に警告マークを表示する

```javascript
const validRequirements = allRequirements.filter(req => {
  const equipment = findEquipmentById(req.targetId);
  if (!equipment) {
    addWarning(req.missionId, `装備ID ${req.targetId} が存在しません`);
    return false;
  }
  return true;
});
```

### フェーズ3: 装備種別ごとにグループ化

要求装備を`type`(Item/Category)別に分ける.

```javascript
const itemRequirements = validRequirements.filter(req => {
  const equipment = findEquipmentById(req.targetId);
  return equipment.type === "Item";
});

const categoryRequirements = validRequirements.filter(req => {
  const equipment = findEquipmentById(req.targetId);
  return equipment.type === "Category";
});
```

### フェーズ4: Item要求の集計(MAX集計)

同じ`targetId`を持つ要求を集約し,最大値を採用する.

```javascript
const itemCountMap = new Map();

for (const req of itemRequirements) {
  const currentMax = itemCountMap.get(req.targetId) || 0;
  itemCountMap.set(req.targetId, Math.max(currentMax, req.count));
}

// 結果例: Map { "m_eq_gun_12cm" => 3, "m_eq_machine_gun_25mm" => 2 }
```

### フェーズ5: Category要求の集計(MAX集計)

同じ`targetId`を持つ要求を集約し,最大値を採用する.

```javascript
const categoryCountMap = new Map();

for (const req of categoryRequirements) {
  const currentMax = categoryCountMap.get(req.targetId) || 0;
  categoryCountMap.set(req.targetId, Math.max(currentMax, req.count));
}

// 結果例: Map { "m_eq_cat_main_gun_s" => 2, "m_eq_cat_machine_gun" => 3 }
```

### フェーズ6: 包含関係の解決(OR条件)

Itemとカテゴリが同じ場合,Itemの廃棄数をカテゴリの要求数から差し引く.

#### OR条件の処理手順

1. 各カテゴリ要求に対して,同じ`category`を持つItem要求の合計数を計算
2. カテゴリ要求数からItem合計数を差し引く
3. 差分が0以下の場合,カテゴリ要求は削除(Itemだけで満たされるため)
4. 差分が正の場合,カテゴリ要求の`count`を差分に更新

```javascript
for (const [categoryTargetId, categoryCount] of categoryCountMap) {
  const categoryEquipment = findEquipmentById(categoryTargetId);
  const categoryName = categoryEquipment.category;

  // 同じカテゴリのItem要求の合計を計算
  let itemTotalInCategory = 0;
  for (const [itemTargetId, itemCount] of itemCountMap) {
    const itemEquipment = findEquipmentById(itemTargetId);
    if (itemEquipment.category === categoryName) {
      itemTotalInCategory += itemCount;
    }
  }

  // カテゴリ要求数からItem合計を差し引く
  const remaining = categoryCount - itemTotalInCategory;

  if (remaining <= 0) {
    // Itemだけで満たされるのでカテゴリ要求は不要
    categoryCountMap.delete(categoryTargetId);
  } else {
    // 残数を更新
    categoryCountMap.set(categoryTargetId, remaining);
  }
}
```

#### 包含関係の例

##### 例1: Itemがカテゴリ要求を満たす

* 任務A: 小口径主砲(Category) ×3
* 任務B: 12cm単装砲(Item, category="小口径主砲") ×2
* 任務C: 10cm連装高角砲(Item, category="小口径主砲") ×2

結果:

* 12cm単装砲: 2個
* 10cm連装高角砲: 2個
* 小口径主砲(Category): 0個(削除) ← (3 - 2 - 2 = -1)

##### 例2: カテゴリ要求が残る

* 任務A: 機銃(Category) ×5
* 任務B: 25mm単装機銃(Item, category="機銃") ×2

結果:

* 25mm単装機銃: 2個
* 機銃(Category): 3個 ← (5 - 2 = 3)

##### 例3: 複数の異なるItemが同じカテゴリに属する

* 任務A: 機銃(Category) ×10
* 任務B: 25mm単装機銃(Item, category="機銃") ×3
* 任務C: 25mm三連装機銃(Item, category="機銃") ×4

結果:

* 25mm単装機銃: 3個
* 25mm三連装機銃: 4個
* 機銃(Category): 3個 ← (10 - 3 - 4 = 3)

解説: カテゴリ要求数から、同じカテゴリに属する全てのItem要求の合計を差し引く

### フェーズ7: 廃棄リストの生成

`itemCountMap`と`categoryCountMap`を結合し,廃棄リストを生成する.

```javascript
const scrapList = [];

// Item要求を追加
for (const [equipmentId, count] of itemCountMap) {
  const equipment = findEquipmentById(equipmentId);
  scrapList.push({
    equipmentId: equipment.id,
    equipmentName: equipment.name,
    category: equipment.category,
    count: count,
    type: equipment.type
  });
}

// Category要求を追加
for (const [equipmentId, count] of categoryCountMap) {
  const equipment = findEquipmentById(equipmentId);
  scrapList.push({
    equipmentId: equipment.id,
    equipmentName: equipment.name,
    category: equipment.category,
    count: count,
    type: equipment.type
  });
}

// カテゴリ名でソート(オプション: UI表示順序の最適化)
scrapList.sort((a, b) => a.category.localeCompare(b.category));
```

### フェーズ8: 結果の返却

廃棄リストと警告リストを返す.

```javascript
return {
  scrapList: scrapList,
  warnings: warnings // { missionId: string, message: string }[]
};
```

## エッジケースの処理

### ケース1: 同一任務内で同じ装備を複数回要求

**データ例** (不正なデータ)

```json
{
  "id": "m_ms_test",
  "name": "テスト任務",
  "reqs": [
    { "id": "req_1", "targetId": "m_eq_gun_12cm", "count": 2 },
    { "id": "req_2", "targetId": "m_eq_gun_12cm", "count": 3 }
  ]
}
```

* **処理方針**:
    * スキーマバリデーション時にエラーとして検出すべき
    * 計算ロジックに到達した場合は,MAX集計により自動的に最大値(3)が採用される

### ケース2: 存在しない装備IDを参照

* **処理方針**:
    * フェーズ2の整合性チェックで除外
    * 該当任務に警告マーク(⚠️)を表示
    * 警告メッセージ: 「装備ID {targetId} が存在しません. この要求は計算から除外されました」

### ケース3: 選択任務が0件

* **処理方針**:
    * フェーズ1で空の廃棄リストを返す
    * 廃棄リスト表示エリアは「任務を選択してください」と表示

### ケース4: 全てのカテゴリ要求がItemで満たされる

* **処理方針**:
    * フェーズ6で`categoryCountMap`から該当エントリを削除
    * 廃棄リストにはItemのみが表示される

### ケース5: カテゴリ要求のみでItem要求がない

* **処理方針**:
    * フェーズ6の差し引き処理でItem合計が0となる
    * カテゴリ要求はそのまま廃棄リストに追加される

## 計算例

### 例1: 基本的なMAX集計

選択任務:

* 任務A: 12cm単装砲 ×2
* 任務B: 12cm単装砲 ×3

計算結果:

* 12cm単装砲: 3個 ← MAX(2, 3)

### 例2: カテゴリとItemの包含関係

選択任務:

* 任務A: 小口径主砲(Category) ×3
* 任務B: 12cm単装砲(Item, category="小口径主砲") ×2

計算過程:

1. Item集計: 12cm単装砲 = 2
2. Category集計: 小口径主砲 = 3
3. 包含解決: 小口径主砲 = 3 - 2 = 1

計算結果:

* 12cm単装砲: 2個
* 小口径主砲(Category): 1個

### 例3: 複数カテゴリと複数Item

選択任務:

* 任務A: 機銃(Category) ×5
* 任務B: 小口径主砲(Category) ×2
* 任務C: 25mm単装機銃(Item, category="機銃") ×2
* 任務D: 12cm単装砲(Item, category="小口径主砲") ×3

計算過程:

1. Item集計:
    * 25mm単装機銃 = 2
    * 12cm単装砲 = 3
2. Category集計:
    * 機銃 = 5
    * 小口径主砲 = 2
3. 包含解決:
    * 機銃 = 5 - 2 = 3
    * 小口径主砲 = 2 - 3 = -1 → 削除

計算結果:

* 25mm単装機銃: 2個
* 12cm単装砲: 3個
* 機銃(Category): 3個

## パフォーマンス考慮事項

### 計算量

* 選択任務数: 最大8件
* 各任務の要求装備数: 平均3〜5件と想定
* 全装備数: 数百件規模と想定

### 時間計算量

* フェーズ2: O(M × R) ← M=任務数, R=要求数/任務
* フェーズ4-5: O(T) ← T=総要求数
* フェーズ6: O(C × I) ← C=カテゴリ要求数, I=Item要求数
* 合計: O(M × R + C × I) ≈ O(数十〜数百)

**結論**: 現実的な規模では十分高速であり,最適化は不要.

### メモリ使用量

* `Map`オブジェクトを使用し,重複を排除
* 廃棄リストは最大でも全装備数を超えない

**結論**: メモリ使用量は問題にならない.

## 実装上の注意事項

1. **不変性の維持**: 元の任務データを変更せず,計算結果は新しいオブジェクトとして生成する
2. **エラーハンドリング**: 各フェーズで例外が発生した場合,空の廃棄リストと詳細なエラーメッセージを返す
3. **ロギング**: 開発モードでは各フェーズの中間結果をコンソールに出力し,デバッグを容易にする
4. **テスタビリティ**: 各フェーズを独立した関数として実装し,ユニットテストを容易にする

## テストケース

実装時には以下のテストケースを用意する.

1. 選択任務0件
2. 選択任務1件
3. 選択任務8件(上限)
4. 同じ装備を要求する複数任務(MAX集計)
5. カテゴリとItemの包含関係(差し引き)
6. カテゴリ要求のみ
7. Item要求のみ
8. 存在しない装備IDを参照
9. 同一任務内の重複要求(エラー検出)
10. 複数カテゴリと複数Itemの複雑な組み合わせ
