import seoPagesData from './seo-pages.json'

export type SeoPage = {
  path: string
  title: string
  description: string
  heading: string
  eyebrow: string
  summary: string
  keywords: string[]
}

export type SeoConfig = {
  siteUrl: string
  defaultImage: string
  pages: SeoPage[]
}

export const seoConfig = seoPagesData as SeoConfig

export const seoPages = seoConfig.pages

export function normalizeSeoPath(pathname: string) {
  if (!pathname || pathname === '/') return '/'
  const clean = pathname.split('?')[0].split('#')[0].replace(/\/+$/, '')
  return clean || '/'
}

export function getSeoPage(pathname: string) {
  const path = normalizeSeoPath(pathname)
  return seoPages.find(page => page.path === path) || seoPages[0]
}

export function getCanonicalUrl(pathname: string) {
  const page = getSeoPage(pathname)
  return `${seoConfig.siteUrl}${page.path === '/' ? '/' : page.path}`
}

export function buildWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Duhoc Mate',
    url: `${seoConfig.siteUrl}/`,
    inLanguage: 'vi-VN',
  }
}

export function buildSoftwareApplicationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Duhoc Mate',
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Web',
    url: `${seoConfig.siteUrl}/`,
    image: seoConfig.defaultImage,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'VND',
    },
  }
}

export function buildBreadcrumbSchema(pathname: string) {
  const page = getSeoPage(pathname)
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Duhoc Mate',
        item: `${seoConfig.siteUrl}/`,
      },
      ...(page.path === '/'
        ? []
        : [{
            '@type': 'ListItem',
            position: 2,
            name: page.heading,
            item: getCanonicalUrl(page.path),
          }]),
    ],
  }
}
