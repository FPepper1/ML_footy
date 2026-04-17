import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  LinearScale,
  ScatterController,
} from 'chart.js';
import { Radar, Scatter } from 'react-chartjs-2';
import { Search, ChevronRight, LayoutDashboard, Component, BarChart2, Sun, Moon } from 'lucide-react';
import { translations } from './translations';

ChartJS.register(RadialLinearScale, LinearScale, ScatterController, PointElement, LineElement, Filler, Tooltip, Legend);

ChartJS.defaults.font.family = 'Inter';

const clusterColors = [
  { border: 'rgba(59, 130, 246, 1)', bg: 'rgba(59, 130, 246, 0.4)' },
  { border: 'rgba(16, 185, 129, 1)', bg: 'rgba(16, 185, 129, 0.4)' },
  { border: 'rgba(245, 158, 11, 1)', bg: 'rgba(245, 158, 11, 0.4)' },
  { border: 'rgba(139, 92, 246, 1)', bg: 'rgba(139, 92, 246, 0.4)' },
  { border: 'rgba(236, 72, 153, 1)', bg: 'rgba(236, 72, 153, 0.4)' },
  { border: 'rgba(14, 165, 233, 1)', bg: 'rgba(14, 165, 233, 0.4)' },
];

const getFlagEmoji = (nationStr) => {
  if (!nationStr) return '🏳️';
  const parts = typeof nationStr === 'string' ? nationStr.split(' ') : [];
  if (parts.length === 0) return '🏳️';
  let code = parts[0].toLowerCase();
  if (code === 'eng') return '🏴󠁧󠁢󠁥󠁮󠁧󠁿';
  if (code === 'wal') return '🏴󠁧󠁢󠁷󠁬󠁳󠁿';
  if (code === 'sco') return '🏴󠁧󠁢󠁳󠁣󠁴󠁿';
  if (code === 'nir') return '🏴󠁧󠁢󠁮󠁩󠁲󠁿';
  if (code.length === 2) {
    return [...code.toUpperCase()].map(c => String.fromCodePoint(c.charCodeAt(0) + 127397)).join('');
  }
  return '🏳️';
};

