'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Expand, Shirt } from 'lucide-react';
import { Modal } from '@/components/ui';
import { cn } from '@/lib/utils';

export default function ProductGallery({ images = [], name }) {
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(false);

  if (!images.length) {
    return (
      <div className="halftone grid aspect-square place-items-center rounded-2xl border border-line bg-surface-2">
        <Shirt className="h-20 w-20 text-brand/50" strokeWidth={1} />
      </div>
    );
  }

  const go = (d) => setIndex((i) => (i + d + images.length) % images.length);

  return (
    <div>
      <div className="group relative aspect-square overflow-hidden rounded-2xl border border-line bg-surface-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={images[index]} alt={`${name} – photo ${index + 1}`} className="h-full w-full object-cover" />
        <button type="button" onClick={() => setZoom(true)} className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-lg bg-surface/90 text-ink shadow-lift" aria-label="View larger">
          <Expand className="h-4 w-4" />
        </button>
        {images.length > 1 && (
          <>
            <button type="button" onClick={() => go(-1)} className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-surface/90 shadow-lift" aria-label="Previous photo">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button type="button" onClick={() => go(1)} className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-surface/90 shadow-lift" aria-label="Next photo">
              <ChevronRight className="h-5 w-5" />
            </button>
            <span className="absolute bottom-3 left-3 rounded-md bg-black/55 px-2 py-0.5 text-xs font-semibold text-white">
              {index + 1} / {images.length}
            </span>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="scrollbar-thin mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setIndex(i)}
              className={cn('h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition', i === index ? 'border-accent' : 'border-transparent opacity-70 hover:opacity-100')}
              aria-label={`Show photo ${i + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
      <Modal open={zoom} onClose={() => setZoom(false)} title={name} size="xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={images[index]} alt={name} className="mx-auto max-h-[75vh] w-auto rounded-xl" />
      </Modal>
    </div>
  );
}
