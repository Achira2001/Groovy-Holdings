import Link from 'next/link';
import { CalendarDays, Coffee, MessageCircle, Scissors, Shirt, Upload, Truck, Search, Briefcase } from 'lucide-react';
import ProofSheet from '@/components/home/ProofSheet';
import FeaturedProducts from '@/components/home/FeaturedProducts';
import { whatsappLink, WHATSAPP_DISPLAY } from '@/lib/utils';

const SERVICES = [
  { name: 'T-shirt printing', text: 'Screen print, DTF and sublimation on cotton and dri-fit.', swatch: 'bg-brand', icon: Shirt, href: '/products?category=t-shirts' },
  { name: 'Cap printing', text: 'Baseball, trucker and bucket caps with print or 3D puff.', swatch: 'bg-brand-deep', icon: Briefcase, href: '/products?category=caps' },
  { name: 'Embroidery', text: 'Sharp logo embroidery on polos, shirts, bags and patches.', swatch: 'bg-accent', icon: Scissors, href: '/products?category=embroidery' },
  { name: 'Mugs & gifts', text: 'Sublimation mugs, magic mugs and bottles for giveaways.', swatch: 'bg-[#E9B949]', icon: Coffee, href: '/products?category=mugs' },
];

const STEPS = [
  { icon: Search, title: 'Pick a product', text: 'Browse our work, check materials, prices and the size chart.' },
  { icon: Upload, title: 'Send your design', text: 'Upload your artwork with sizes and quantities. No design yet? WhatsApp us and we will create it.' },
  { icon: CalendarDays, title: 'Talk it through', text: 'Chat with the team or book a Google Meet slot to confirm fabric, colours and price.' },
  { icon: Truck, title: 'We print & deliver', text: 'Track production from your account until your order is ready.' },
];

const METHODS = [
  ['Screen printing', 'Bulk orders of 24+ pieces with solid colours', 'Most economical at volume'],
  ['DTF printing', 'Full-colour designs, small runs, any fabric colour', 'No minimum colour limit'],
  ['Sublimation', 'Polyester jerseys and mugs, all-over prints', 'Colours never crack or peel'],
  ['Embroidery', 'Corporate polos, caps and uniforms', 'Premium, long-lasting finish'],
];

export default function HomePage() {
  return (
    <>
      {/* ───────── Hero ───────── */}
      <section className="relative overflow-hidden">
        <div className="halftone pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full opacity-60 [mask-image:radial-gradient(circle,black,transparent_70%)]" />
        <div className="container relative grid items-center gap-14 py-14 lg:grid-cols-[1.1fr_1fr] lg:py-24">
          <div className="animate-ink">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-muted">
              <span className="h-2 w-2 rounded-full bg-success" /> Now taking orders online
            </p>
            <h1 className="text-balance font-display text-[2.6rem] font-extrabold leading-[1.02] sm:text-6xl lg:text-[4.4rem]">
              Your design on shirts, caps and mugs your team will actually wear.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
              Groovy Holdings prints and embroiders custom merchandise for companies, schools, clubs and events across Sri Lanka.
              Pick a product, upload your artwork and follow every step of production online.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/products" className="btn-primary btn-lg">Browse products</Link>
              <Link href="/meetings" className="btn-outline btn-lg">
                <CalendarDays className="h-5 w-5" /> Book a free meeting
              </Link>
            </div>
            <a href={whatsappLink('Hi! I need a quote for custom printing.')} target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-ink">
              <MessageCircle className="h-4 w-4 text-success" /> Prefer WhatsApp? {WHATSAPP_DISPLAY}
            </a>
          </div>
          <ProofSheet />
        </div>
      </section>

      {/* ───────── Services as ink swatches ───────── */}
      <section className="container py-14">
        <div className="mb-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <h2 className="max-w-lg text-3xl font-extrabold sm:text-4xl">What we print and stitch</h2>
          <Link href="/products" className="link text-sm">See all products</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map(({ name, text, swatch, icon: Icon, href }) => (
            <Link key={name} href={href} className="group overflow-hidden rounded-2xl border border-line bg-surface transition hover:-translate-y-0.5 hover:shadow-lift">
              <div className={`relative h-28 ${swatch}`}>
                <div className="halftone absolute inset-0 opacity-40 mix-blend-overlay" />
                <Icon className="absolute bottom-3 right-4 h-9 w-9 text-white/90" strokeWidth={1.5} />
              </div>
              <div className="p-5">
                <h3 className="text-lg font-bold">{name}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{text}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ───────── Featured work ───────── */}
      <section className="container py-14">
        <div className="mb-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-3xl font-extrabold sm:text-4xl">Recent work & best sellers</h2>
            <p className="mt-2 max-w-xl text-muted">Every product shows real prices, materials and a size chart so you can plan before you order.</p>
          </div>
          <Link href="/products" className="btn-outline">View catalogue</Link>
        </div>
        <FeaturedProducts />
      </section>

      {/* ───────── How ordering works (a real sequence) ───────── */}
      <section className="border-y border-line bg-surface py-16">
        <div className="container">
          <h2 className="max-w-xl text-3xl font-extrabold sm:text-4xl">How ordering works</h2>
          <ol className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(({ icon: Icon, title, text }, i) => (
              <li key={title} className="relative">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-soft text-brand">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="font-display text-sm font-bold text-muted">Step {i + 1}</span>
                </div>
                <h3 className="mt-4 text-lg font-bold">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ───────── Print methods ───────── */}
      <section className="container py-16">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <h2 className="text-3xl font-extrabold sm:text-4xl">Which print method fits your job?</h2>
            <p className="mt-3 text-muted">Not sure? Tell us the quantity, fabric and design – we will recommend the best finish for your budget.</p>
            <Link href="/meetings" className="btn-brand mt-6">Ask in a meeting</Link>
          </div>
          <div className="overflow-hidden rounded-2xl border border-line bg-surface">
            {METHODS.map(([m, best, perk]) => (
              <div key={m} className="grid gap-1 border-b border-line px-5 py-4 last:border-0 sm:grid-cols-[160px_1fr_auto] sm:items-center sm:gap-4">
                <p className="font-display font-bold">{m}</p>
                <p className="text-sm text-muted">{best}</p>
                <p className="text-sm font-semibold text-brand">{perk}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── Design CTA ───────── */}
      <section className="container">
        <div className="relative overflow-hidden rounded-[28px] bg-[#13243B] px-6 py-12 text-white sm:px-12">
          <div className="halftone-accent absolute -right-10 top-0 h-full w-1/2 opacity-40 [mask-image:linear-gradient(to_left,black,transparent)]" />
          <div className="relative grid gap-10 md:grid-cols-2">
            <div>
              <h2 className="text-3xl font-extrabold">Have your design ready?</h2>
              <p className="mt-3 max-w-md text-white/75">Choose a product, add sizes and quantities, upload the artwork and place your order in minutes.</p>
              <Link href="/products" className="btn mt-6 bg-white text-[#13243B] hover:bg-white/90">Start an order</Link>
            </div>
            <div className="md:border-l md:border-white/15 md:pl-10">
              <h2 className="text-3xl font-extrabold">Need a design made?</h2>
              <p className="mt-3 max-w-md text-white/75">Our designers can create it for you. Send a WhatsApp message with your idea and we will reply with drafts.</p>
              <a href={whatsappLink('Hi Groovy Holdings! I need a design for my order.')} target="_blank" rel="noreferrer" className="btn mt-6 bg-[#1FAF5A] text-white hover:bg-[#199a4e]">
                <MessageCircle className="h-4 w-4" /> WhatsApp {WHATSAPP_DISPLAY}
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
