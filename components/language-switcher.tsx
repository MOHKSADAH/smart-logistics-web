'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';

export function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = useLocale();

  const switchLocale = () => {
    const newLocale = currentLocale === 'en' ? 'ar' : 'en';
    const newPathname = pathname.replace(`/${currentLocale}`, `/${newLocale}`);
    router.push(newPathname);
  };

  return (
    <Button variant="outline" size="sm" onClick={switchLocale} className="font-medium">
      {currentLocale === 'en' ? 'العربية' : 'English'}
    </Button>
  );
}
