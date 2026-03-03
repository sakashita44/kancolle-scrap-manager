# マスタデータ生成スクリプト

艦これWikiのHTMLページからマスタデータJSON（カテゴリ・装備・任務）を生成するPythonスクリプト群。

4ステップのパイプラインで処理する:

1. **parse_equipments.py**（機械的）: 全カテゴリ・全装備をJSONLに抽出（種別列 + レジストリ）
1. **parse_missions.py**（機械的）: 廃棄任務の生テキストをJSONLに抽出
1. **Claude Code**（AI, 手動実行）: 生テキストから廃棄条件を判断し missions.json を生成
1. **build_masters.py**（機械的）: missions.json の順序を正規化し、参照IDで最終JSONを生成

## 前提条件

- Python 3.12+
- [uv](https://docs.astral.sh/uv/) (パッケージマネージャ)

## セットアップ

```bash
cd scripts
uv sync
```

## HTMLファイルの準備

以下のWikiページをブラウザで保存し、`input/` ディレクトリに配置する。

### 装備一覧

1. <https://wikiwiki.jp/kancolle/装備一覧(種類別)> をブラウザで開く
1. `Ctrl+S`（ページを保存）→ 「Webページ、完全」または「Webページ、HTMLのみ」で保存
1. 保存したHTMLファイルを `input/equipment_list.html` にリネーム・移動

### 工廠任務

1. <https://wikiwiki.jp/kancolle/任務/工廠任務> をブラウザで開く
1. `Ctrl+S`（ページを保存）→ 「Webページ、完全」または「Webページ、HTMLのみ」で保存
1. 保存したHTMLファイルを `input/factory_missions.html` にリネーム・移動

## Step 1: 装備一覧の抽出

```bash
cd scripts
uv run python -X utf8 parse_equipments.py
```

出力:

- `intermediate/all_categories.jsonl` — 実際に使用されたカテゴリのみ
- `intermediate/all_equipments.jsonl` — 全装備（`id` + `encyclopedia_no`）

`parse_equipments.py` は `config/category_registry.json` を参照してカテゴリを判定する.
種別列に未登録ラベルが1件でもある場合は失敗し, `intermediate/` の出力を更新しない.

## Step 2: 工廠任務の抽出

```bash
uv run python -X utf8 parse_missions.py
```

出力:

- `intermediate/missions_raw.jsonl` — 廃棄任務の生テキスト

## Step 3: AIによる廃棄条件解析

Claude Code で `missions_raw.jsonl` を読み、各任務の廃棄条件を判断して `output/missions.json` を生成する。

### プロンプトテンプレート

以下のプロンプトをClaude Codeに貼り付けて実行する:

````text
scripts/intermediate/missions_raw.jsonl を読み、各任務の廃棄条件を解析して
scripts/output/missions.json を生成してください。

## ルール

1. 各任務の `content` から**廃棄すべき装備/カテゴリとその数量**を判断する
2. 以下は廃棄対象ではない（reqsに含めない）:
   - 秘書艦条件（「○○を秘書艦にして」等）
   - 準備アイテム（「○○を用意し」で廃棄ではなく保持するもの）
   - 廃棄回数のみの任務（種類不問で「装備をN回廃棄」等）
3. 装備名・カテゴリ名が確定したら grep で中間ファイルからID取得:
   - `grep "装備名" scripts/intermediate/all_equipments.jsonl`
   - `grep "カテゴリ名" scripts/intermediate/all_categories.jsonl`
    - `reqs[].id` は grep でヒットしたIDをそのまま使う（推測で作らない）
    - `reqs` に記載した各IDは、対応する中間ファイルに実在することを再確認する
4. Wikiの略称に注意（艦戦→艦上戦闘機、艦爆→艦上爆撃機、艦攻→艦上攻撃機、水偵→水上偵察機、艦偵→艦上偵察機、対空機銃→対空機銃 等）
5. 生成後に `uv run python -X utf8 scripts/build_masters.py` を実行し、参照IDエラーが出ないことを確認する

## 出力フォーマット

```json
{
  "version": "2.0.0",
  "missions": [
    {
      "id": "m_ms_<wiki_id小文字>",
      "name": "任務名",
      "period": "Daily|Weekly|Monthly|Quarterly|Yearly|OneTime",
      "order": 0,
      "reqs": [
        { "kind": "equipment", "id": "m_eq_123", "count": 3 },
        { "kind": "category", "id": "m_cat_small_caliber_main_gun", "count": 5 }
      ]
    }
  ]
}
```

- `id`: `m_ms_<wiki_id小文字>` （例: wiki_id "F4" → "m_ms_f4"）
- `order`: 同一 period 内で 0 から採番
- `reqs[].kind`: `"equipment"`（個別装備）または `"category"`（カテゴリ指定）
- `reqs[].id`: 中間ファイルから grep で取得したID
````

### 手動確認のポイント

- 機種転換任務: 廃棄する装備と秘書艦に搭載する装備を区別する
- 略称: Wiki本文の略称（艦戦、艦爆等）を正式カテゴリ名に対応付ける
- 回数任務: 「装備を○回廃棄」は種類不問なのでスキップ

## Step 4: マスタデータビルド

```bash
uv run python -X utf8 build_masters.py
```

出力:

- `output/missions.json` — periodごとにWiki ID順で`order`を再採番した任務データ
- `output/categories.json` — 任務が参照するカテゴリのみ
- `output/equipments.json` — 任務が明示参照する装備のみ

## 出力ファイルの適用

生成されたJSONを `src/data/` にコピーしてアプリに反映する。

```bash
# プロジェクトルートから実行
cp scripts/output/categories.json src/data/categories.json
cp scripts/output/equipments.json src/data/equipments.json
cp scripts/output/missions.json src/data/missions.json
```

適用後の確認:

```bash
npm run build   # ビルドエラーがないこと
npm test        # テストがパスすること
npm run dev     # アプリを起動してデータ表示を確認
```

## ディレクトリ構成

```text
scripts/
├── README.md              # このファイル
├── pyproject.toml         # uv プロジェクト定義
├── .python-version        # Python バージョン指定
├── input/                 # HTML入力ファイル配置場所（.gitignore対象）
│   └── .gitkeep
├── intermediate/          # 抽出JSONL（git管理 — Wiki更新時の差分追跡用）
│   └── .gitkeep
├── output/                # アプリ用最終JSON（.gitignore対象）
│   └── .gitkeep
├── parse_equipments.py    # Step 1: 装備一覧パーサー
├── parse_missions.py      # Step 2: 工廠任務パーサー
└── build_masters.py       # Step 4: マスタデータビルダー
```

## ID体系

| データ種別 | IDフォーマット         | 例                    | ソース                    |
| :--------- | :--------------------- | :-------------------- | :------------------------ |
| カテゴリ   | `m_cat_<slug>`         | `m_cat_landing_craft` | category_registry の slug |
| 装備       | `m_eq_<図鑑No.>`       | `m_eq_174`            | 図鑑No.（安定・一意）     |
| 任務       | `m_ms_<wiki_id小文字>` | `m_ms_f4`             | Wiki任務ID                |

## トラブルシューティング

### パースエラー・警告が出る場合

スクリプトは実行時に警告を表示する。

- **「テーブルが見つかりません」**: Wikiのページ構造が変わった可能性がある。HTMLの構造を確認し、スクリプトのパースロジックを調整する
- **「図鑑No.なし」**: 装備行から図鑑番号を取得できなかった。HTML構造を確認する
- **「未登録の種別ラベル」**: `config/category_registry.json` にラベルを追加して再実行する

### Wikiページの構造が変わった場合

wikiwiki.jpのHTML構造は予告なく変更される可能性がある。パーサーが正常に動作しない場合は、以下を確認:

1. ブラウザの開発者ツール（F12）でHTML構造を確認
1. 見出しタグ（h2/h3）やテーブルのclass名を確認
1. スクリプトの該当箇所を修正
