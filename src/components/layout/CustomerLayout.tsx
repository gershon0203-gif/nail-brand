import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { DemoBanner } from '@/components/common/DemoBanner';

export function CustomerLayout() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [pathname]);
  return (
    <div className="flex min-h-screen flex-col bg-cream-50">
      <DemoBanner />
      <Header />
      <main className="flex-1 animate-fade-in">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
