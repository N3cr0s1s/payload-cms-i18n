import { Locale } from '@/types'
import { getLocale as nextIntlGetLocale } from 'next-intl/server'

export const getLocale = async (): Promise<Locale> => {
  const loc = await nextIntlGetLocale();
  return loc as Locale;
}
