import { useState } from 'react';
import { Check, Copy, KeyRound, X } from 'lucide-react';

interface DeviceKeyNoticeProps {
  apiKey: string;
  onDismiss: () => void;
}

export default function DeviceKeyNotice({ apiKey, onDismiss }: DeviceKeyNoticeProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(apiKey);
      setCopied(true);
    } catch {
      // The key stays selectable on screen when the clipboard is unavailable.
      setCopied(false);
    }
  };

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-amber-800 font-medium">
          <KeyRound className="w-5 h-5 shrink-0" />
          Esta chave não será mostrada novamente
        </div>
        <button onClick={onDismiss} aria-label="Fechar" className="text-amber-700 hover:text-amber-900">
          <X className="w-5 h-5" />
        </button>
      </div>
      <p className="text-sm text-amber-800">Copie e grave a chave no dispositivo antes de fechar este aviso.</p>
      <div className="flex flex-col sm:flex-row gap-2">
        <code className="flex-1 bg-white border border-amber-200 rounded-lg px-3 py-2 text-sm break-all select-all">
          {apiKey}
        </code>
        <button
          onClick={handleCopy}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm font-medium"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copiada' : 'Copiar'}
        </button>
      </div>
    </div>
  );
}
