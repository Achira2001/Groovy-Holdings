'use client';

import { useRef, useState } from 'react';
import { FileText, ImageIcon, UploadCloud, X } from 'lucide-react';
import { bytes, cn } from '@/lib/utils';

const DEFAULT_ACCEPT = '.jpg,.jpeg,.png,.webp,.gif,.svg,.pdf,.ai,.eps,.psd,.cdr,.tif,.tiff,.zip,.rar,.doc,.docx,.xls,.xlsx,.txt';

/** Drag & drop multi-file picker with previews. Controlled via files/onChange. */
export default function FileDropzone({ files, onChange, max = 10, maxSizeMB = 25, accept = DEFAULT_ACCEPT, label = 'Drop files here or browse', hint, compact }) {
  const inputRef = useRef(null);
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState('');

  const add = (list) => {
    setError('');
    const incoming = Array.from(list || []);
    const tooBig = incoming.filter((f) => f.size > maxSizeMB * 1024 * 1024);
    if (tooBig.length) setError(`${tooBig[0].name} is larger than ${maxSizeMB} MB`);
    const ok = incoming.filter((f) => f.size <= maxSizeMB * 1024 * 1024);
    const next = [...files, ...ok].slice(0, max);
    if (files.length + ok.length > max) setError(`You can attach up to ${max} files`);
    onChange(next);
  };

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          add(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 text-center transition-colors',
          compact ? 'py-5' : 'py-9',
          drag ? 'border-brand bg-brand-soft' : 'border-line bg-surface-2/50 hover:border-brand/60'
        )}
      >
        <UploadCloud className="mb-2 h-7 w-7 text-brand" />
        <p className="text-sm font-semibold">{label}</p>
        <p className="mt-1 text-xs text-muted">{hint || `Up to ${max} files, ${maxSizeMB} MB each`}</p>
        <input ref={inputRef} type="file" multiple accept={accept} className="hidden" onChange={(e) => { add(e.target.files); e.target.value = ''; }} />
      </div>
      {error && <p className="field-error">{error}</p>}
      {files.length > 0 && (
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} className="flex items-center gap-3 rounded-lg border border-line bg-surface p-2">
              {f.type.startsWith('image/') && !f.type.includes('svg') ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={URL.createObjectURL(f)} alt="" className="h-10 w-10 rounded-md object-cover" />
              ) : (
                <span className="grid h-10 w-10 place-items-center rounded-md bg-surface-2 text-muted">
                  {f.type.startsWith('image/') ? <ImageIcon className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{f.name}</span>
                <span className="block text-xs text-muted">{bytes(f.size)}</span>
              </span>
              <button type="button" className="btn-icon h-8 w-8" onClick={() => onChange(files.filter((_, j) => j !== i))} aria-label={`Remove ${f.name}`}>
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
