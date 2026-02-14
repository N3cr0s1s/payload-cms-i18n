import type { Config } from 'src/payload-types'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { unstable_cache } from 'next/cache'
import { Locale } from '@/types'

type Collection = keyof Config['collections']

async function getDocument(collection: Collection, slug: string, depth = 0, locale: Locale) {
  const payload = await getPayload({ config: configPromise })

  const page = await payload.find({
    locale,
    collection,
    depth,
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  return page.docs[0]
}

/**
 * Returns a unstable_cache function mapped with the cache tag for the slug
 */
export const getCachedDocument = (collection: Collection, slug: string, depth = 0, locale: Locale) =>
  unstable_cache(
    async () => getDocument(collection, slug, depth, locale),
    // @ts-expect-error - depth is a number, but want string
    [collection, slug, depth, locale],
    {
      tags: [`${collection}_${slug}`],
    },
  )
