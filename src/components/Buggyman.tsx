import { useState } from 'react';
import { Users, BarChart3, CalendarClock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import PartnersTab from './Buggyman/PartnersTab';
import SummaryTab from './Buggyman/SummaryTab';
import UpcomingTab from './Buggyman/UpcomingTab';

type BuggymanTab = 'partners' | 'summary' | 'upcoming';

export default function Buggyman() {
  const { isSuperAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<BuggymanTab>('partners');
  // Tabs are mounted on first visit and then kept mounted (hidden when
  // inactive), so their date range, filters, sorting and search survive tab
  // switches. Unmounting would reset the range on every switch.
  const [visited, setVisited] = useState<Set<BuggymanTab>>(new Set(['partners']));

  const openTab = (tab: BuggymanTab) => {
    setVisited((previous) =>
      previous.has(tab) ? previous : new Set(previous).add(tab)
    );
    setActiveTab(tab);
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
        <button onClick={() => openTab('partners')} className={tabClass('partners')}>
          <Users className="w-4 h-4" />
          Bugueiros
        </button>
        {isSuperAdmin && (
          <button onClick={() => openTab('summary')} className={tabClass('summary')}>
            <BarChart3 className="w-4 h-4" />
            Resumo
          </button>
        )}
        {isSuperAdmin && (
          <button onClick={() => openTab('upcoming')} className={tabClass('upcoming')}>
            <CalendarClock className="w-4 h-4" />
            A receber
          </button>
        )}
      </div>

      <div className={activeTab === 'partners' ? undefined : 'hidden'}>
        <PartnersTab />
      </div>

      {isSuperAdmin && visited.has('summary') && (
        <div className={activeTab === 'summary' ? undefined : 'hidden'}>
          <SummaryTab />
        </div>
      )}

      {isSuperAdmin && visited.has('upcoming') && (
        <div className={activeTab === 'upcoming' ? undefined : 'hidden'}>
          <UpcomingTab />
        </div>
      )}
    </div>
  );
}
