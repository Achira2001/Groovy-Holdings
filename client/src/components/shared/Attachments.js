'use client';

import { Download, Eye, FileArchive, FileImage, FileText, File as FileIcon } from 'lucide-react';
import { fileUrl } from '@/lib/api';
import { bytes, cn, isImage } from '@/lib/utils';

function iconFor(mime = '', name = '') {
  if (mime.startsWith('image/')) return FileImage;
  if (/zip|rar|7z/.test(mime) || /\.(zip|rar|7z)$/i.test(name)) return FileArchive;
  if (mime.includes('pdf') || mime.startsWith('text/')) return FileText;
  return FileIcon;
}

/** A single private file (order design / chat attachment) with preview + download. */
export function FileTile({ file, className, dark }) {
  const Icon = iconFor(file.mimeType, file.originalName);
  const url = fileUrl(file.filename);
  return (
    <div className={cn('group flex items-center gap-3 rounded-xl border p-2', dark ? 'border-white/20 bg-white/10' : 'border-line bg-surface', className)}>
      {isImage(file.mimeType) ? (
        <a href={url} target="_blank" rel="noreferrer" className="shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={file.originalName} className="h-12 w-12 rounded-lg object-cover" loading="lazy" />
        </a>
      ) : (
        <span className={cn('grid h-12 w-12 shrink-0 place-items-center rounded-lg', dark ? 'bg-white/15' : 'bg-surface-2 text-muted')}>
          <Icon className="h-5 w-5" />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{file.originalName || file.filename}</span>
        <span className={cn('block text-xs', dark ? 'opacity-75' : 'text-muted')}>{bytes(file.size)}</span>
      </span>
      <span className="flex shrink-0 gap-1">
        <a href={url} target="_blank" rel="noreferrer" className={cn('btn-icon h-8 w-8', dark && 'text-white hover:bg-white/15 hover:text-white')} aria-label="Open file">
          <Eye className="h-4 w-4" />
        </a>
        <a href={fileUrl(file.filename, true)} className={cn('btn-icon h-8 w-8', dark && 'text-white hover:bg-white/15 hover:text-white')} aria-label="Download file">
          <Download className="h-4 w-4" />
        </a>
      </span>
    </div>
  );
}

export function FileGrid({ files = [], className }) {
  if (!files.length) return null;
  return (
    <div className={cn('grid gap-2 sm:grid-cols-2', className)}>
      {files.map((f) => (
        <FileTile key={f.filename} file={f} />
      ))}
    </div>
  );
}
