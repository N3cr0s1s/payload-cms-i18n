import type { Config } from 'src/payload-types'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { unstable_cache } from 'next/cache'
import { Locale } from '@/types'

type Global = keyof Config['globals']

async function getGlobal(slug: Global, depth = 0, locale: Locale) {
  const payload = await getPayload({ config: configPromise })

  const global = await payload.findGlobal({
    slug,
    depth,
    locale,
  })

  return global
}

/**
 * Returns a unstable_cache function mapped with the cache tag for the slug
 */
export const getCachedGlobal = (slug: Global, depth = 0, locale: Locale) =>
  unstable_cache(
    async () => getGlobal(slug, depth, locale),
    // @ts-expect-error - depth is a number, but want string
    [slug, depth, locale ?? ''],
    {
      tags: [locale ? `global_${slug}_${locale}` : `global_${slug}`],
    },
  )
