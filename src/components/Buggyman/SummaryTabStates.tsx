import { AlertCircle, CalendarX, RefreshCw } from 'lucide-react';

interface SummaryTabStatesProps {
  loading: boolean;
  error: string | null;
  isEmptyPeriod: boolean;
  onRetry: () => void;
}

/** Skeleton mirroring the loaded layout so nothing shifts when data arrives. */
function Skeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="h-4 w-32 bg-gray-200 rounded" />
            <div className="h-7 w-40 bg-gray-200 rounded mt-4" />
          </div>
        ))}
      </div>
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="h-3 w-20 bg-gray-200 rounded" />
            <div className="h-5 w-24 bg-gray-200 rounded mt-2" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-6">
        <div className="h-3 w-full bg-gray-200 rounded-full" />
        <div className="h-3 w-full bg-gray-200 rounded-full" />
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-6 w-full bg-gray-100 rounded" />
        ))}
      </div>
    </div>
  );
}

export default function SummaryTabStates({
  loading,
  error,
  isEmptyPeriod,
  onRetry,
}: SummaryTabStatesProps) {
  if (error) {
    return (
      <div className="bg-white border border-red-200 rounded-xl p-12 text-center flex flex-col items-center">
        <div className="p-3 bg-red-50 text-red-600 rounded-full mb-3">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="font-bold text-gray-800 text-base">
          Não foi possível carregar o resumo.
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

  if (isEmptyPeriod) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-12 text-center flex flex-col items-center">
        <div className="p-3 bg-blue-50 text-blue-600 rounded-full mb-3">
          <CalendarX className="w-8 h-8" />
        </div>
        <h3 className="font-bold text-gray-800 text-base">
          Nenhuma parcela vence neste período.
        </h3>
        <p className="text-gray-500 text-sm mt-1 max-w-xs">
          Tente ampliar o intervalo de datas.
        </p>
      </div>
    );
  }

  return <Skeleton />;
}
