import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['en', 'hu'],
  defaultLocale: 'hu',
  localePrefix: "as-needed"
})
