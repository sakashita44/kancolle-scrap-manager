"""艦これWikiのHTMLページを input/ にダウンロードする（パイプラインのStep 0）。

parse_equipments.py / parse_missions.py が参照する入力HTMLを取得する。
手動でブラウザ保存する代わりにこのスクリプトを実行してもよい。
"""

import os
import urllib.request

# (出力ファイル名, WikiページURL)
PAGES = [
    (
        "equipment_list.html",
        "https://wikiwiki.jp/kancolle/%E8%A3%85%E5%82%99%E4%B8%80%E8%A6%A7(%E7%A8%AE%E9%A1%9E%E5%88%A5)",
    ),
    (
        "factory_missions.html",
        "https://wikiwiki.jp/kancolle/%E4%BB%BB%E5%8B%99/%E5%B7%A5%E5%BB%A0%E4%BB%BB%E5%8B%99",
    ),
]

USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"


def main() -> None:
    os.makedirs("input", exist_ok=True)
    for filename, url in PAGES:
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        html = urllib.request.urlopen(req).read()
        path = os.path.join("input", filename)
        with open(path, "wb") as f:
            f.write(html)
        print(f"saved: {path} ({len(html)} bytes)")


if __name__ == "__main__":
    main()
