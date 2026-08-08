import { useState } from 'react';
import { Users, BarChart3 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import PartnersTab from './Buggyman/PartnersTab';
import SummaryTab from './Buggyman/SummaryTab';

type BuggymanTab = 'partners' | 'summary';

export default function Buggyman() {
  const { isSuperAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<BuggymanTab>('partners');
  // The summary tab is mounted on first visit and then kept mounted (hidden
  // when inactive), so its date range, sorting and search survive tab switches.
  // Unmounting it would reset the range on every switch.
  const [summaryVisited, setSummaryVisited] = useState(false);

  const openSummary = () => {
    setSummaryVisited(true);
    setActiveTab('summary');
  };

  const tabClass = (tab: BuggymanTab) =>
    `px-6 py-3 text-sm font-medium transition flex items-center gap-2 border-b-2 ${
      activeTab === tab
        ? 'border-blue-600 text-blue-600'
        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
    }`;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Bugueiros</h1>
        <p className="text-gray-600 mt-1">Gerencie os bugueiros e suas informações</p>
      </div>

      <div className="flex border-b border-gray-200">
        <button onClick={() => setActiveTab('partners')} className={tabClass('partners')}>
          <Users className="w-4 h-4" />
          Bugueiros
        </button>
        {isSuperAdmin && (
          <button onClick={openSummary} className={tabClass('summary')}>
            <BarChart3 className="w-4 h-4" />
            Resumo
          </button>
        )}
      </div>

      <div className={activeTab === 'partners' ? undefined : 'hidden'}>
        <PartnersTab />
      </div>

      {isSuperAdmin && summaryVisited && (
        <div className={activeTab === 'summary' ? undefined : 'hidden'}>
          <SummaryTab />
        </div>
      )}
    </div>
  );
}
