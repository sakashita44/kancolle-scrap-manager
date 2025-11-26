/**
 * データ管理に関する共通ユーティリティ関数
 */

/**
 * 配列内の最大order値+1を取得する
 * @param {Array} items - order値を持つオブジェクトの配列
 * @returns {number} 次に使用するorder値（配列が空の場合は1）
 */
export function getNextOrder(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return 1;
  }
  const maxOrder = Math.max(...items.map(item => item.order || 0));
  return maxOrder + 1;
}

/**
 * IDで検索する関数を生成する高階関数
 * @param {Array} items - 検索対象の配列
 * @returns {Function} IDで検索する関数
 */
export function createFindById(items) {
  return (id) => {
    if (!Array.isArray(items)) {
      return null;
    }
    return items.find((item) => item.id === id) || null;
  };
}
