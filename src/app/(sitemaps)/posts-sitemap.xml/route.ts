import { getServerSideSitemap, ISitemapField } from 'next-sitemap'
import { getPayload } from 'payload'
import config from '@payload-config'
import { unstable_cache } from 'next/cache'
import { routing } from '@/i18n/routing'

const getPostsSitemap = unstable_cache(
  async () => {
    const payload = await getPayload({ config })
    const SITE_URL =
      process.env.NEXT_PUBLIC_SERVER_URL ||
      process.env.VERCEL_PROJECT_PRODUCTION_URL ||
      'https://example.com'

    const { locales, defaultLocale } = routing
    const dateFallback = new Date().toISOString()

    // Fetch posts for all locales to get proper slugs
    const postsPerLocale = await Promise.all(
      locales.map(async (locale) => {
        const results = await payload.find({
          collection: 'posts',
          overrideAccess: false,
          draft: false,
          depth: 0,
          limit: 1000,
          pagination: false,
          locale,
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
        return { locale, docs: results.docs }
      })
    )

    // Build a map of post IDs to their localized data
    const defaultLocalePosts = postsPerLocale.find((p) => p.locale === defaultLocale)?.docs || []

    const sitemap: ISitemapField[] = defaultLocalePosts
      .filter((post) => Boolean(post?.slug))
      .map((post) => {
        // Build alternates for hreflang
        const alternateRefs: ISitemapField['alternateRefs'] = locales.map((locale) => {
          const localePrefix = locale === defaultLocale ? '' : `/${locale}`
          return {
            href: `${SITE_URL}${localePrefix}/posts/${post.slug}`,
            hreflang: locale,
          }
        })

        // Add x-default pointing to the default locale version
        alternateRefs?.push({
          href: `${SITE_URL}/posts/${post.slug}`,
          hreflang: 'x-default',
        })

        return {
          loc: `${SITE_URL}/posts/${post.slug}`,
          lastmod: post.updatedAt || dateFallback,
          alternateRefs,
        }
      })

    return sitemap
  },
  ['posts-sitemap'],
  {
    tags: ['posts-sitemap'],
  },
)

export async function GET() {
  const sitemap = await getPostsSitemap()

  return getServerSideSitemap(sitemap)
}

