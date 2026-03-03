"""missions.json の参照IDで中間ファイルをフィルタし、アプリ用マスタデータを生成する.

入力:
  output/missions.json         — Step 3 で生成された任務マスタ
  intermediate/all_categories.jsonl — Step 1 で抽出した全カテゴリ
  intermediate/all_equipments.jsonl — Step 1 で抽出した全装備
出力:
  output/categories.json — 任務が参照するカテゴリのみ抽出
  output/equipments.json — 任務が参照する装備（+ その装備が属するカテゴリ内の全装備）
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

# --- 定数 ---

SCRIPT_DIR = Path(__file__).parent
MISSIONS_FILE = SCRIPT_DIR / "output" / "missions.json"
CATEGORIES_JSONL = SCRIPT_DIR / "intermediate" / "all_categories.jsonl"
EQUIPMENTS_JSONL = SCRIPT_DIR / "intermediate" / "all_equipments.jsonl"
OUTPUT_DIR = SCRIPT_DIR / "output"
SCHEMA_VERSION = "2.0.0"

# カテゴリ order の100番台区切り開始値
CATEGORY_ORDER_BASE = 1
EQUIPMENT_ORDER_STEP = 100

PERIOD_ORDER: dict[str, int] = {
    "Daily": 0,
    "Weekly": 1,
    "Monthly": 2,
    "Quarterly": 3,
    "Yearly": 4,
    "OneTime": 5,
}


def load_jsonl(path: Path) -> list[dict]:
    """JSONLファイルを読み込む."""
    if not path.exists():
        print(f"エラー: {path} が見つかりません")
        sys.exit(1)
    records = []
    with path.open(encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                records.append(json.loads(line))
    return records


def write_json(data: dict, path: Path) -> None:
    """JSONファイルを書き出す."""
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print(f"  出力: {path} ({path.stat().st_size} bytes)")


def mission_wiki_key(mission: dict) -> tuple[str, int, str]:
    """mission.id から Wiki ID相当を抽出し自然順比較キーを返す."""
    mission_id = mission.get("id", "")
    token = mission_id.removeprefix("m_ms_").lower()
    matched = re.match(r"([a-z]+)(\d+)$", token)
    if not matched:
        return (token, 10**9, token)
    prefix, number = matched.groups()
    return (prefix, int(number), token)


def normalize_missions(missions: list[dict]) -> list[dict]:
    """ミッションをperiod別Wiki順でソートし、orderを再採番する."""
    sorted_missions = sorted(
        missions,
        key=lambda mission: (
            PERIOD_ORDER.get(mission.get("period", ""), 99),
            mission_wiki_key(mission),
            mission.get("name", ""),
        ),
    )

    period_counters: dict[str, int] = {}
    normalized: list[dict] = []
    for mission in sorted_missions:
        period = mission.get("period", "")
        current_order = period_counters.get(period, 0)
        period_counters[period] = current_order + 1

        normalized.append(
            {
                "id": mission["id"],
                "name": mission["name"],
                "period": period,
                "order": current_order,
                "reqs": mission.get("reqs", []),
            }
        )

    return normalized


def main() -> None:
    """メインエントリポイント."""
    print("=== マスタデータビルダー ===")
    print()

    # missions.json 読み込み
    if not MISSIONS_FILE.exists():
        print(f"エラー: {MISSIONS_FILE} が見つかりません")
        print("Step 3（AI による任務データ生成）を先に実行してください。")
        sys.exit(1)

    with MISSIONS_FILE.open(encoding="utf-8") as f:
        missions_data = json.load(f)
    missions = normalize_missions(missions_data["missions"])
    print(f"入力: {MISSIONS_FILE} ({len(missions)}件)")

    # 中間ファイル読み込み
    all_categories = load_jsonl(CATEGORIES_JSONL)
    all_equipments = load_jsonl(EQUIPMENTS_JSONL)
    print(f"中間: {CATEGORIES_JSONL} ({len(all_categories)}件)")
    print(f"中間: {EQUIPMENTS_JSONL} ({len(all_equipments)}件)")
    print()

    # missions.json から参照IDを収集
    referenced_cat_ids: set[str] = set()
    referenced_eq_ids: set[str] = set()

    for mission in missions:
        for req in mission.get("reqs", []):
            if req["kind"] == "category":
                referenced_cat_ids.add(req["id"])
            elif req["kind"] == "equipment":
                referenced_eq_ids.add(req["id"])

    print("--- 参照ID ---")
    print(f"  カテゴリ: {len(referenced_cat_ids)}件")
    print(f"  装備: {len(referenced_eq_ids)}件")
    print()

    # 参照される装備が属するカテゴリも必要
    eq_by_id = {e["id"]: e for e in all_equipments}
    for eq_id in referenced_eq_ids:
        if eq_id in eq_by_id:
            referenced_cat_ids.add(eq_by_id[eq_id]["category_id"])

    # カテゴリのフィルタ + order 割り振り（抽出元JSONLの出現順=Wiki順）
    cat_by_id = {c["id"]: c for c in all_categories}
    cat_position = {cat["id"]: index for index, cat in enumerate(all_categories)}
    filtered_categories: list[dict] = []
    missing_cats: list[str] = []

    for cat_id in sorted(referenced_cat_ids, key=lambda value: cat_position.get(value, 10**9)):
        if cat_id not in cat_by_id:
            missing_cats.append(cat_id)
            continue
        filtered_categories.append(cat_by_id[cat_id])

    # カテゴリの order: 出現順に1, 2, 3...
    for i, cat in enumerate(filtered_categories):
        cat["order"] = i + CATEGORY_ORDER_BASE

    # 装備のフィルタ: 任務が明示参照する装備のみ抽出
    all_equipments_by_id = {equipment["id"]: equipment for equipment in all_equipments}
    filtered_equipments: list[dict] = []
    for equipment_id in referenced_eq_ids:
        equipment = all_equipments_by_id.get(equipment_id)
        if equipment:
            filtered_equipments.append(equipment)

    # 装備の order: カテゴリごとに100番台区切り
    cat_order_map = {cat["id"]: cat["order"] for cat in filtered_categories}
    filtered_equipments.sort(
        key=lambda equipment: (
            cat_order_map.get(equipment["category_id"], 0),
            equipment.get("wiki_no", 10**9),
        )
    )

    # order 割り振り: カテゴリ order * 100 + カテゴリ内連番
    cat_counters: dict[str, int] = {}
    for eq in filtered_equipments:
        cat_id = eq["category_id"]
        cat_order = cat_order_map.get(cat_id, 0)
        base = cat_order * EQUIPMENT_ORDER_STEP
        seq = cat_counters.get(cat_id, 0)
        cat_counters[cat_id] = seq + 1
        eq["order"] = base + seq

    # 参照チェック
    missing_eqs: list[str] = []
    for eq_id in referenced_eq_ids:
        if eq_id not in eq_by_id:
            missing_eqs.append(eq_id)

    if missing_cats:
        print("--- 警告: 中間ファイルに存在しないカテゴリID ---")
        for cat_id in missing_cats:
            print(f"  {cat_id}")
        print()

    if missing_eqs:
        print("--- 警告: 中間ファイルに存在しない装備ID ---")
        for eq_id in missing_eqs:
            print(f"  {eq_id}")
        print()

    # サマリー
    print("--- フィルタ結果 ---")
    print(f"  カテゴリ: {len(filtered_categories)}件")
    print(f"  装備: {len(filtered_equipments)}件")
    print()

    print("--- カテゴリ別内訳 ---")
    for cat in filtered_categories:
        count = sum(
            1 for e in filtered_equipments if e["category_id"] == cat["id"]
        )
        print(f"  {cat['name']} (order={cat['order']}): {count}件")
    print()

    # JSON出力
    categories_json = {
        "version": SCHEMA_VERSION,
        "categories": [
            {"id": c["id"], "name": c["name"], "order": c["order"]}
            for c in filtered_categories
        ],
    }

    equipments_json = {
        "version": SCHEMA_VERSION,
        "equipments": [
            {
                "id": e["id"],
                "name": e["name"],
                "categoryId": e["category_id"],
                "order": e["order"],
            }
            for e in filtered_equipments
        ],
    }

    print("--- 出力 ---")
    missions_json = {
        "version": SCHEMA_VERSION,
        "missions": missions,
    }
    write_json(missions_json, OUTPUT_DIR / "missions.json")
    write_json(categories_json, OUTPUT_DIR / "categories.json")
    write_json(equipments_json, OUTPUT_DIR / "equipments.json")
    print()
    print("完了!")


if __name__ == "__main__":
    main()
