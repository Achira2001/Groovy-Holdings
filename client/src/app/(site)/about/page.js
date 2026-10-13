import Link from 'next/link';
import { Coffee, Layers, Printer, Shirt, Sparkles } from 'lucide-react';

export const metadata = { title: 'About us' };

const SERVICES = [
  { icon: Printer, title: 'Screen & DTF printing', text: 'Sharp, durable prints for teams, events and brands — from 10 pieces to thousands.' },
  { icon: Layers, title: 'Embroidery', text: 'Logos stitched on caps, polos and uniforms with clean, dense thread work.' },
  { icon: Coffee, title: 'Mugs & gifts', text: 'Sublimation mugs, bottles and corporate gift sets with full-colour artwork.' },
  { icon: Shirt, title: 'Garments sourced for you', text: 'Cotton, dri-fit, polo and hoodie blanks in the sizes and colours you need.' },
];

export default function AboutPage() {
  return (
    <div>
      <section className="container grid gap-10 py-14 lg:grid-cols-2 lg:py-20">
        <div>
          <p className="chip mb-5"><Sparkles className="h-3.5 w-3.5 text-accent" /> Groovy Holdings (Pvt) Ltd</p>
          <h1 className="text-4xl font-extrabold leading-[1.05] sm:text-6xl text-balance">We put your idea on fabric, thread and ceramic.</h1>
        </div>
        <div className="space-y-4 text-lg text-muted lg:pt-14">
          <p>
            Groovy Holdings is a Sri Lankan print and embroidery studio. For years we worked the traditional way — walk-ins, phone calls and
            WhatsApp threads. This website brings all of that together: browse our past work, share your design, talk to our team and
            follow your order until it&apos;s delivered.
          </p>
          <p>Every order is checked by a person before we print. We confirm material, sizes and price with you first, so there are no surprises.</p>
        </div>
      </section>

      <section className="border-y border-line bg-surface">
        <div className="container grid gap-px overflow-hidden py-0 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="p-8">
              <Icon className="h-7 w-7 text-accent" />
              <h2 className="mt-5 text-xl font-bold">{title}</h2>
              <p className="mt-2 text-sm text-muted">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container py-16">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            ['01', 'Choose', 'Pick a product from our catalogue to see materials, prices and the size chart.'],
            ['02', 'Share', 'Upload your design and sizes, or book a meeting / WhatsApp us to get one designed.'],
            ['03', 'Receive', 'We confirm the price, print, and keep you updated at every step.'],
          ].map(([n, t, d]) => (
            <div key={n} className="rounded-2xl border border-dashed border-line p-6">
              <p className="font-display text-5xl font-extrabold text-brand/30">{n}</p>
              <p className="mt-2 text-xl font-bold">{t}</p>
              <p className="mt-1 text-sm text-muted">{d}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/products" className="btn-primary btn-lg">Browse products</Link>
          <Link href="/contact" className="btn-outline btn-lg">Contact us</Link>
        </div>
      </section>
    </div>
  );
}
