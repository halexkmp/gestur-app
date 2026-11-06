import { AuditVerdict as Verdict, VerdictTone } from '../../lib/tirolesaVerdict';

interface AuditVerdictProps {
  verdict: Verdict;
  onOpenSetup: () => void;
}

const TONE_CLASSES: Record<VerdictTone, string> = {
  grey: 'bg-gray-100 border-gray-200 text-gray-700',
  blue: 'bg-blue-50 border-blue-200 text-blue-800',
  amber: 'bg-amber-50 border-amber-200 text-amber-800',
  red: 'bg-red-50 border-red-200 text-red-800',
  green: 'bg-green-50 border-green-200 text-green-800',
};

export default function AuditVerdict({ verdict, onOpenSetup }: AuditVerdictProps) {
  return (
    <div className={`border rounded-xl p-5 ${TONE_CLASSES[verdict.tone]}`}>
      <p className="text-xl font-bold">{verdict.title}</p>
      {verdict.detail && <p className="text-sm mt-1">{verdict.detail}</p>}
      {verdict.kind === 'setup' && (
        <button onClick={onOpenSetup} className="text-sm font-medium underline mt-1">
          Ir para Configuração
        </button>
      )}
    </div>
  );
}
