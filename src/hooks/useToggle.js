import { useState, useCallback } from 'react'

/**
 * boolean状態の管理を簡素化するカスタムフック
 * モーダルの開閉など、ON/OFFを切り替える処理を共通化
 *
 * @param {boolean} initialValue - 初期値（デフォルト: false）
 * @returns {[boolean, Object]} - [現在の状態, アクション関数群]
 */
export function useToggle(initialValue = false) {
  const [value, setValue] = useState(initialValue)

  const toggle = useCallback(() => setValue((v) => !v), [])
  const setTrue = useCallback(() => setValue(true), [])
  const setFalse = useCallback(() => setValue(false), [])

  return [
    value,
    {
      toggle,
      setTrue,
      setFalse,
      setValue,
    },
  ]
}
