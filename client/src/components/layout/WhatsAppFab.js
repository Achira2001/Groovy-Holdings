'use client';

import { MessageCircle } from 'lucide-react';
import { whatsappLink } from '@/lib/utils';

export default function WhatsAppFab() {
  return (
    <a
      href={whatsappLink('Hi Groovy Holdings! I would like to know more about your printing services.')}
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-[#1FAF5A] py-3 pl-3.5 pr-4 text-sm font-bold text-white shadow-pop transition hover:bg-[#199a4e]"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle className="h-5 w-5" />
      <span className="hidden sm:inline">WhatsApp us</span>
    </a>
  );
}
