import Link from 'next/link';
import { CalendarDays, Clock, Mail, MessageCircle, MessageSquare } from 'lucide-react';
import { whatsappLink, WHATSAPP_DISPLAY } from '@/lib/utils';

export const metadata = { title: 'Contact' };

export default function ContactPage() {
  const cards = [
    {
      icon: MessageCircle,
      title: 'WhatsApp',
      text: `${WHATSAPP_DISPLAY} — fastest for quotes and design requests.`,
      action: <a href={whatsappLink('Hi Groovy Holdings! I have a question.')} target="_blank" rel="noreferrer" className="btn mt-5 bg-[#1FAF5A] text-white hover:bg-[#199a4e]">Open WhatsApp</a>,
    },
    {
      icon: MessageSquare,
      title: 'Live chat',
      text: 'Sign in and chat with our team. Share design files; replies also arrive by email.',
      action: <Link href="/chat" className="btn-brand mt-5">Open chat</Link>,
    },
    {
      icon: CalendarDays,
      title: 'Video meeting',
      text: 'Book a free 30-minute Google Meet call to plan your order.',
      action: <Link href="/meetings" className="btn-primary mt-5">Book a time</Link>,
    },
  ];
  return (
    <div className="container py-14 sm:py-20">
      <h1 className="max-w-2xl text-4xl font-extrabold sm:text-5xl text-balance">Let&apos;s talk about your next print run.</h1>
      <p className="mt-4 max-w-xl text-muted">Pick the channel that suits you. Orders need a design file — if you don&apos;t have one, WhatsApp us and our designers will create it.</p>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {cards.map(({ icon: Icon, title, text, action }) => (
          <div key={title} className="panel flex flex-col">
            <Icon className="h-7 w-7 text-accent" />
            <h2 className="mt-4 text-xl font-bold">{title}</h2>
            <p className="mt-1 flex-1 text-sm text-muted">{text}</p>
            <div>{action}</div>
          </div>
        ))}
      </div>
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <p className="flex items-center gap-3 rounded-xl border border-line p-4 text-sm"><Clock className="h-5 w-5 text-brand" /> Mon – Sat, 9.00 am – 6.00 pm (Sri Lanka time)</p>
        <p className="flex items-center gap-3 rounded-xl border border-line p-4 text-sm"><Mail className="h-5 w-5 text-brand" /> Email replies within one working day</p>
      </div>
    </div>
  );
}
