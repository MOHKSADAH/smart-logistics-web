'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Languages } from 'lucide-react';

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
    <Button variant="ghost" size="sm" onClick={switchLocale}>
      <Languages className="h-4 w-4 me-2" />
      {currentLocale === 'en' ? 'العربية' : 'English'}
    </Button>
  );
}
