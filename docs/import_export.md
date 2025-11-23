# インポート/エクスポート仕様

## 概要

ユーザー定義データ(装備・任務)をJSON形式でエクスポート/インポートする機能の詳細仕様を定義する.

## エクスポート

### ファイル名生成

* 装備: `kancolle_scrap_equipments_YYYYMMDD.json`
* 任務: `kancolle_scrap_missions_YYYYMMDD.json`
* 日付フォーマット: **JST(日本標準時)基準**、`YYYYMMDD`形式
* 例: `kancolle_scrap_equipments_20251123.json`

### 実装例

```javascript
/**
 * エクスポートファイル名を生成
 * @param {string} type - データタイプ ('equipments' | 'missions')
 * @returns {string} ファイル名
 */
function generateExportFilename(type) {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;
  return `kancolle_scrap_${type}_${dateStr}.json`;
}
```

### エクスポート処理フロー

1. LocalStorageからユーザー定義データを取得
2. JSON文字列化
3. `Blob`オブジェクト作成
4. `<a download>`でダウンロード

```javascript
function exportData(type, data) {
  const filename = generateExportFilename(type);
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
}
```

## インポート

### インポート処理フロー

1. **ファイル選択**
   * `<input type="file" accept=".json">`でファイル選択
   * 単一ファイルのみ受付

2. **JSON読込**
   * `FileReader`でファイル内容を読込
   * `JSON.parse()`でパース

3. **JSON構文チェック**
   * パース失敗時: エラーモーダル表示、インポート中断
   * エラーメッセージ: `docs/error_handling.md:122-129`参照

4. **ファイル判別**
   * `equipments`配列が存在 → 装備データ
   * `missions`配列が存在 → 任務データ
   * 両方とも存在しない → エラー、インポート中断

5. **スキーマバリデーション**
   * `src/utils/validation.js`の`validateEquipment` / `validateMission`を使用
   * バリデーション失敗時: 詳細エラーモーダル表示、インポート中断
   * エラーメッセージ: `docs/error_handling.md:132-139`参照

6. **上書き確認ダイアログ表示**
   * インポート対象の概要を表示(件数等)
   * 「既存データは上書きされます」の警告表示
   * UI仕様: `docs/ui_specification.md:723-750`参照

7. **LocalStorageに保存**
   * ユーザーが[インポート]ボタンをクリック
   * `src/utils/localStorage.js`の`saveUserEquipments` / `saveUserMissions`を使用
   * 保存成功時: 成功通知表示

8. **UI更新**
   * カスタムフック(`useEquipments` / `useMissions`)が自動的にデータを再読込
   * 画面に反映

### エラーハンドリング

詳細は`docs/error_handling.md`セクション4を参照.

| エラー種別 | レベル | 挙動 |
|:---|:---|:---|
| JSON構文エラー | Error | インポート中断、エラーモーダル表示 |
| スキーマ不一致 | Error | インポート中断、詳細エラーモーダル表示 |
| バージョン不一致 | Error | インポート中断、アップデート促すメッセージ表示 |
| ファイル判別失敗 | Error | インポート中断、エラーモーダル表示 |
| LocalStorage容量オーバー | Error | 保存失敗、容量不足エラー表示 |

### バリデーション項目

インポート時に以下をチェック:

1. JSON構文チェック
2. 必須フィールドチェック
3. 型チェック
4. ID形式チェック
5. ID空チェック(プレフィックス後が空でないこと)
6. 文字数制限チェック
7. 数値範囲チェック
8. 配列長チェック
9. 参照整合性チェック(警告レベル、インポートは継続)
10. 重複チェック(警告レベル)

詳細: `docs/schema.md:279-297`

## データ形式

インポート/エクスポートデータの形式は`docs/schema.md`セクション4を参照.

### 装備データ

```json
{
  "version": "1.0.0",
  "equipments": [
    {
      "id": "u_eq_123e4567-e89b-12d3-a456-426614174000",
      "name": "カスタム砲",
      "category": "主砲",
      "type": "Item"
    }
  ]
}
```

### 任務データ

```json
{
  "version": "1.0.0",
  "missions": [
    {
      "id": "u_ms_123e4567-e89b-12d3-a456-426614174001",
      "name": "カスタム任務",
      "period": "Weekly",
      "reqs": [
        {
          "id": "req_1",
          "targetId": "m_eq_gun_12cm",
          "count": 3
        }
      ]
    }
  ]
}
```

## 実装上の注意事項

1. **既存データの完全上書き**
   * インポート時は該当タイプの既存ユーザー定義データを全て上書き
   * 部分的なマージは行わない

2. **公式マスタデータへの影響なし**
   * インポートはユーザー定義データのみが対象
   * 公式マスタデータ(`m_eq_*`, `m_ms_*`)は変更されない

3. **バージョン管理**
   * 現在のバージョン: `1.0.0`
   * 将来的にスキーマ変更が発生した場合、バージョンチェック機能を実装
   * 現状はスキーマバリデーションで十分

4. **セキュリティ**
   * インポートファイルは信頼できるソースからのみ受け付けることをユーザーに推奨
   * XSS対策: インポートデータは全てバリデーション後にDOM出力

5. **エクスポート/インポートの分離**
   * 装備と任務は別々にエクスポート/インポート可能
   * 両方を含む統合ファイル形式は現状サポートしない

## 参考資料

* [UI仕様書 - エクスポート/インポートメニュー](./ui_specification.md#設定メニュー)
* [UI仕様書 - インポート確認ダイアログ](./ui_specification.md#インポート確認ダイアログ)
* [データスキーマ仕様](./schema.md)
* [エラーハンドリング仕様](./error_handling.md)
