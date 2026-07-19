import { useEffect, useState } from 'react';
import { Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useLatenessConfig } from '../hooks/useLatenessConfig';
import { LatenessConfig } from '../types';

const emptyForm: LatenessConfig = {
  enabled: false,
  expected_entrance_time: '00:00:00',
  tolerance_minutes: 0,
  deduction_interval_minutes: 0,
  deduction_value: 0,
};

export default function LatenessConfigPanel() {
  const { config, loading, error, save } = useLatenessConfig();
  const [form, setForm] = useState<LatenessConfig>(emptyForm);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (config) {
      setForm(config);
    }
  }, [config]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(false);
    const ok = await save(form);
    if (ok) {
      setSaved(true);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-2xl">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Configuração de Atrasos</h2>
        <p className="text-sm text-gray-600 mt-1">
          Defina o horário de entrada esperado, a tolerância e o desconto aplicado por atraso.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 flex items-center gap-2">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {saved && !error && (
        <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 flex items-center gap-2">
          <CheckCircle2 size={20} />
          <span>Configuração salva com sucesso.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.enabled}
            onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">Aplicar desconto por atraso</span>
        </label>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Horário de entrada esperado</label>
          <input
            type="time"
            step={1}
            value={form.expected_entrance_time}
            onChange={(e) => setForm({ ...form, expected_entrance_time: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tolerância (min)</label>
            <input
              type="number"
              min={0}
              value={form.tolerance_minutes}
              onChange={(e) => setForm({ ...form, tolerance_minutes: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Intervalo do desconto (min)</label>
            <input
              type="number"
              min={1}
              value={form.deduction_interval_minutes}
              onChange={(e) => setForm({ ...form, deduction_interval_minutes: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor do desconto (R$)</label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={form.deduction_value}
              onChange={(e) => setForm({ ...form, deduction_value: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          {loading ? 'Salvando...' : 'Salvar configuração'}
        </button>
      </form>
    </div>
  );
}
