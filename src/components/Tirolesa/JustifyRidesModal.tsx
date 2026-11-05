import { useState } from 'react';
import { X } from 'lucide-react';
import { TirolesaJustificationType } from '../../types';
import { formatDateBR } from '../../lib/formatters';
import { canSubmitJustification } from '../../lib/tirolesaVerdict';

interface JustifyRidesModalProps {
  date: string;
  onSave: (quantity: number, type: TirolesaJustificationType, reason: string) => Promise<void>;
  onClose: () => void;
}

export default function JustifyRidesModal({ date, onSave, onClose }: JustifyRidesModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [type, setType] = useState<TirolesaJustificationType>('TEST');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await onSave(quantity, type, reason);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar a justificativa');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
          <h3 className="font-bold">Justificar descidas</h3>
          <button onClick={onClose} aria-label="Fechar" className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <p className="text-sm text-gray-600">Dia {formatDateBR(date)}</p>
          <label className="block text-sm font-medium text-gray-700">
            Quantidade
            <input
              type="number"
              min={1}
              step={1}
              value={quantity}
              onChange={(event) => setQuantity(Number(event.target.value))}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Tipo
            <select
              value={type}
              onChange={(event) => setType(event.target.value as TirolesaJustificationType)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
            >
              <option value="TEST">Teste</option>
              <option value="COURTESY">Cortesia</option>
              <option value="OTHER">Outro</option>
            </select>
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Motivo
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={3}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        <div className="p-4 border-t flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancelar</button>
          <button
            onClick={handleSave}
            disabled={submitting || !canSubmitJustification(quantity, reason)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
          >
            {submitting ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}
