import { useState, useMemo } from 'react';
import { CreateLoanRequest } from '../types';
import { X, Loader2 } from 'lucide-react';

interface LoanFormModalProps {
  partnerId: string;
  onClose: () => void;
  onSubmit: (data: CreateLoanRequest) => Promise<any>;
}

export default function LoanFormModal({ partnerId, onClose, onSubmit }: LoanFormModalProps) {
  const [formData, setFormData] = useState({
    principal_amount: '',
    interest_rate: '0',
    installments_qty: '1',
    start_date: new Date().toISOString().split('T')[0],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const estimatedEndDate = useMemo(() => {
    const installmentsCount = parseInt(formData.installments_qty, 10);
    if (!formData.start_date || isNaN(installmentsCount) || installmentsCount < 1) {
      return '-';
    }
    const parts = formData.start_date.split('-');
    if (parts.length !== 3) return '-';
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // 0-based
    const day = parseInt(parts[2], 10);
    
    const date = new Date(year, month, day);
    date.setDate(date.getDate() + installmentsCount * 7);
    
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
  }, [formData.start_date, formData.installments_qty]);

  const estimatedTotalAmount = useMemo(() => {
    const principal = parseFloat(formData.principal_amount);
    const interest = parseFloat(formData.interest_rate);
    const installments = parseInt(formData.installments_qty, 10);

    if (isNaN(principal) || principal <= 0) {
      return '-';
    }

    const rate = isNaN(interest) || interest < 0 ? 0 : interest;
    const qty = isNaN(installments) || installments < 1 ? 1 : installments;

    const total = principal * (1 + (rate / 100) * qty);
    
    return total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }, [formData.principal_amount, formData.interest_rate, formData.installments_qty]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    const principal = parseFloat(formData.principal_amount);
    if (!formData.principal_amount || isNaN(principal)) {
      newErrors.principal_amount = 'O valor bruto é obrigatório.';
    } else if (principal <= 0) {
      newErrors.principal_amount = 'O valor bruto deve ser maior que zero.';
    }

    const interest = parseFloat(formData.interest_rate);
    if (isNaN(interest) || interest < 0) {
      newErrors.interest_rate = 'A taxa de juros não pode ser negativa.';
    }

    const instCount = parseInt(formData.installments_qty, 10);
    if (isNaN(instCount) || instCount < 1) {
      newErrors.installments = 'O número de parcelas deve ser pelo menos 1.';
    }


    if (!formData.start_date) {
      newErrors.start_date = 'A data de início é obrigatória.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setGeneralError(null);

    const payload: CreateLoanRequest = {
      partner_id: partnerId,
      principal_amount: parseFloat(formData.principal_amount),
      interest_rate: parseFloat(formData.interest_rate),
      installments_qty: parseInt(formData.installments_qty, 10),
      start_date: formData.start_date,
    };

    try {
      await onSubmit(payload);
    } catch (err) {
      setGeneralError(err instanceof Error ? err.message : 'Falha ao criar o empréstimo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start sm:items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 my-auto relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold text-gray-800 mb-4">Novo Empréstimo</h2>

        {generalError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
            {generalError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Valor Bruto (R$) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.principal_amount}
              onChange={(e) => setFormData({ ...formData, principal_amount: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.principal_amount ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="0,00"
            />
            {errors.principal_amount && (
              <p className="text-xs text-red-500 mt-1">{errors.principal_amount}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Taxa de Juros (%) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.interest_rate}
                onChange={(e) => setFormData({ ...formData, interest_rate: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.interest_rate ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.interest_rate && (
                <p className="text-xs text-red-500 mt-1">{errors.interest_rate}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nº de Parcelas <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={formData.installments_qty}
                onChange={(e) => setFormData({ ...formData, installments_qty: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.installments_qty ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.installments_qty && (
                <p className="text-xs text-red-500 mt-1">{errors.installments_qty}</p>
              )}
            </div>
          </div>


          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data de Início <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.start_date ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.start_date && (
              <p className="text-xs text-red-500 mt-1">{errors.start_date}</p>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3.5 space-y-2 text-sm text-blue-900">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-medium">Data de Término Estimada:</span>
              <span className="font-bold text-gray-900" data-testid="preview-end-date">
                {estimatedEndDate}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-medium">Valor Total Estimado:</span>
              <span className="font-bold text-gray-900" data-testid="preview-total-amount">
                {estimatedTotalAmount}
              </span>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Empréstimo'
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
