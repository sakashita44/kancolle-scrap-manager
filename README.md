# 艦これ 工廠任務廃棄マネージャー (Kancolle Scrap Manager)

## 概要

* 艦これで複数の廃棄任務を並列で遂行する際に，廃棄すべき装備の必要最小限リスト(最適解)を算出し，無駄な廃棄を防ぐことを目的としたWebアプリケーション

## 技術スタック

* Frontend: React, Tailwind CSS, Lucide React
* Hosting: 静的ホスティング
* Master Data: GitHub Pages にホストされる JSON マスタ
* Data Storage: Browser `LocalStorage`

（詳細は `docs/design.md` を参照）

## 必要環境

* Node.js: 開発時に必要
* ブラウザ: 本アプリは `crypto.randomUUID()` を利用するため，HTTPS 環境または `localhost` での実行を前提とする．

## データとドキュメント

* マスタデータ，ロジック，UI仕様などの詳細は `docs/` 配下を参照

## ライセンス

* ライセンス: MIT
