import { describe, expect, it } from 'vitest'
import {
  buildBreadcrumbSchema,
  getCanonicalUrl,
  getSeoPage,
  normalizeSeoPath,
  seoPages,
} from './seo'

describe('seo page metadata', () => {
  it('defines public pages that can become Google sitelinks', () => {
    expect(seoPages.map(page => page.path)).toEqual([
      '/',
      '/topik',
      '/phong-hoc-online',
      '/flashcard',
      '/cong-dong',
      '/pricing',
    ])
  })

  it('provides concise title and description for every public page', () => {
    for (const page of seoPages) {
      expect(page.title.length).toBeGreaterThan(20)
      expect(page.title.length).toBeLessThanOrEqual(75)
      expect(page.description.length).toBeGreaterThan(70)
      expect(page.description.length).toBeLessThanOrEqual(180)
      expect(page.heading).not.toEqual('')
      expect(page.summary).not.toEqual('')
    }
  })

  it('normalizes paths and returns canonical URLs', () => {
    expect(normalizeSeoPath('/topik/')).toBe('/topik')
    expect(getSeoPage('/topik/').heading).toBe('Luyện thi TOPIK online')
    expect(getCanonicalUrl('/topik/')).toBe('https://www.duhocmate.com/topik')
    expect(getCanonicalUrl('/unknown')).toBe('https://www.duhocmate.com/')
  })

  it('builds breadcrumb structured data for nested SEO pages', () => {
    const schema = buildBreadcrumbSchema('/flashcard')
    expect(schema.itemListElement).toHaveLength(2)
    expect(schema.itemListElement[1]).toMatchObject({
      name: 'Flashcard tiếng Hàn',
      item: 'https://www.duhocmate.com/flashcard',
    })
  })
})
