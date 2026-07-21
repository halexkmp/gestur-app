import { useState } from 'react';
import { X } from 'lucide-react';

interface JustifyAbsenceModalProps {
  mode: 'justify' | 'remove';
  employeeName: string;
  date: string;
  onConfirm: (reason?: string) => Promise<boolean>;
  onClose: () => void;
}

export default function JustifyAbsenceModal({ mode, employeeName, date, onConfirm, onClose }: JustifyAbsenceModalProps) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formattedDate = new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR');

  const handleConfirm = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm(mode === 'justify' ? reason || undefined : undefined);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar a solicitação');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
          <h3 className="font-bold">
            {mode === 'justify' ? 'Justificar Falta' : 'Remover Justificativa'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600">
            {employeeName} — {formattedDate}
          </p>

          {mode === 'justify' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Motivo (opcional)</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explique o motivo da falta..."
                className="w-full border rounded-md p-2 h-24"
              />
            </div>
          )}

          {mode === 'remove' && (
            <p className="text-sm text-gray-600">
              Deseja remover esta justificativa? O dia voltará a refletir o status real de comparecimento.
            </p>
          )}

          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={submitting}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Salvando...' : 'Confirmar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
