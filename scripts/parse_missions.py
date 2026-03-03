"""工廠任務 HTMLから廃棄任務の生テキストをJSONLに抽出する.

入力: input/factory_missions.html（https://wikiwiki.jp/kancolle/任務/工廠任務 のHTML）
出力: intermediate/missions_raw.jsonl

廃棄条件の解析はAI（Step 3）に委ねるため、このスクリプトは純粋なHTML抽出のみ行う.

HTML構造:
  - h3見出しで周期セクションを区切り（単発, デイリー, ウィークリー, ...）
  - 各セクション内に<div class="h-scrollable"><table>
  - テーブルヘッダーは2行（rowspan使用）: ID, 任務名, 内容, 獲得ボーナス(5列), 開放条件/備考, 実装
  - データ行: カラム0=ID, 1=任務名, 2=内容
  - 内容カラムから「廃棄」を含む任務を抽出
  - イヤーリーテーブルにはcolspan="10"のセパレータ行あり
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

from bs4 import BeautifulSoup, Tag

# --- 定数 ---

INPUT_FILE = Path(__file__).parent / "input" / "factory_missions.html"
INTERMEDIATE_DIR = Path(__file__).parent / "intermediate"

MAX_MISSION_NAME_LENGTH = 50

# カラムインデックス
COL_ID = 0
COL_NAME = 1
COL_CONTENT = 2

# h3見出しテキスト → period値
PERIOD_MAP: dict[str, str] = {
    "単発": "OneTime",
    "デイリー": "Daily",
    "ウィークリー": "Weekly",
    "マンスリー": "Monthly",
    "クォータリー": "Quarterly",
    "イヤーリー": "Yearly",
}


def detect_period(heading: Tag) -> str | None:
    """h3見出しから周期を判定する."""
    text = heading.get_text(strip=True)
    for keyword, period in PERIOD_MAP.items():
        if keyword in text:
            return period
    return None


def _find_next_table(heading: Tag) -> Tag | None:
    """見出し直後のテーブルを探す."""
    sibling = heading.find_next_sibling()
    depth = 0
    while sibling and depth < 10:
        if sibling.name == "table":
            return sibling
        if isinstance(sibling, Tag):
            inner_table = sibling.find("table")
            if inner_table:
                return inner_table
        if sibling.name in ("h2", "h3"):
            break
        sibling = sibling.find_next_sibling()
        depth += 1
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
    print("=== 工廠任務パーサー（生テキスト抽出） ===")
    print()

    if not INPUT_FILE.exists():
        print(f"エラー: 入力ファイルが見つかりません: {INPUT_FILE}")
        print("Wikiページ https://wikiwiki.jp/kancolle/任務/工廠任務 を")
        print("ブラウザで保存し、input/factory_missions.html に配置してください。")
        sys.exit(1)

    print(f"入力: {INPUT_FILE}")
    print()

    html_content = INPUT_FILE.read_text(encoding="utf-8")
    soup = BeautifulSoup(html_content, "lxml")

    missions: list[dict] = []
    warnings: list[str] = []

    # h3見出しでセクションを走査
    headings = soup.find_all("h3")

    for heading in headings:
        period = detect_period(heading)
        if period is None:
            continue

        table = _find_next_table(heading)
        if table is None:
            warnings.append(f"警告: {period}セクションにテーブルが見つかりません")
            continue

        rows = table.find_all("tr")
        for row in rows:
            cells = row.find_all("td")

            # セパレータ行のスキップ（colspan="10"の行）
            if len(cells) == 1:
                colspan = cells[0].get("colspan", "")
                if colspan:
                    continue

            # データ行は最低3カラム必要
            if len(cells) < 3:
                continue

            wiki_id = cells[COL_ID].get_text(strip=True)
            name_cell = cells[COL_NAME]
            content_cell = cells[COL_CONTENT]

            # 任務名
            link = name_cell.find("a")
            name = (
                link.get_text(strip=True)
                if link
                else name_cell.get_text(strip=True)
            )
            if not name:
                continue

            if len(name) > MAX_MISSION_NAME_LENGTH:
                warnings.append(
                    f"警告: 任務名超過: 「{name}」({len(name)}文字)"
                )
                name = name[:MAX_MISSION_NAME_LENGTH]

            # 内容テキスト
            content_text = content_cell.get_text(strip=True)

            # 廃棄任務のみ対象
            if "廃棄" not in content_text and "破棄" not in content_text:
                continue

            missions.append(
                {
                    "wiki_id": wiki_id,
                    "name": name,
                    "period": period,
                    "content": content_text,
                }
            )

    # 警告の表示
    if warnings:
        print("--- 警告 ---")
        for w in warnings:
            print(f"  {w}")
        print()

    # サマリー表示
    print("--- パース結果 ---")
    print(f"  廃棄任務数: {len(missions)}")
    print()

    period_display = {
        "Daily": "デイリー",
        "Weekly": "ウィークリー",
        "Monthly": "マンスリー",
        "Quarterly": "クォータリー",
        "Yearly": "年間",
        "OneTime": "単発",
    }
    print("--- 周期別内訳 ---")
    for period, display in period_display.items():
        count = sum(1 for m in missions if m["period"] == period)
        if count > 0:
            print(f"  {display}: {count}件")
    print()

    # 任務一覧表示
    print("--- 任務一覧 ---")
    for m in missions:
        print(f"  [{m['period']}] {m['wiki_id']}: {m['name']}")
        # 内容テキストの先頭80文字を表示
        preview = m["content"][:80] + ("..." if len(m["content"]) > 80 else "")
        print(f"    {preview}")
    print()

    # JSONL出力
    print("--- 出力 ---")
    write_jsonl(missions, INTERMEDIATE_DIR / "missions_raw.jsonl")
    print()
    print("完了!")


if __name__ == "__main__":
    main()
