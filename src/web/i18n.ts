/**
 * 国际化（i18n）配置
 *
 * 使用 @i18n-pro/react 作为 i18n 框架。
 * - namespace: 命名空间，避免多应用时翻译键冲突
 * - langs: 异步加载语言包（英文通过动态 import 按需加载，中文为默认语言无需额外加载）
 */
import type { I18nState } from '@i18n-pro/react'

const i18nState: I18nState = {
  namespace: 'appstore-discounts',
  langs: {
    en: () => import('./i18n/en.json').then((res) => res.default),
  },
}

export default i18nState
