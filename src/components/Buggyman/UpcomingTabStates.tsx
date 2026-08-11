import { AlertCircle, CalendarCheck, RefreshCw } from 'lucide-react';

interface UpcomingTabStatesProps {
  loading: boolean;
  error: string | null;
  isEmpty: boolean;
  includeOverdue: boolean;
  onRetry: () => void;
}

/** Skeleton mirroring the loaded table so nothing shifts when data arrives. */
function Skeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="h-4 w-56 bg-gray-200 rounded" />
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 p-4">
          <div className="h-3 w-full bg-gray-200 rounded" />
        </div>
        <div className="divide-y divide-gray-200">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="p-4">
              <div className="h-5 w-full bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function UpcomingTabStates({
  loading,
  error,
  isEmpty,
  includeOverdue,
  onRetry,
}: UpcomingTabStatesProps) {
  if (error) {
    return (
      <div className="bg-white border border-red-200 rounded-xl p-12 text-center flex flex-col items-center">
        <div className="p-3 bg-red-50 text-red-600 rounded-full mb-3">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="font-bold text-gray-800 text-base">
          Não foi possível carregar as parcelas.
        </h3>
        <p className="text-gray-500 text-sm mt-1 max-w-sm">{error}</p>
        <button
          onClick={onRetry}
          className="mt-4 bg-blue-50 text-blue-600 hover:bg-blue-100 text-sm font-semibold px-4 py-2 rounded-lg transition flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Tentar novamente
        </button>
      </div>
    );
  }

  if (loading) return <Skeleton />;

  if (isEmpty) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-12 text-center flex flex-col items-center">
        <div className="p-3 bg-green-50 text-green-600 rounded-full mb-3">
          <CalendarCheck className="w-8 h-8" />
        </div>
        <h3 className="font-bold text-gray-800 text-base">
          Nenhuma parcela a receber neste período.
        </h3>
        <p className="text-gray-500 text-sm mt-1 max-w-xs">
          {includeOverdue
            ? 'Nada em aberto neste intervalo, nem vencido antes dele.'
            : 'Tente ampliar o intervalo de datas ou incluir as parcelas vencidas.'}
        </p>
      </div>
    );
  }

  return <Skeleton />;
}
