import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const clientRoot = join(__dirname, '..')
const distRoot = join(clientRoot, 'dist')
const indexPath = join(distRoot, 'index.html')
const seoDataPath = join(clientRoot, 'src', 'lib', 'seo-pages.json')
const baseHtml = readFileSync(indexPath, 'utf8')
const seoData = JSON.parse(readFileSync(seoDataPath, 'utf8'))

const escapeHtml = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')

const setTag = (html, pattern, replacement) => html.replace(pattern, replacement)

const buildSchemas = (page) => [
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Duhoc Mate',
    url: `${seoData.siteUrl}/`,
    inLanguage: 'vi-VN',
  },
  {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Duhoc Mate',
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Web',
    url: `${seoData.siteUrl}/`,
    image: seoData.defaultImage,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'VND',
    },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Duhoc Mate',
        item: `${seoData.siteUrl}/`,
      },
      ...(page.path === '/' ? [] : [{
        '@type': 'ListItem',
        position: 2,
        name: page.heading,
        item: `${seoData.siteUrl}${page.path}`,
      }]),
    ],
  },
]

const buildNoscript = (page) => {
  const links = seoData.pages
    .filter(item => item.path !== page.path)
    .map(item => `<li><a href="${item.path}">${escapeHtml(item.heading)}</a></li>`)
    .join('')

  return `<noscript>
      <main>
        <p>${escapeHtml(page.eyebrow)}</p>
        <h1>${escapeHtml(page.heading)}</h1>
        <p>${escapeHtml(page.summary)}</p>
        <nav aria-label="Trang quan trọng"><ul>${links}</ul></nav>
      </main>
    </noscript>
    <div id="root"></div>`
}

const renderPageHtml = (page) => {
  const canonical = `${seoData.siteUrl}${page.path === '/' ? '/' : page.path}`
  const keywords = page.keywords.join(', ')
  const schemas = JSON.stringify(buildSchemas(page))

  let html = baseHtml
  html = setTag(html, /<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(page.title)}</title>`)
  html = setTag(html, /<meta name="title" content="[^"]*" \/>/, `<meta name="title" content="${escapeHtml(page.title)}" />`)
  html = setTag(html, /<meta\s+name="description"\s+content="[\s\S]*?"\s*\/>/, `<meta name="description" content="${escapeHtml(page.description)}" />`)
  html = setTag(html, /<meta name="keywords" content="[^"]*" \/>/, `<meta name="keywords" content="${escapeHtml(keywords)}" />`)
  html = setTag(html, /<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${canonical}" />`)
  html = setTag(html, /<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${canonical}" />`)
  html = setTag(html, /<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${escapeHtml(page.title)}" />`)
  html = setTag(html, /<meta\s+property="og:description"\s+content="[\s\S]*?"\s*\/>/, `<meta property="og:description" content="${escapeHtml(page.description)}" />`)
  html = setTag(html, /<meta property="og:image" content="[^"]*" \/>/, `<meta property="og:image" content="${seoData.defaultImage}" />`)
  html = setTag(html, /<meta name="twitter:url" content="[^"]*" \/>/, `<meta name="twitter:url" content="${canonical}" />`)
  html = setTag(html, /<meta name="twitter:title" content="[^"]*" \/>/, `<meta name="twitter:title" content="${escapeHtml(page.title)}" />`)
  html = setTag(html, /<meta\s+name="twitter:description"\s+content="[\s\S]*?"\s*\/>/, `<meta name="twitter:description" content="${escapeHtml(page.description)}" />`)
  html = setTag(html, /<meta name="twitter:image" content="[^"]*" \/>/, `<meta name="twitter:image" content="${seoData.defaultImage}" />`)
  html = setTag(
    html,
    /<script type="application\/ld\+json">[\s\S]*?<\/script>\s*<script type="application\/ld\+json">[\s\S]*?<\/script>/,
    `<script id="duhocmate-runtime-schema" type="application/ld+json">${schemas}</script>`,
  )
  html = setTag(html, /<div id="root"><\/div>/, buildNoscript(page))

  return html
}

for (const page of seoData.pages) {
  const html = renderPageHtml(page)
  const outPath = page.path === '/'
    ? indexPath
    : join(distRoot, page.path.slice(1), 'index.html')

  mkdirSync(dirname(outPath), { recursive: true })
  writeFileSync(outPath, html)
}

console.log(`Generated SEO HTML for ${seoData.pages.length} public pages.`)
