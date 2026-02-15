import { getServerSideSitemap, ISitemapField } from 'next-sitemap'
import { getPayload } from 'payload'
import config from '@payload-config'
import { unstable_cache } from 'next/cache'
import { routing } from '@/i18n/routing'

const getPagesSitemap = unstable_cache(
  async () => {
    const payload = await getPayload({ config })
    const SITE_URL =
      process.env.NEXT_PUBLIC_SERVER_URL ||
      process.env.VERCEL_PROJECT_PRODUCTION_URL ||
      'https://example.com'

    const { locales, defaultLocale } = routing
    const dateFallback = new Date().toISOString()

    // Helper to build hreflang alternates for a given path
    const buildAlternateRefs = (path: string): ISitemapField['alternateRefs'] => {
      const alternateRefs: ISitemapField['alternateRefs'] = locales.map((locale) => {
        const localePrefix = locale === defaultLocale ? '' : `/${locale}`
        return {
          href: `${SITE_URL}${localePrefix}${path}`,
          hreflang: locale,
        }
      })

      // Add x-default pointing to the default locale version
      alternateRefs?.push({
        href: `${SITE_URL}${path}`,
        hreflang: 'x-default',
      })

      return alternateRefs
    }

    // Static pages with localized alternates
    const staticSitemap: ISitemapField[] = [
      {
        loc: `${SITE_URL}/search`,
        lastmod: dateFallback,
        alternateRefs: buildAlternateRefs('/search'),
      },
      {
        loc: `${SITE_URL}/posts`,
        lastmod: dateFallback,
        alternateRefs: buildAlternateRefs('/posts'),
      },
    ]

    // Fetch pages for the default locale
    const results = await payload.find({
      collection: 'pages',
      overrideAccess: false,
      draft: false,
      depth: 0,
      limit: 1000,
      pagination: false,
      locale: defaultLocale,
      where: {
        _status: {
          equals: 'published',
        },
      },
      select: {
        slug: true,
        updatedAt: true,
      },
    })

    const pagesSitemap: ISitemapField[] = results.docs
      ? results.docs
          .filter((page) => Boolean(page?.slug))
          .map((page) => {
            const isHome = page.slug === 'home'
            const path = isHome ? '/' : `/${page.slug}`

            return {
              loc: `${SITE_URL}${isHome ? '/' : `/${page.slug}`}`,
              lastmod: page.updatedAt || dateFallback,
              alternateRefs: buildAlternateRefs(path),
            }
          })
      : []

    return [...staticSitemap, ...pagesSitemap]
  },
  ['pages-sitemap'],
  {
    tags: ['pages-sitemap'],
  },
)

export async function GET() {
  const sitemap = await getPagesSitemap()

  return getServerSideSitemap(sitemap)
}

