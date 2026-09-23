'use client';

import React, { useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Copy, Check, ExternalLink } from 'lucide-react';

interface QRCodeCardProps {
  url: string;
  code: string;
  size?: number;
  title?: string;
  compact?: boolean;
}

export const QRCodeCard: React.FC<QRCodeCardProps> = ({
  url,
  code,
  size = 180,
  title,
  compact = false,
}) => {
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!qrRef.current) return;
    const svgElement = qrRef.current.querySelector('svg');
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    // High resolution for PowerPoint (1024x1024)
    canvas.width = 1024;
    canvas.height = 1024;

    img.onload = () => {
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // Draw margin of 64px
        ctx.drawImage(img, 64, 64, canvas.width - 128, canvas.height - 128);
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `slidepulse-qrcode-${code}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      }
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  if (compact) {
    return (
      <div className="flex flex-col items-center bg-white p-3 rounded-2xl shadow-sm border border-slate-200">
        <div ref={qrRef} className="p-1 bg-white rounded-xl">
          <QRCodeSVG value={url} size={size} level="M" />
        </div>
        <div className="mt-2 text-center">
          <span className="text-xs font-semibold text-slate-500 tracking-wider uppercase">PIN</span>
          <p className="text-sm font-black text-slate-800 tracking-widest">{code}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center bg-white/95 backdrop-blur-md p-5 rounded-3xl shadow-xl border border-slate-200/80 text-slate-900 transition-all hover:shadow-2xl">
      {title && (
        <h4 className="text-sm font-semibold text-slate-600 mb-3 text-center">
          {title}
        </h4>
      )}

      {/* QR Code Container */}
      <div
        ref={qrRef}
        className="p-3 bg-white rounded-2xl shadow-inner border border-slate-100 flex items-center justify-center cursor-pointer transition-transform hover:scale-[1.02]"
        onClick={handleCopy}
        title="Clicca per copiare il link"
      >
        <QRCodeSVG
          value={url}
          size={size}
          level="H"
          includeMargin={false}
          imageSettings={{
            src: '/favicon.ico',
            x: undefined,
            y: undefined,
            height: 28,
            width: 28,
            opacity: 1,
            excavate: true,
          }}
        />
      </div>

      {/* PIN & Instructions */}
      <div className="mt-4 text-center w-full">
        <p className="text-xs text-slate-500 font-medium">Inquadra con la fotocamera o vai su</p>
        <div className="mt-1 flex items-center justify-center gap-1.5 text-xs font-mono font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
          <ExternalLink className="w-3 h-3" />
          <span className="truncate max-w-[200px]">slidepulse / PIN: {code}</span>
        </div>
      </div>

      {/* Action Buttons for Presenter */}
      <div className="mt-4 flex items-center gap-2 w-full">
        <button
          onClick={handleCopy}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
          title="Copia link sondaggio"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copiato!' : 'Copia Link'}
        </button>

        <button
          onClick={handleDownload}
          className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition-colors cursor-pointer"
          title="Scarica PNG per PowerPoint"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Salva PNG</span>
        </button>
      </div>
    </div>
  );
};
