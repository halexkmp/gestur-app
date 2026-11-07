import { useState } from 'react';
import { ClipboardCheck, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTirolesaAudit } from '../hooks/useTirolesaAudit';
import { useTirolesaSetup } from '../hooks/useTirolesaSetup';
import AuditTab from './Tirolesa/AuditTab';
import SetupTab from './Tirolesa/SetupTab';

type TirolesaTab = 'audit' | 'setup';

export default function Tirolesa() {
  const { isSuperAdmin } = useAuth();

  if (!isSuperAdmin) return null;

  return <TirolesaPage />;
}

function TirolesaPage() {
  const [activeTab, setActiveTab] = useState<TirolesaTab>('audit');
  const audit = useTirolesaAudit();
  const setup = useTirolesaSetup();

  const openTab = (tab: TirolesaTab) => {
    // A product linked in Configuração changes the audit's figures.
    if (tab === 'audit' && activeTab !== 'audit') audit.reload();
    setActiveTab(tab);
  };

  const tabClass = (tab: TirolesaTab) =>
    `px-6 py-3 text-sm font-medium transition flex items-center gap-2 border-b-2 ${
      activeTab === tab
        ? 'border-blue-600 text-blue-600'
        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
    }`;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Auditoria Tirolesa</h1>
        <p className="text-gray-600 mt-1">Auditoria diária das descidas</p>
      </div>

      <div className="flex border-b border-gray-200">
        <button onClick={() => openTab('audit')} className={tabClass('audit')}>
          <ClipboardCheck className="w-4 h-4" /> Auditoria
        </button>
        <button onClick={() => openTab('setup')} className={tabClass('setup')}>
          <Settings className="w-4 h-4" /> Configuração
        </button>
      </div>

      <div className={activeTab === 'audit' ? undefined : 'hidden'}>
        <AuditTab audit={audit} setup={setup} onOpenSetup={() => openTab('setup')} />
      </div>
      <div className={activeTab === 'setup' ? undefined : 'hidden'}>
        <SetupTab setup={setup} />
      </div>
    </div>
  );
}
