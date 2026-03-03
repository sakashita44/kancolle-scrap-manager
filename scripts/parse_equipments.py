"""装備一覧(種類別) HTMLから全カテゴリ・全装備をJSONLに抽出する.

入力: input/equipment_list.html（https://wikiwiki.jp/kancolle/装備一覧(種類別) のHTML）
出力:
  intermediate/all_categories.jsonl — 全カテゴリ（Wikiアンカーベース ID）
  intermediate/all_equipments.jsonl — 全装備（図鑑No.ベース ID）

HTML構造:
  - 1つの巨大テーブルに全カテゴリ・全装備が格納されている
  - カテゴリはヘッダー行（全セルが<th>）で区切られる
  - ヘッダー行の3列目(index 2)にカテゴリ名、<a name="XXX">アンカーあり
  - データ行（全セルが<td>）: 1列目=図鑑No., 3列目(index 2)=装備名
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

from bs4 import BeautifulSoup, Tag

# --- 定数 ---

INPUT_FILE = Path(__file__).parent / "input" / "equipment_list.html"
INTERMEDIATE_DIR = Path(__file__).parent / "intermediate"

# 装備名カラムのインデックス（0始まり）
EQUIP_NAME_COL = 2
# 図鑑No.カラムのインデックス（0始まり）
WIKI_NO_COL = 0

# Wikiアンカー名 → カテゴリ表示名・ID slug のマッピング
# id は m_cat_<anchor小文字> で生成する
CATEGORY_ANCHORS: dict[str, str] = {
    "SMain": "小口径主砲",
    "MMain": "中口径主砲",
    "LMain": "大口径主砲",
    "Secondary": "副砲",
    "Torpedo": "魚雷",
    "Craft": "特殊潜航艇",
    "Fighter": "艦上戦闘機",
    "SeaplaneFighter": "水上戦闘機",
    "Bomber": "艦上爆撃機",
    "SeaplaneBomber": "水上爆撃機",
    "Attacker": "艦上攻撃機",
    "Reconnaissance": "艦上偵察機",
    "SeaplaneRecon": "水上偵察機",
    "Patrol": "哨戒機",
    "Radar": "電探",
    "Engine": "機関部強化",
    "Shell": "対艦強化弾",
    "Machinegun": "対空機銃",
    "AntiAircraft": "高角砲",
    "DepthCharge": "爆雷",
    "Sonar": "ソナー",
    "DamageControl": "応急修理要員",
    "Bulge": "増設バルジ",
    "uncertain": "その他",
    "LandAttacker": "陸上攻撃機",
    "Heavybomber": "大型陸上機",
    "LandRecon": "陸上偵察機",
    "Interceptor": "局地戦闘機",
    "ArmyFighter": "陸軍戦闘機",
    "LandingCraft": "上陸用舟艇",
}


def _anchor_to_id(anchor: str) -> str:
    """Wikiアンカー名からカテゴリIDを生成する."""
    return f"m_cat_{anchor.lower()}"


def _is_header_row(row: Tag) -> bool:
    """行がヘッダー行かどうか.

    Wikiのテーブルでは、カテゴリヘッダー行はほぼ全セルがthだが
    最後のセル（「追加」ボタン）がtdの場合がある.
    thセルの割合が過半数であればヘッダー行と判定する.
    """
    cells = row.find_all(["th", "td"])
    if not cells:
        return False
    th_count = sum(1 for c in cells if c.name == "th")
    return th_count > len(cells) // 2


def _get_anchor_name(row: Tag) -> str | None:
    """行内のアンカー名を取得する（カテゴリヘッダー判定用）."""
    anchor = row.find("a", attrs={"name": True})
    if anchor:
        name = anchor.get("name", "")
        if name in CATEGORY_ANCHORS:
            return name
    return None


def _get_category_display_name(row: Tag) -> str | None:
    """ヘッダー行からカテゴリ表示名を取得する（3列目）."""
    cells = row.find_all(["th", "td"])
    if len(cells) <= EQUIP_NAME_COL:
        return None
    cell = cells[EQUIP_NAME_COL]
    text = cell.get_text(strip=True)
    return text if text else None


def _get_wiki_no(row: Tag) -> int | None:
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

    categories: list[dict] = []
    equipments: list[dict] = []
    warnings: list[str] = []
    seen_cat_ids: set[str] = set()
    seen_wiki_nos: set[int] = set()

    current_anchor: str | None = None
    current_cat_id: str | None = None

    for row in rows:
        anchor_name = _get_anchor_name(row)
        if anchor_name and _is_header_row(row):
            current_anchor = anchor_name
            current_cat_id = _anchor_to_id(anchor_name)

            if current_cat_id not in seen_cat_ids:
                seen_cat_ids.add(current_cat_id)
                display_name = CATEGORY_ANCHORS[anchor_name]
                categories.append(
                    {
                        "id": current_cat_id,
                        "name": display_name,
                        "anchor": anchor_name,
                    }
                )
            continue

        # カテゴリ未確定ならスキップ
        if current_cat_id is None:
            continue

        # ヘッダー行はスキップ
        if _is_header_row(row):
            continue

        name = _get_equipment_name(row)
        if not name:
            continue

        wiki_no = _get_wiki_no(row)
        if wiki_no is None:
            warnings.append(f"警告: 図鑑No.なし: 「{name}」（{current_cat_id}）→ スキップ")
            continue

        if wiki_no in seen_wiki_nos:
            # 同じ図鑑No.の重複（別カテゴリに同じ装備が載っている場合等）
            continue
        seen_wiki_nos.add(wiki_no)

        eq_id = f"m_eq_{wiki_no}"
        equipments.append(
            {
                "id": eq_id,
                "name": name,
                "category_id": current_cat_id,
                "wiki_no": wiki_no,
            }
        )

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
