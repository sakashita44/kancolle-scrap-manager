/**
 * @file cn.js
 * @description Tailwindクラス名の条件付き結合ユーティリティ
 *
 * clsxで条件付きクラス名を結合し、tailwind-mergeで競合を解決する
 *
 * @example
 * cn('p-2 rounded border', isError && 'bg-red-50', isDisabled && 'opacity-50')
 * // → 'p-2 rounded border bg-red-50' (isError=true, isDisabled=false の場合)
 *
 * cn('p-2', 'p-4') // → 'p-4' (後のクラスが優先される)
 */
import clsx from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * 条件付きクラス名を結合し、Tailwindクラスの競合を解決する
 * @param {...(string | boolean | null | undefined | Record<string, boolean>)} inputs - クラス名または条件
 * @returns {string} 結合されたクラス名
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
