import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import WhatsAppFab from '@/components/layout/WhatsAppFab';

export default function SiteLayout({ children }) {
  return (
    <>
      <Navbar />
      <main className="min-h-[calc(100vh-72px)]">{children}</main>
      <Footer />
      <WhatsAppFab />
    </>
  );
}
