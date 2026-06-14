/**
 * SEO Meta 标签管理组件
 *
 * 通过 useEffect 动态设置页面的 <title>、<meta> 和 <link> 标签，
 * 用于搜索引擎优化（SEO）和社交分享（Open Graph / Twitter Cards）。
 *
 * 设置的标签包括：
 *   - description、keywords（搜索引擎摘要）
 *   - og:title、og:description、og:image、og:type（社交分享预览）
 *   - twitter:card、twitter:title 等（Twitter 卡片）
 *   - canonical URL（规范链接，避免重复内容问题）
 *   - hreflang（多语言 SEO，告知搜索引擎中文/英文版本的对应关系）
 *
 * 注：这是纯客户端渲染组件（返回 null），不产生可见 DOM。
 * 首屏 SSR 时需要在 index.html 中预设基础 meta 标签。
 */
import { useEffect } from 'react'

/** SEOHead 组件的属性接口 */
interface SEOHeadProps {
  /** 页面标题 */
  title?: string
  description?: string
  keywords?: string
  ogImage?: string
  ogType?: string
  canonicalUrl?: string
}

export default function SEOHead({
  title = 'App Store Discounts',
  description = '追踪 App Store 最新折扣信息，发现应用和内购项目的限时优惠。免费开源工具。',
  keywords = 'App Store, 折扣, 优惠, 限免, appstore-discounts',
  ogImage,
  ogType = 'website',
  canonicalUrl,
}: SEOHeadProps) {
  useEffect(() => {
    document.title = title

    const setMeta = (name: string, content: string, property = false) => {
      const selector = property
        ? `meta[property="${name}"]`
        : `meta[name="${name}"]`
      let el = document.querySelector(selector) as HTMLMetaElement
      if (!el) {
        el = document.createElement('meta')
        if (property) {
          el.setAttribute('property', name)
        } else {
          el.setAttribute('name', name)
        }
        document.head.appendChild(el)
      }
      el.setAttribute('content', content)
    }

    setMeta('description', description)
    setMeta('keywords', keywords)
    setMeta('og:title', title, true)
    setMeta('og:description', description, true)
    setMeta('og:type', ogType, true)
    setMeta('og:url', window.location.href, true)
    setMeta('og:site_name', 'App Store Discounts', true)
    setMeta('og:locale', 'zh_CN', true)
    setMeta('twitter:card', 'summary_large_image')
    setMeta('twitter:title', title)
    setMeta('twitter:description', description)

    if (ogImage) {
      setMeta('og:image', ogImage, true)
      setMeta('twitter:image', ogImage)
    } else {
      const defaultOgImage = `${window.location.origin}/og-default.png`
      setMeta('og:image', defaultOgImage, true)
      setMeta('twitter:image', defaultOgImage)
    }

    if (canonicalUrl) {
      let link = document.querySelector(
        'link[rel="canonical"]',
      ) as HTMLLinkElement
      if (!link) {
        link = document.createElement('link')
        link.setAttribute('rel', 'canonical')
        document.head.appendChild(link)
      }
      link.setAttribute('href', canonicalUrl)
    }

    // hreflang tags for i18n
    const baseUrl = window.location.origin
    const path = window.location.pathname
    let zhLink = document.querySelector(
      'link[hreflang="zh-CN"]',
    ) as HTMLLinkElement
    let enLink = document.querySelector(
      'link[hreflang="en"]',
    ) as HTMLLinkElement
    if (!zhLink) {
      zhLink = document.createElement('link')
      zhLink.setAttribute('hreflang', 'zh-CN')
      document.head.appendChild(zhLink)
    }
    if (!enLink) {
      enLink = document.createElement('link')
      enLink.setAttribute('hreflang', 'en')
      document.head.appendChild(enLink)
    }
    zhLink.setAttribute('href', `${baseUrl}${path}?lang=zh-CN`)
    enLink.setAttribute('href', `${baseUrl}${path}?lang=en`)
  }, [title, description, keywords, ogImage, ogType, canonicalUrl])

  return null
}
