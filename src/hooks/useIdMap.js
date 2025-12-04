import { useMemo } from 'react';
import { createIdMap } from '../utils/dataManagement';

/**
 * ID→オブジェクトのMapを作成してメモ化するカスタムフック
 * @param {Array} items - id プロパティを持つオブジェクトの配列
 * @returns {Map} メモ化されたid → オブジェクトのMap
 */
export function useIdMap(items) {
  return useMemo(() => createIdMap(items), [items]);
}
