import { useState } from 'react';
import { CreateSalaryAdvanceRequest } from '../../types';

interface NewAdvanceFormProps {
  employeeOptions: { id: string; name: string }[];
  submitting: boolean;
  onSubmit: (payload: CreateSalaryAdvanceRequest) => Promise<void>;
  onCancel: () => void;
}

const today = new Date().toISOString().split('T')[0];

export default function NewAdvanceForm({ employeeOptions, submitting, onSubmit, onCancel }: NewAdvanceFormProps) {
  const [employeeId, setEmployeeId] = useState('');
  const [amount, setAmount] = useState('');
  const [advanceDate, setAdvanceDate] = useState(today);
  const [times, setTimes] = useState(1);
  const [note, setNote] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      employee_id: employeeId,
      amount: Number(amount),
      advance_date: advanceDate || undefined,
      note: note || undefined,
      times: Number(times),
    });
    setEmployeeId('');
    setAmount('');
    setAdvanceDate(today);
    setTimes(1);
    setNote('');
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex flex-col lg:flex-row items-end gap-4">
        <div className="flex-[2] w-full">
          <label className="block text-sm font-medium text-gray-700 mb-1">Funcionário</label>
          <select
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="">Selecione...</option>
            {employeeOptions.map(e => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
        </div>
        <div className="w-full lg:w-40">
          <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
          <input
            type="date"
            value={advanceDate}
            onChange={(e) => setAdvanceDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="w-full lg:w-32">
          <label className="block text-sm font-medium text-gray-700 mb-1">Valor</label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-400">R$</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
        </div>
        <div className="w-full lg:w-24">
          <label className="block text-sm font-medium text-gray-700 mb-1">Vezes</label>
          <input
            type="number"
            min="1"
            max="12"
            value={times}
            onChange={(e) => setTimes(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex-[2] w-full">
          <label className="block text-sm font-medium text-gray-700 mb-1">Observação (opcional)</label>
          <input
            type="text"
            placeholder="Ex: Ref. mês atual"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2 w-full lg:w-auto">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 lg:flex-none px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!employeeId || !amount || submitting}
            className="flex-1 lg:flex-none bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
          >
            {submitting ? 'Salvando...' : 'Lançar'}
          </button>
        </div>
      </div>
    </form>
  );
}
