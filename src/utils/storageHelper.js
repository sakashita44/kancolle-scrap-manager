/**
 * Web Storage API（localStorage/sessionStorage）の共通操作ヘルパー
 */

/**
 * Storageヘルパー関数を作成するファクトリ関数
 * @param {Storage} storage - localStorage または sessionStorage
 * @param {string} storageName - エラーメッセージ用のストレージ名（'LocalStorage' or 'SessionStorage'）
 * @returns {Object} getItem, setItem, removeItem, clear関数を持つオブジェクト
 */
export function createStorageHelper(storage, storageName) {
  /**
   * JSON形式でデータを取得する
   * @param {string} key - キー名
   * @returns {any|null} パース済みデータ、存在しない場合はnull
   */
  function getItem(key) {
    try {
      const item = storage.getItem(key);
      if (!item) {
        return null;
      }
      return JSON.parse(item);
    } catch (error) {
      console.error(`[${storageName}] Failed to parse ${key}:`, error);
      return null;
    }
  }

  /**
   * JSON形式でデータを保存する
   * @param {string} key - キー名
   * @param {any} value - 保存する値（JSON.stringifyで変換される）
   * @throws {Error} QuotaExceededError または保存失敗時
   */
  function setItem(key, value) {
    try {
      const jsonString = JSON.stringify(value);
      storage.setItem(key, jsonString);
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        throw new Error(
          `${storageName}の容量が不足しています. 不要なデータを削除するか, ブラウザのキャッシュをクリアしてください.`
        );
      }
      throw new Error(`${storageName}への保存に失敗しました: ${error.message}`);
    }
  }

  /**
   * 指定したキーのデータを削除する
   * @param {string} key - 削除するキー名
   */
  function removeItem(key) {
    try {
      storage.removeItem(key);
    } catch (error) {
      console.error(`[${storageName}] Failed to remove ${key}:`, error);
    }
  }

  /**
   * すべてのデータを削除する
   */
  function clear() {
    try {
      storage.clear();
    } catch (error) {
      console.error(`[${storageName}] Failed to clear:`, error);
    }
  }

  return {
    getItem,
    setItem,
    removeItem,
    clear,
  };
}
