import { useState } from 'react';
import { useLoans } from '../hooks/useLoans';
import { Partner, CreateLoanRequest } from '../types';
import { X, Plus, Coins, Loader2, AlertCircle } from 'lucide-react';
import LoanCard from './LoanCard';
import LoanFormModal from './LoanFormModal';

interface LoanDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  partner: Partner | null;
}

export default function LoanDrawer({ isOpen, onClose, partner }: LoanDrawerProps) {
  const {
    loans,
    loading,
    error,
    fetchLoanDetails,
    createLoan,
    updateLoanStatus,
  } = useLoans(partner?.id);

  const [expandedLoanId, setExpandedLoanId] = useState<string | null>(null);
  const [loadingDetailsId, setLoadingDetailsId] = useState<string | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);

  if (!isOpen || !partner) return null;

  const handleToggleExpand = async (loanId: string) => {
    if (expandedLoanId === loanId) {
      setExpandedLoanId(null);
    } else {
      setExpandedLoanId(loanId);
      setLoadingDetailsId(loanId);
      try {
        await fetchLoanDetails(loanId);
      } catch {
        // captured by hook
      } finally {
        setLoadingDetailsId(null);
      }
    }
  };

  const handleCreateLoanSubmit = async (data: CreateLoanRequest) => {
    try {
      const newLoan = await createLoan(data);
      setShowFormModal(false);
      setExpandedLoanId(newLoan.id);
      setLoadingDetailsId(newLoan.id);
      await fetchLoanDetails(newLoan.id);
    } finally {
      setLoadingDetailsId(null);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity z-40"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-2xl w-full bg-gray-50 shadow-2xl z-50 flex flex-col transition-all duration-300 transform translate-x-0 h-full">
        <div className="bg-white border-b border-gray-200 px-6 py-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-gray-800">Empréstimos de Bugueiros</h2>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${
                  partner.active
                    ? 'bg-green-100 text-green-800 border-green-200'
                    : 'bg-red-100 text-red-800 border-red-200'
                }`}
              >
                {partner.active ? 'Ativo' : 'Inativo'}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Bugueiro: <span className="font-semibold text-gray-900">{partner.name}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFormModal(true)}
              className="bg-blue-600 text-white text-sm px-3.5 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-1.5 font-medium"
            >
              <Plus className="w-4 h-4" /> Novo Empréstimo
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-start gap-2 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Erro ao processar requisição</p>
                <p className="text-xs mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {loading && loans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-gray-500 font-medium">Buscando empréstimos...</p>
            </div>
          ) : loans.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-12 text-center flex flex-col items-center justify-center">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-full mb-3">
                <Coins className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-gray-800 text-base">Sem empréstimos</h3>
              <p className="text-gray-500 text-sm mt-1 max-w-xs">
                Este bugueiro não possui nenhum empréstimo registrado no momento.
              </p>
              <button
                onClick={() => setShowFormModal(true)}
                className="mt-4 bg-blue-50 text-blue-600 hover:bg-blue-100 text-sm font-semibold px-4 py-2 rounded-lg transition"
              >
                Registrar Primeiro Empréstimo
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {loans.map((loan) => (
                <LoanCard
                  key={loan.id}
                  loan={loan}
                  isExpanded={expandedLoanId === loan.id}
                  onToggle={() => handleToggleExpand(loan.id)}
                  onRefresh={() => fetchLoanDetails(loan.id).then(() => {})}
                  loadingDetails={loadingDetailsId === loan.id}
                  onUpdateStatus={updateLoanStatus}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {showFormModal && (
        <LoanFormModal
          partnerId={partner.id}
          onClose={() => setShowFormModal(false)}
          onSubmit={handleCreateLoanSubmit}
        />
      )}
    </>
  );
}