export default function App() {
  const [gkData, setGkData] = useState([]);
  const [outfieldData, setOutfieldData] = useState([]);
  const [activeTab, setActiveTab] = useState('outfield');
  const [currentView, setCurrentView] = useState('dashboard');
  
  const [language, setLanguage] = useState('en');
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark');
      ChartJS.defaults.color = '#94a3b8';
    } else {
      document.body.classList.remove('dark');
      ChartJS.defaults.color = '#4b5563';
    }
  }, [isDarkMode]);

  const t = (key) => translations[language]?.[key] || translations['en'][key];

  useEffect(() => {
    Papa.parse('/gk_clustered.csv', {
      download: true,
      header: true,
      dynamicTyping: true,
      complete: (results) => setGkData(results.data.filter((row) => row.Player)),
    });

    Papa.parse('/outfield_clustered.csv', {
      download: true,
      header: true,
      dynamicTyping: true,
      complete: (results) => setOutfieldData(results.data.filter((row) => row.Player)),
    });
  }, []);

  const currentData = activeTab === 'gk' ? gkData : outfieldData;
  const premPlayers = currentData.filter(d => String(d.IsPrem).toLowerCase() === 'true');
  const nonPremPlayers = currentData.filter(d => String(d.IsPrem).toLowerCase() === 'false' || d.IsPrem === false);

  const clusterCount = new Set(currentData.map(d => d.Cluster)).size;

  return (
    <div className="min-h-screen flex flex-col font-sans bg-gray-50/50 dark:bg-slate-900 transition-colors duration-300">
      {/* Top Header */}
      <header className="px-8 py-4 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between sticky top-0 z-50 shadow-sm transition-colors duration-300">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-sm border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shrink-0">
              <img src="/football_logo.png" alt="Logo" className={`w-full h-full object-cover p-1 ${isDarkMode ? 'invert opacity-90' : ''}`} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight leading-tight">{t('app_title')}</h1>
              <p className="text-[10px] text-gray-400 dark:text-slate-400 font-bold uppercase tracking-wider">{t('app_subtitle')}</p>
            </div>
          </div>

          <nav className="flex space-x-1 ml-4 border-l border-gray-100 dark:border-slate-800 pl-8">
            {[
              { id: 'dashboard', name: t('nav_dashboard'), icon: LayoutDashboard },
              { id: 'explorer', name: t('nav_explorer'), icon: Component },
              { id: 'visualizer', name: t('nav_visualizer'), icon: BarChart2 },
            ].map(view => (
              <button
                key={view.id}
                onClick={() => setCurrentView(view.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${currentView === view.id
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
                  }`}
              >
                <view.icon className="w-4 h-4" />
                {view.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 border-r border-gray-200 dark:border-slate-700 pr-5">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm font-medium rounded-lg px-2 py-1.5 focus:outline-none dark:text-white transition-colors"
            >
              <option value="en">🇬🇧 EN</option>
              <option value="pt-PT">🇵🇹 PT</option>
              <option value="de">🇩🇪 DE</option>
              <option value="es">🇪🇸 ES</option>
              <option value="fr">🇫🇷 FR</option>
              <option value="zh">🇨🇳 ZH</option>
            </select>
            
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-all shadow-sm"
              aria-label="Toggle Dark Mode"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex bg-gray-100/80 dark:bg-slate-800 p-1 rounded-xl shadow-inner border border-gray-200/50 dark:border-slate-700">
            <button
              onClick={() => setActiveTab('outfield')}
              className={`px-5 py-1.5 text-sm font-semibold rounded-lg transition-all ${activeTab === 'outfield' ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm ring-1 ring-gray-900/5 dark:ring-0' : 'text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
            >
              {t('tab_outfield')}
            </button>
            <button
              onClick={() => setActiveTab('gk')}
              className={`px-5 py-1.5 text-sm font-semibold rounded-lg transition-all ${activeTab === 'gk' ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm ring-1 ring-gray-900/5 dark:ring-0' : 'text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
            >
              {t('tab_gk')}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto p-8">
        {currentView === 'dashboard' && (
          <DashboardView
            premPlayers={premPlayers}
            currentData={currentData}
            t={t}
            isDarkMode={isDarkMode}
          />
        )}

        {currentView === 'explorer' && (
          <ClusterExplorerView
            data={currentData}
            clusterCount={clusterCount}
            nonPremPlayers={nonPremPlayers}
            premPlayers={premPlayers}
            t={t}
          />
        )}

        {currentView === 'visualizer' && (
          <VisualizerView
            data={currentData}
            clusterCount={clusterCount}
            t={t}
            isDarkMode={isDarkMode}
          />
        )}
      </main>
    </div>
  );
}

/* =========================================
   DASHBOARD VIEW
========================================= */
function DashboardView({ premPlayers, currentData, t, isDarkMode }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  useEffect(() => {
    setSelectedPlayer(null);
    if (premPlayers.length > 0) {
      setSelectedPlayer(premPlayers[0]);
    }
  }, [premPlayers.length, currentData, premPlayers]);

  const filteredData = premPlayers.filter(d =>
    searchQuery.trim() === '' || d.Player.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getFeatures = (dataList) => {
    if (dataList.length === 0) return [];
    return Object.keys(dataList[0])
      .filter(key => key.endsWith('_scaled') && key !== 'PCA1_scaled' && key !== 'PCA2_scaled')
      .map(key => key.replace('_scaled', ''));
  };

  const featureLabels = getFeatures(currentData);

  const clusterAverages = {};
  if (featureLabels.length > 0 && selectedPlayer !== null) {
    const clusterId = selectedPlayer.Cluster;
    const playersInCluster = currentData.filter(d => d.Cluster === clusterId && (String(d.IsPrem).toLowerCase() === 'false' || d.IsPrem === false));

    featureLabels.forEach(feature => {
      const avg = playersInCluster.reduce((sum, d) => sum + (d[`${feature}_scaled`] || 0), 0) / Math.max(1, playersInCluster.length);
      clusterAverages[feature] = avg;
    });
  }

  const chartData = {
    labels: featureLabels.map(l => l.replace('/90', ' /90')),
    datasets: []
  };

  let closestPlayers = [];

  if (selectedPlayer) {
    const cColor = clusterColors[selectedPlayer.Cluster % clusterColors.length];

    chartData.datasets.push({
      label: `Cluster ${selectedPlayer.Cluster} Average`,
      data: featureLabels.map(f => clusterAverages[f] || 0),
      backgroundColor: isDarkMode ? 'rgba(148, 163, 184, 0.2)' : 'rgba(209, 213, 219, 0.3)',
      borderColor: isDarkMode ? 'rgba(100, 116, 139, 1)' : 'rgba(156, 163, 175, 1)',
      borderWidth: 2,
      borderDash: [5, 5],
      pointRadius: 0,
    });

    chartData.datasets.push({
      label: `${selectedPlayer.Player} (${t('prem')})`,
      data: featureLabels.map(f => selectedPlayer[`${f}_scaled`] || 0),
      backgroundColor: cColor.bg,
      borderColor: cColor.border,
      borderWidth: 2,
      pointBackgroundColor: isDarkMode ? '#1e293b' : '#fff',
      pointBorderColor: cColor.border,
    });

    // Calculate nearest neighbors in cluster
    if (featureLabels.length > 0) {
      const allClusterPlayers = currentData.filter(d => 
        d.Cluster === selectedPlayer.Cluster && 
        d.Player !== selectedPlayer.Player &&
        (String(d.IsPrem).toLowerCase() === 'false' || d.IsPrem === false)
      );
      const playersWithDistances = allClusterPlayers.map(p => {
        let sumSquaredDiffs = 0;
        featureLabels.forEach(f => {
          const val1 = selectedPlayer[`${f}_scaled`] || 0;
          const val2 = p[`${f}_scaled`] || 0;
          sumSquaredDiffs += Math.pow(val1 - val2, 2);
        });
        return { player: p, distance: Math.sqrt(sumSquaredDiffs) };
      });
      playersWithDistances.sort((a, b) => a.distance - b.distance);
      closestPlayers = playersWithDistances.slice(0, 3).map(item => item.player);
    }
  }

  const radarOptions = { 
    maintainAspectRatio: false, 
    scales: { 
      r: { 
        ticks: { display: false },
        grid: { color: isDarkMode ? '#334155' : 'rgba(0,0,0,0.06)' },
        angleLines: { color: isDarkMode ? '#334155' : 'rgba(0,0,0,0.06)' },
        pointLabels: { color: isDarkMode ? '#94a3b8' : '#6b7280', font: { family: 'Inter', size: 11 } }
      } 
    },
    plugins: {
      legend: { labels: { color: isDarkMode ? '#cbd5e1' : '#4b5563' } }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-140px)]">
      <section className="lg:col-span-4 flex flex-col h-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden transition-colors">
        <div className="p-5 border-b border-gray-100 dark:border-slate-700 flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder={t('search_placeholder')}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            />
          </div>
          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">{t('prem_league')}</span>
            <span className="text-xs font-semibold text-gray-400 dark:text-slate-500">{filteredData.length} {t('records_label')}</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-slate-700">
          {filteredData.map((player, idx) => {
            const isSelected = selectedPlayer?.Player === player.Player;
            const cColor = clusterColors[player.Cluster % clusterColors.length];
            return (
              <div
                key={idx}
                onClick={() => setSelectedPlayer(player)}
                className={`group p-3 mx-2 my-1 rounded-xl flex items-center justify-between cursor-pointer transition-all border ${isSelected ? 'bg-blue-50/50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 shadow-sm' : 'border-transparent hover:bg-gray-50 dark:hover:bg-slate-700/50'
                  }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors`} style={{ backgroundColor: isSelected ? cColor.border : (isDarkMode ? '#334155' : '#f3f4f6'), color: isSelected ? '#fff' : (isDarkMode ? '#94a3b8' : '#6b7280') }}>
                    {player.Player.charAt(0)}
                  </div>
                  <div>
                    <h3 className={`font-semibold text-sm transition-colors ${isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-slate-300'}`}>{getFlagEmoji(player.Nation)} {player.Player}</h3>
                    <div className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5 transition-colors">
                      <span className="font-medium text-gray-800 dark:text-slate-300">{player.Squad}</span>
                      <span>•</span>
                      <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700">Cluster {player.Cluster}</span>
                    </div>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? 'text-blue-500 dark:text-blue-400 translate-x-1' : 'text-gray-300 dark:text-slate-600 opacity-0 group-hover:opacity-100'}`} />
              </div>
            );
          })}
        </div>
      </section>

      <section className="lg:col-span-8 flex flex-col gap-6">
        {selectedPlayer && (
          <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-8 shadow-sm flex-1 flex flex-col relative overflow-hidden transition-colors">
            <div className="mb-6 flex-shrink-0">
              <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                <span className="text-2xl">{getFlagEmoji(selectedPlayer.Nation)}</span>
                {selectedPlayer.Player}
              </h2>
              <div className="mt-2 flex gap-2">
                <span className="px-2.5 py-1 bg-gray-100 dark:bg-slate-900 rounded-md text-xs font-semibold text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-700 transition-colors">{selectedPlayer.Squad}</span>
                <span className="px-2.5 py-1 bg-gray-100 dark:bg-slate-900 rounded-md text-xs font-semibold text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-700 transition-colors">{selectedPlayer.Pos}</span>
                <span className="px-2.5 py-1 rounded-md text-xs font-bold border transition-colors" style={{ backgroundColor: clusterColors[selectedPlayer.Cluster % clusterColors.length].bg, borderColor: clusterColors[selectedPlayer.Cluster % clusterColors.length].border, color: isDarkMode ? '#fff' : clusterColors[selectedPlayer.Cluster % clusterColors.length].border }}>
                  {t('matched_to')} {selectedPlayer.Cluster}
                </span>
              </div>
            </div>

            <div className="flex flex-col xl:flex-row items-center gap-8 flex-1 min-h-[400px]">
              <div className="flex-1 w-full max-w-xl h-full min-h-[350px]">
                <Radar data={chartData} options={radarOptions} />
              </div>
              
              <div className="w-full xl:w-72 bg-gray-50 dark:bg-slate-900/50 rounded-xl p-5 border border-gray-200 dark:border-slate-700 flex-shrink-0 self-stretch xl:self-auto overflow-y-auto transition-colors">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Search className="w-4 h-4 text-gray-500 dark:text-slate-400" />
                  {t('closest_matches')}
                </h3>
                <div className="space-y-3">
                  {closestPlayers.map((p, idx) => (
                    <div key={idx} className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-gray-200 dark:border-slate-600 shadow-sm flex flex-col transition-colors">
                      <div className="font-semibold text-gray-900 dark:text-white text-sm">{getFlagEmoji(p.Nation)} {p.Player}</div>
                      <div className="text-[11px] text-gray-500 dark:text-slate-400 mt-1 flex justify-between items-center">
                        <span className="truncate mr-2">{p.Squad}</span>
                        <span className={`font-bold px-1.5 py-0.5 rounded transition-colors ${String(p.IsPrem).toLowerCase() === 'true' ? 'bg-blue-100 dark:bg-blue-900 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300' : 'bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300'}`}>{String(p.IsPrem).toLowerCase() === 'true' ? t('prem') : t('non_prem')}</span>
                      </div>
                    </div>
                  ))}
                  {closestPlayers.length === 0 && (
                    <div className="text-sm text-gray-500 dark:text-slate-400">{t('no_other_players')}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

/* =========================================
   CLUSTER EXPLORER VIEW
========================================= */
function ClusterExplorerView({ data, clusterCount, nonPremPlayers, premPlayers, t }) {
  const [selectedCluster, setSelectedCluster] = useState(0);

  const clusterNumbers = Array.from({ length: clusterCount }, (_, i) => i);
  const currentNonPrem = nonPremPlayers.filter(d => d.Cluster === selectedCluster);
  const currentPrem = premPlayers.filter(d => d.Cluster === selectedCluster);

  const generateClusterDescription = () => {
    if (currentNonPrem.length === 0) return t('no_players');
    const featureLabels = Object.keys(data[0] || {}).filter(key => key.endsWith('_scaled') && key !== 'PCA1_scaled' && key !== 'PCA2_scaled');
    if (featureLabels.length === 0) return '';
    const means = {};
    featureLabels.forEach(f => {
      means[f] = currentNonPrem.reduce((sum, d) => sum + (d[f] || 0), 0) / currentNonPrem.length;
    });
    const sortedFeatures = Object.entries(means).sort((a, b) => b[1] - a[1]);
    const best = sortedFeatures.slice(0, 2).map(x => x[0].replace('_scaled', '').replace('/90', ' /90')).join(' & ');
    const worst = sortedFeatures.slice(-2).reverse().map(x => x[0].replace('_scaled', '').replace('/90', ' /90')).join(' & ');
    return `${t('characterized_by_high')} ${best}. ${t('lower_in')} ${worst}.`;
  };

  const description = generateClusterDescription();

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-6 shadow-sm transition-colors">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3 tracking-tight">{t('select_profile')}</h2>
        <p className="text-sm text-gray-500 dark:text-slate-400 mb-5 font-medium bg-gray-50 dark:bg-slate-900/50 p-3 rounded-lg border border-gray-100 dark:border-slate-700/50 shadow-inner">{description}</p>
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-slate-700">
          {clusterNumbers.map(c => {
            const isSelected = selectedCluster === c;
            const color = clusterColors[c % clusterColors.length];
            const totalPlayers = data.filter(d => d.Cluster === c).length;
            return (
              <div
                key={c}
                onClick={() => setSelectedCluster(c)}
                className="flex-shrink-0 cursor-pointer min-w-[200px] rounded-xl border p-5 transition-all"
                style={{
                  backgroundColor: isSelected ? color.border : 'inherit',
                  borderColor: isSelected ? color.border : 'inherit',
                  color: isSelected ? '#fff' : 'inherit',
                  boxShadow: isSelected ? `0 10px 15px -3px ${color.bg}` : 'none'
                }}
              >
                <div className={`text-sm font-bold opacity-80 uppercase tracking-widest mb-1 ${!isSelected ? 'text-gray-900 dark:text-white' : ''}`}>Cluster {c}</div>
                <div className={`text-3xl font-black ${!isSelected ? 'text-gray-900 dark:text-white' : ''}`}>{totalPlayers}</div>
                <div className={`text-xs mt-1 opacity-80 font-medium ${!isSelected ? 'text-gray-500 dark:text-slate-400' : ''}`}>{t('total_players')}</div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-0">
        <PlayerListCard title={t('arch_eu')} players={currentNonPrem} cluster={selectedCluster} isPrem={false} t={t} />
        <PlayerListCard title={t('arch_prem')} players={currentPrem} cluster={selectedCluster} isPrem={true} t={t} />
      </div>
    </div>
  );
}

function PlayerListCard({ title, players, cluster, isPrem, t }) {
  const cColor = clusterColors[cluster % clusterColors.length];

  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-sm flex flex-col overflow-hidden transition-colors">
      <div className="p-5 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50/50 dark:bg-slate-900/50 transition-colors">
        <h3 className="font-bold text-gray-900 dark:text-white">{title}</h3>
        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 text-gray-500 dark:text-slate-300 shadow-sm transition-colors">{players.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-slate-700">
        {players.map((p, i) => (
          <div key={i} className="flex justify-between items-center p-3 hover:bg-gray-50 dark:hover:bg-slate-700/50 border-b border-gray-50 dark:border-slate-700/50 last:border-0 transition-colors">
            <div>
              <div className="font-semibold text-sm text-gray-800 dark:text-slate-200">{getFlagEmoji(p.Nation)} {p.Player}</div>
              <div className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">{p.Squad} • {p.Comp || t('prem_league')}</div>
            </div>
            {isPrem && <span style={{ color: cColor.border, backgroundColor: cColor.bg }} className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded border border-transparent dark:border-current dark:opacity-90">{t('matched_badge')}</span>}
          </div>
        ))}
        {players.length === 0 && (
          <div className="p-8 text-center text-sm text-gray-400 dark:text-slate-500">{t('no_players')}</div>
        )}
      </div>
    </div>
  )
}

/* =========================================
   SCATTER PLOT VISUALIZER
========================================= */
function VisualizerView({ data, clusterCount, t, isDarkMode }) {
  if (data.length === 0 || !('PCA1' in data[0])) {
    return <div className="p-12 text-center text-gray-500 dark:text-slate-400">{t('pca_loading')}</div>
  }

  const datasets = [];

  for (let c = 0; c < clusterCount; c++) {
    const cColor = clusterColors[c % clusterColors.length];

    const clusterNonPrem = data.filter(d => d.Cluster === c && (String(d.IsPrem).toLowerCase() === 'false' || d.IsPrem === false));
    datasets.push({
      label: `Cluster ${c} (${t('non_prem')})`,
      data: clusterNonPrem.map(d => ({ x: d.PCA1, y: d.PCA2, raw: d })),
      backgroundColor: cColor.bg,
      borderColor: 'transparent',
      pointRadius: 3,
      pointHoverRadius: 5,
    });

    const clusterPrem = data.filter(d => d.Cluster === c && String(d.IsPrem).toLowerCase() === 'true');
    datasets.push({
      label: `Cluster ${c} (${t('prem')})`,
      data: clusterPrem.map(d => ({ x: d.PCA1, y: d.PCA2, raw: d })),
      backgroundColor: isDarkMode ? cColor.border : cColor.bg,
      borderColor: isDarkMode ? '#1e293b' : '#ffffff',
      borderWidth: 1.5,
      pointRadius: 7,
      pointHoverRadius: 9,
      pointStyle: 'rectRounded'
    });
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: { color: isDarkMode ? '#cbd5e1' : '#4b5563', boxWidth: 10, usePointStyle: true, padding: 20, font: { family: 'Inter', size: 12 } }
      },
      tooltip: {
        backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        titleColor: isDarkMode ? '#f8fafc' : '#111827',
        bodyColor: isDarkMode ? '#e2e8f0' : '#374151',
        borderColor: isDarkMode ? '#475569' : '#e5e7eb',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: (ctx) => {
            const player = ctx.raw.raw;
            return `${player.Player} (${player.Squad}) - Cluster ${player.Cluster}`;
          }
        }
      }
    },
    scales: {
      x: { grid: { color: isDarkMode ? '#334155' : 'rgba(0,0,0,0.03)' }, title: { display: true, text: 'Principal Component 1', font: { family: 'Inter' }, color: isDarkMode ? '#94a3b8' : '#6b7280' }, ticks: { color: isDarkMode ? '#94a3b8' : '#6b7280' } },
      y: { grid: { color: isDarkMode ? '#334155' : 'rgba(0,0,0,0.03)' }, title: { display: true, text: 'Principal Component 2', font: { family: 'Inter' }, color: isDarkMode ? '#94a3b8' : '#6b7280' }, ticks: { color: isDarkMode ? '#94a3b8' : '#6b7280' } }
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-8 shadow-sm h-[calc(100vh-140px)] flex flex-col transition-colors">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{t('pca_title')}</h2>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{t('pca_desc')}</p>
      </div>
      <div className="flex-1 min-h-0 relative">
        <Scatter options={options} data={{ datasets }} />
      </div>
    </div>
  )
}
