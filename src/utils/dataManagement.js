/**
 * データ管理に関する共通ユーティリティ関数
 */

/**
 * 配列内の最大order値+1を取得する
 * @param {Array} items - order値を持つオブジェクトの配列
 * @returns {number} 次に使用するorder値（配列が空の場合は0）
 */
export function getNextOrder(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return 0;
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

/**
 * マスタデータとユーザーデータをマージしてソートする
 * @param {Array} masterData - マスタデータ配列
 * @param {Array} userData - ユーザーデータ配列
 * @param {Function} sortCompareFn - ソート比較関数
 * @returns {Array} ソート済みのマージされた配列
 */
export function mergeAndSort(masterData, userData, sortCompareFn) {
  const merged = [...masterData, ...userData];
  return merged.sort(sortCompareFn);
}

/**
 * デフォルトのソート比較関数を作成（isMaster優先 → order昇順）
 * @returns {Function} ソート比較関数
 */
export function createDefaultSortComparator() {
  return (a, b) => {
    // 公式優先（isMasterがtrueなら先頭）
    if (a.isMaster !== b.isMaster) {
      return b.isMaster ? 1 : -1;
    }
    // 同じグループ内ではorder順
    return a.order - b.order;
  };
}

/**
 * 任務用のソート比較関数を作成（period順 → isMaster優先 → order昇順）
 * @param {Array} periodOrder - 周期の優先順位配列（PERIOD_ORDER）
 * @returns {Function} ソート比較関数
 */
export function createMissionSortComparator(periodOrder) {
  return (a, b) => {
    // 周期順（PERIOD_ORDERに基づく）
    const periodIndexA = periodOrder.indexOf(a.period);
    const periodIndexB = periodOrder.indexOf(b.period);
    if (periodIndexA !== periodIndexB) {
      return periodIndexA - periodIndexB;
    }

    // 同じ周期内では公式優先（isMasterがtrueなら先頭）
    if (a.isMaster !== b.isMaster) {
      return b.isMaster ? 1 : -1;
    }

    // 同じグループ内ではorder順
    return a.order - b.order;
  };
}
