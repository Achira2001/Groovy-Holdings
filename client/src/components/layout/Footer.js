import Link from 'next/link';
import { Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import Logo from '@/components/ui/Logo';
import { WHATSAPP_DISPLAY, whatsappLink } from '@/lib/utils';

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-line bg-surface">
      <div className="container grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
            Custom T-shirts, caps, embroidery, mugs and branded merchandise – printed in Sri Lanka for teams, events and businesses.
          </p>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-bold">Shop</h4>
          <ul className="space-y-2 text-sm text-muted">
            <li><Link className="hover:text-ink" href="/products">All products</Link></li>
            <li><Link className="hover:text-ink" href="/products?category=t-shirts">T-shirts</Link></li>
            <li><Link className="hover:text-ink" href="/products?category=caps">Caps</Link></li>
            <li><Link className="hover:text-ink" href="/products?category=mugs">Mugs</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-bold">Company</h4>
          <ul className="space-y-2 text-sm text-muted">
            <li><Link className="hover:text-ink" href="/about">About us</Link></li>
            <li><Link className="hover:text-ink" href="/meetings">Book a meeting</Link></li>
            <li><Link className="hover:text-ink" href="/contact">Contact</Link></li>
            <li><Link className="hover:text-ink" href="/login">Customer sign in</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-bold">Talk to us</h4>
          <ul className="space-y-2.5 text-sm text-muted">
            <li>
              <a className="flex items-center gap-2 hover:text-ink" href={whatsappLink('Hi Groovy Holdings!')} target="_blank" rel="noreferrer">
                <MessageCircle className="h-4 w-4 text-success" /> WhatsApp {WHATSAPP_DISPLAY}
              </a>
            </li>
            <li className="flex items-center gap-2"><Phone className="h-4 w-4" /> {WHATSAPP_DISPLAY}</li>
            <li className="flex items-center gap-2"><Mail className="h-4 w-4" /> hello@groovyholdings.lk</li>
            <li className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Sri Lanka</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="container flex flex-col gap-2 py-5 text-xs text-muted sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} Groovy Holdings (Pvt) Ltd. All rights reserved.</p>
          <p>Printed with care, stitched to last.</p>
        </div>
      </div>
    </footer>
  );
}
