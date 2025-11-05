import * as React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import MobileNav from '../MobileNav/MobileNav';

interface LayoutProps {
  children?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <MobileNav />

      <main className="flex-1">
        {children || <Outlet />}
      </main>

      <Footer />
    </div>
  );
};

export default Layout;
