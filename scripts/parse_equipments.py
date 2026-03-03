"""装備一覧(種類別) HTMLから全カテゴリ・全装備をJSONLに抽出する.

入力: input/equipment_list.html
出力:
    intermediate/all_categories.jsonl — 使用カテゴリのみ
    intermediate/all_equipments.jsonl — 全装備（図鑑No.ベース ID）

分類ルール:
    - 種別列を主キーにする（アンカーは使わない）
    - カテゴリ定義は config/category_registry.json のみを参照する
    - 未登録ラベルが1件でもあれば失敗し、中間出力は更新しない
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

from bs4 import BeautifulSoup, Tag

# --- 定数 ---

INPUT_FILE = Path(__file__).parent / "input" / "equipment_list.html"
INTERMEDIATE_DIR = Path(__file__).parent / "intermediate"
REGISTRY_FILE = Path(__file__).parent / "config" / "category_registry.json"

# 装備名カラムのインデックス（0始まり）
EQUIP_NAME_COL = 2
# 図鑑No.カラムのインデックス（0始まり）
WIKI_NO_COL = 0

def make_category_id(slug: str) -> str:
    """slugからカテゴリIDを生成する."""
    return f"m_cat_{slug}"


def load_registry(path: Path) -> tuple[dict[str, dict], list[dict]]:
    """カテゴリレジストリを読み込み、検証済みマップを返す."""
    if not path.exists():
        print(f"エラー: レジストリが見つかりません: {path}")
        sys.exit(1)

    with path.open(encoding="utf-8") as file:
        data = json.load(file)

    categories = data.get("categories")
    if not isinstance(categories, list):
        print("エラー: category_registry.json の categories は配列である必要があります")
        sys.exit(1)

    label_map: dict[str, dict] = {}
    seen_slugs: set[str] = set()
    seen_orders: set[int] = set()

    for item in categories:
        label = item.get("label")
        slug = item.get("slug")
        order = item.get("order")
        name = item.get("name", label)

        if not isinstance(label, str):
            print(f"エラー: label が文字列ではありません: {item}")
            sys.exit(1)
        if not isinstance(slug, str):
            print(f"エラー: slug が文字列ではありません: {item}")
            sys.exit(1)
        if not isinstance(order, int):
            print(f"エラー: order が整数ではありません: {item}")
            sys.exit(1)
        if slug in seen_slugs:
            print(f"エラー: slug 重複: {slug}")
            sys.exit(1)
        if order in seen_orders:
            print(f"エラー: order 重複: {order}")
            sys.exit(1)
        if label in label_map:
            print(f"エラー: label 重複: {label!r}")
            sys.exit(1)

        seen_slugs.add(slug)
        seen_orders.add(order)
        label_map[label] = {
            "label": label,
            "slug": slug,
            "name": name,
            "order": order,
            "id": make_category_id(slug),
        }

    sorted_categories = sorted(label_map.values(), key=lambda category: category["order"])
    return label_map, sorted_categories


def _get_encyclopedia_no(row: Tag) -> int | None:
    """データ行から図鑑No.を取得する."""
    cells = row.find_all("td")
    if len(cells) <= WIKI_NO_COL:
        return None
    text = cells[WIKI_NO_COL].get_text(strip=True)
    if text.isdigit():
        return int(text)
    return None


def _get_equipment_name(row: Tag) -> str | None:
    """データ行から装備名を抽出する（index 2のセル）."""
    cells = row.find_all("td")
    if len(cells) <= EQUIP_NAME_COL:
        return None

    cell = cells[EQUIP_NAME_COL]
    # リンクテキストを優先
    link = cell.find("a")
    if link:
        text = link.get_text(strip=True)
        if text and len(text) >= 2:
            return text
    # リンクがなければセル全体のテキスト
    text = cell.get_text(strip=True)
    if text and len(text) >= 2 and not text.isdigit():
        return text
    return None


def _get_type_label(row: Tag) -> str | None:
    """データ行の種別列テキストを取得する."""
    cells = row.find_all("td")
    type_col = EQUIP_NAME_COL + 1
    if len(cells) <= type_col:
        return None

    return " ".join(cells[type_col].get_text(" ", strip=True).split())


def write_jsonl(records: list[dict], path: Path) -> None:
    """JSONLファイルを書き出す."""
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        for record in records:
            f.write(json.dumps(record, ensure_ascii=False) + "\n")
    print(f"  出力: {path} ({len(records)}件)")


def main() -> None:
    """メインエントリポイント."""
    print("=== 装備一覧パーサー（全装備抽出） ===")
    print()

    if not INPUT_FILE.exists():
        print(f"エラー: 入力ファイルが見つかりません: {INPUT_FILE}")
        print("Wikiページ https://wikiwiki.jp/kancolle/装備一覧(種類別) を")
        print("ブラウザで保存し、input/equipment_list.html に配置してください。")
        sys.exit(1)

    print(f"入力: {INPUT_FILE}")
    print()

    html_content = INPUT_FILE.read_text(encoding="utf-8")
    soup = BeautifulSoup(html_content, "lxml")

    table = soup.find("table")
    if table is None:
        print("エラー: テーブルが見つかりません")
        sys.exit(1)

    rows = table.find_all("tr")
    print(f"  テーブル行数: {len(rows)}")

    category_by_id: dict[str, dict] = {}
    equipments: list[dict] = []
    warnings: list[str] = []
    seen_encyclopedia_nos: set[int] = set()
    unknown_labels: set[str] = set()

    category_registry, sorted_registry_categories = load_registry(REGISTRY_FILE)

    for row in rows:
        cells = row.find_all("td")
        if len(cells) <= EQUIP_NAME_COL + 1:
            continue

        name = _get_equipment_name(row)
        if not name:
            continue

        encyclopedia_no = _get_encyclopedia_no(row)
        if encyclopedia_no is None:
            warnings.append(f"警告: 図鑑No.なし: 「{name}」→ スキップ")
            continue

        type_label = _get_type_label(row)
        category = category_registry.get(type_label)
        if category is None:
            unknown_labels.add(type_label)
            continue

        if encyclopedia_no in seen_encyclopedia_nos:
            # 同じ図鑑No.の重複（別カテゴリに同じ装備が載っている場合等）
            continue
        seen_encyclopedia_nos.add(encyclopedia_no)

        category_by_id[category["id"]] = category

        eq_id = f"m_eq_{encyclopedia_no}"
        equipments.append(
            {
                "id": eq_id,
                "name": name,
                "category_id": category["id"],
                "encyclopedia_no": encyclopedia_no,
            }
        )

    if unknown_labels:
        print("エラー: category_registry.json に未登録の種別ラベルを検出")
        for label in sorted(unknown_labels):
            print(f"  - {label!r}")
        print("中間出力を更新せず終了します")
        sys.exit(1)

    categories = [
        {
            "id": category["id"],
            "name": category["name"],
            "label": category["label"],
            "order": category["order"],
        }
        for category in sorted_registry_categories
        if category["id"] in category_by_id
    ]

    # 警告の表示
    if warnings:
        print()
        print("--- 警告 ---")
        for w in warnings:
            print(f"  {w}")

    # サマリー表示
    print()
    print("--- パース結果 ---")
    print(f"  カテゴリ数: {len(categories)}")
    print(f"  装備数: {len(equipments)}")
    print()

    # カテゴリ別の内訳表示
    print("--- カテゴリ別内訳 ---")
    for cat in categories:
        count = sum(1 for e in equipments if e["category_id"] == cat["id"])
        print(f"  {cat['name']} ({cat['id']}): {count}件")
    print()

    # JSONL出力
    print("--- 出力 ---")
    write_jsonl(categories, INTERMEDIATE_DIR / "all_categories.jsonl")
    write_jsonl(equipments, INTERMEDIATE_DIR / "all_equipments.jsonl")
    print()
    print("完了!")


if __name__ == "__main__":
    main()
