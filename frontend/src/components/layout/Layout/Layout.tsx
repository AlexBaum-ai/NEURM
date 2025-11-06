import * as React from 'react';
import { Outlet } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import MobileNav from '../MobileNav/MobileNav';
import SkipLinks from '@/components/common/SkipLinks/SkipLinks';

interface LayoutProps {
  children?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <>
      <Helmet>
        <html lang="en" />
      </Helmet>

      <SkipLinks />

      <div className="flex min-h-screen flex-col">
        <Header />
        <MobileNav />

        <main
          id="main-content"
          className="flex-1"
          role="main"
          aria-label="Main content"
        >
          {children || <Outlet />}
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Layout;
