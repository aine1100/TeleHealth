import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Download, ExternalLink, Eye, FileText, Image as ImageIcon, X } from 'lucide-react';
import { resolveApiUrl } from '../../utils/apiUrl';

const guessKind = (url = '', fileType = '', fileName = '') => {
  const mime = String(fileType || '').toLowerCase();
  const name = String(fileName || url || '').toLowerCase();

  if (mime.startsWith('image/') || /\.(png|jpe?g|gif|webp|bmp|svg)(\?|$)/i.test(name)) {
    return 'image';
  }
  if (mime === 'application/pdf' || /\.pdf(\?|$)/i.test(name)) {
    return 'pdf';
  }
  return 'file';
};

const DocumentViewerModal = ({ open, document: doc, onClose }) => {
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    const previousOverflow = window.document.body.style.overflow;
    window.document.body.style.overflow = 'hidden';
    window.document.addEventListener('keydown', onKeyDown);
    return () => {
      window.document.body.style.overflow = previousOverflow;
      window.document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  if (!open || !doc?.url) return null;

  const kind = guessKind(doc.url, doc.fileType, doc.fileName);
  const title = doc.fileName || 'Document';

  return createPortal(
    <div className="fixed inset-0 z-[130] flex items-end justify-center p-3 sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Close document viewer"
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-[1px]"
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.25)]">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-ink-100 px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-ink-900">{title}</p>
            <p className="mt-0.5 text-xs text-ink-500">
              {kind === 'image' ? 'Image preview' : kind === 'pdf' ? 'PDF preview' : 'File preview'}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <a
              href={doc.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 px-2.5 py-1.5 text-xs font-semibold text-ink-700 hover:bg-ink-50"
            >
              <ExternalLink size={13} />
              Open
            </a>
            <a
              href={doc.url}
              download={doc.fileName || true}
              className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 px-2.5 py-1.5 text-xs font-semibold text-ink-700 hover:bg-ink-50"
            >
              <Download size={13} />
              Download
            </a>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-50 hover:text-ink-700"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="min-h-[280px] flex-1 overflow-auto bg-ink-50/80 p-3 sm:p-4">
          {kind === 'image' ? (
            <div className="flex min-h-[280px] items-center justify-center">
              <img
                src={doc.url}
                alt={title}
                className="max-h-[min(70vh,720px)] max-w-full rounded-lg object-contain shadow-sm"
              />
            </div>
          ) : null}

          {kind === 'pdf' ? (
            <iframe
              title={title}
              src={doc.url}
              className="h-[min(70vh,720px)] w-full rounded-lg border border-ink-200 bg-white"
            />
          ) : null}

          {kind === 'file' ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 text-center">
              <FileText className="h-10 w-10 text-ink-300" />
              <p className="text-sm font-semibold text-ink-800">Preview not available for this file type</p>
              <p className="max-w-sm text-xs text-ink-500">
                Open or download the file to view it in another app.
              </p>
              <a
                href={doc.url}
                target="_blank"
                rel="noreferrer"
                className="mt-1 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
              >
                Open file
              </a>
            </div>
          ) : null}
        </div>
      </div>
    </div>,
    window.document.body
  );
};

/**
 * List + in-app viewer for R2 (or other) uploaded documents.
 * @param {{ documents?: Array<{ fileName?: string, fileUrl?: string, fileType?: string, mimeType?: string }>, emptyText?: string, className?: string }} props
 */
const DocumentViewer = ({
  documents = [],
  emptyText = 'No documents uploaded.',
  className = ''
}) => {
  const [active, setActive] = useState(null);

  const items = (documents || [])
    .map((doc, index) => {
      const url = resolveApiUrl(doc.fileUrl || doc.url);
      if (!url) return null;
      return {
        id: `${doc.fileName || 'doc'}-${index}`,
        fileName: doc.fileName || `Document ${index + 1}`,
        fileType: doc.fileType || doc.mimeType || '',
        url
      };
    })
    .filter(Boolean);

  if (!items.length) {
    return <p className={`text-sm text-ink-500 ${className}`}>{emptyText}</p>;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {items.map((doc) => {
        const kind = guessKind(doc.url, doc.fileType, doc.fileName);
        const Icon = kind === 'image' ? ImageIcon : FileText;
        return (
          <div
            key={doc.id}
            className="flex items-center gap-3 rounded-xl border border-ink-200 px-3 py-2.5 transition hover:border-brand-300 hover:bg-brand-50/30 sm:px-4"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <Icon size={16} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink-900">{doc.fileName}</p>
              <p className="text-[11px] capitalize text-ink-500">
                {kind === 'image' ? 'Image' : kind === 'pdf' ? 'PDF' : 'File'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActive(doc)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-brand-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-50"
            >
              <Eye size={13} />
              View
            </button>
          </div>
        );
      })}

      <DocumentViewerModal open={Boolean(active)} document={active} onClose={() => setActive(null)} />
    </div>
  );
};

export { DocumentViewerModal, guessKind };
export default DocumentViewer;
