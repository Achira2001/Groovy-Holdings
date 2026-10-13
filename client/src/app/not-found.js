import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="container grid min-h-[70vh] place-items-center py-16 text-center">
        <div>
          <p className="halftone-accent mx-auto mb-6 grid h-32 w-32 place-items-center rounded-full">
            <span className="font-display text-5xl font-extrabold text-accent">404</span>
          </p>
          <h1 className="text-3xl font-extrabold sm:text-4xl">This page slipped off the press.</h1>
          <p className="mt-2 text-muted">The link may be old or the page was moved.</p>
          <div className="mt-6 flex justify-center gap-2">
            <Link href="/" className="btn-primary">Go home</Link>
            <Link href="/products" className="btn-outline">Browse products</Link>
          </div>
        </div>
      </main>
    </>
  );
}
