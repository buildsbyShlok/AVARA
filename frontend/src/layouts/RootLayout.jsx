import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Navbar from '../components/navigation/Navbar';
import Footer from '../components/navigation/Footer';

export default function RootLayout() {
  const location = useLocation();
  const isAuthPage = ['/login', '/signup'].includes(location.pathname);

  return (
    <div className={`min-h-screen flex flex-col bg-sand-50 text-obsidian selection:bg-avara-100 selection:text-avara-900 overflow-x-hidden ${isAuthPage ? 'h-screen overflow-hidden' : ''}`}>
      <Navbar />
      <main className={`flex-1 flex flex-col ${isAuthPage ? 'min-h-0 overflow-y-auto lg:overflow-hidden' : ''}`}>
        <AnimatePresence mode="wait">
          <Outlet key={location.pathname} />
        </AnimatePresence>
      </main>
      {!isAuthPage && <Footer />}
    </div>
  );
}
