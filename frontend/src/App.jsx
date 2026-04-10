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
import { Target, Search, ChevronRight, LayoutDashboard, Component, BarChart2 } from 'lucide-react';

ChartJS.register(RadialLinearScale, LinearScale, ScatterController, PointElement, LineElement, Filler, Tooltip, Legend);

ChartJS.defaults.font.family = 'Inter';
ChartJS.defaults.color = '#4b5563';

// Distinct pleasant colors for clusters
const clusterColors = [
  { border: 'rgba(59, 130, 246, 1)', bg: 'rgba(59, 130, 246, 0.4)' }, // Blue
  { border: 'rgba(16, 185, 129, 1)', bg: 'rgba(16, 185, 129, 0.4)' }, // Emerald
  { border: 'rgba(245, 158, 11, 1)', bg: 'rgba(245, 158, 11, 0.4)' }, // Amber
  { border: 'rgba(139, 92, 246, 1)', bg: 'rgba(139, 92, 246, 0.4)' }, // Violet
  { border: 'rgba(236, 72, 153, 1)', bg: 'rgba(236, 72, 153, 0.4)' }, // Pink
  { border: 'rgba(14, 165, 233, 1)', bg: 'rgba(14, 165, 233, 0.4)' }, // Sky
];

export default function App() {
  const [gkData, setGkData] = useState([]);
  const [outfieldData, setOutfieldData] = useState([]);
  const [activeTab, setActiveTab] = useState('outfield'); // 'gk' or 'outfield'
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' | 'explorer' | 'visualizer'

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
    <div className="min-h-screen flex flex-col font-sans bg-gray-50/50">
      {/* Top Header */}
      <header className="px-8 py-4 bg-white border-b border-gray-200 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white shadow-sm">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 tracking-tight leading-tight">FootyML</h1>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Player Clustering</p>
            </div>
          </div>

          <nav className="flex space-x-1 ml-4 border-l border-gray-100 pl-8">
            {[
              { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
              { id: 'explorer', name: 'Cluster Explorer', icon: Component },
              { id: 'visualizer', name: 'PCA Map', icon: BarChart2 },
            ].map(view => (
              <button
                key={view.id}
                onClick={() => setCurrentView(view.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${currentView === view.id
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                  }`}
              >
                <view.icon className="w-4 h-4" />
                {view.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex bg-gray-100/80 p-1 rounded-xl shadow-inner border border-gray-200/50">
          <button
            onClick={() => setActiveTab('outfield')}
            className={`px-5 py-1.5 text-sm font-semibold rounded-lg transition-all ${activeTab === 'outfield' ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-900/5' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Outfielders
          </button>
          <button
            onClick={() => setActiveTab('gk')}
            className={`px-5 py-1.5 text-sm font-semibold rounded-lg transition-all ${activeTab === 'gk' ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-900/5' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Goalkeepers
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto p-8">
        {currentView === 'dashboard' && (
          <DashboardView
            premPlayers={premPlayers}
            nonPremPlayers={nonPremPlayers}
            activeTab={activeTab}
            currentData={currentData}
          />
        )}

        {currentView === 'explorer' && (
          <ClusterExplorerView
            data={currentData}
            clusterCount={clusterCount}
            nonPremPlayers={nonPremPlayers}
            premPlayers={premPlayers}
          />
        )}

        {currentView === 'visualizer' && (
          <VisualizerView
            data={currentData}
            clusterCount={clusterCount}
          />
        )}
      </main>
    </div>
  );
}

/* =========================================
   DASHBOARD VIEW
========================================= */
function DashboardView({ premPlayers, nonPremPlayers, activeTab, currentData }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  useEffect(() => {
    setSelectedPlayer(null);
    if (premPlayers.length > 0) {
      setSelectedPlayer(premPlayers[0]);
    }
  }, [activeTab, premPlayers.length]);

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
    const playersInCluster = nonPremPlayers.filter(d => d.Cluster === clusterId);

    featureLabels.forEach(feature => {
      const avg = playersInCluster.reduce((sum, d) => sum + (d[`${feature}_scaled`] || 0), 0) / Math.max(1, playersInCluster.length);
      clusterAverages[feature] = avg;
    });
  }

  const chartData = {
    labels: featureLabels.map(l => l.replace('/90', ' /90')),
    datasets: []
  };

  if (selectedPlayer) {
    const cColor = clusterColors[selectedPlayer.Cluster % clusterColors.length];

    chartData.datasets.push({
      label: `Cluster ${selectedPlayer.Cluster} Average`,
      data: featureLabels.map(f => clusterAverages[f] || 0),
      backgroundColor: 'rgba(209, 213, 219, 0.3)',
      borderColor: 'rgba(156, 163, 175, 1)',
      borderWidth: 2,
      borderDash: [5, 5],
      pointRadius: 0,
    });

    chartData.datasets.push({
      label: `${selectedPlayer.Player} (Prem)`,
      data: featureLabels.map(f => selectedPlayer[`${f}_scaled`] || 0),
      backgroundColor: cColor.bg,
      borderColor: cColor.border,
      borderWidth: 2,
      pointBackgroundColor: '#fff',
      pointBorderColor: cColor.border,
    });
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-140px)]">
      <section className="lg:col-span-4 flex flex-col h-full bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search Premier League players..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Premier League</span>
            <span className="text-xs font-semibold text-gray-400">{filteredData.length} records</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-gray-200">
          {filteredData.map((player, idx) => {
            const isSelected = selectedPlayer?.Player === player.Player;
            const cColor = clusterColors[player.Cluster % clusterColors.length];
            return (
              <div
                key={idx}
                onClick={() => setSelectedPlayer(player)}
                className={`group p-3 mx-2 my-1 rounded-xl flex items-center justify-between cursor-pointer transition-all border ${isSelected ? 'bg-blue-50/50 border-blue-200 shadow-sm' : 'border-transparent hover:bg-gray-50'
                  }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm`} style={{ backgroundColor: isSelected ? cColor.border : '#f3f4f6', color: isSelected ? '#fff' : '#6b7280' }}>
                    {player.Player.charAt(0)}
                  </div>
                  <div>
                    <h3 className={`font-semibold text-sm ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>{player.Player}</h3>
                    <div className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1.5">
                      <span className="font-medium text-gray-800">{player.Squad}</span>
                      <span>•</span>
                      <span className="px-1.5 py-0.5 rounded bg-gray-100 border border-gray-200">Cluster {player.Cluster}</span>
                    </div>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? 'text-blue-500 translate-x-1' : 'text-gray-300 opacity-0 group-hover:opacity-100'}`} />
              </div>
            );
          })}
        </div>
      </section>

      <section className="lg:col-span-8 flex flex-col gap-6">
        {selectedPlayer && (
          <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm flex-1 flex flex-col items-center justify-center relative">
            <div className="absolute top-8 left-8">
              <h2 className="text-3xl font-black text-gray-900 tracking-tight">{selectedPlayer.Player}</h2>
              <div className="mt-2 flex gap-2">
                <span className="px-2.5 py-1 bg-gray-100 rounded-md text-xs font-semibold text-gray-600 border border-gray-200">{selectedPlayer.Squad}</span>
                <span className="px-2.5 py-1 bg-gray-100 rounded-md text-xs font-semibold text-gray-600 border border-gray-200">{selectedPlayer.Pos}</span>
                <span className="px-2.5 py-1 rounded-md text-xs font-bold border" style={{ backgroundColor: clusterColors[selectedPlayer.Cluster % clusterColors.length].bg, borderColor: clusterColors[selectedPlayer.Cluster % clusterColors.length].border, color: clusterColors[selectedPlayer.Cluster % clusterColors.length].border }}>
                  Matched to Cluster {selectedPlayer.Cluster}
                </span>
              </div>
            </div>

            <div className="w-full max-w-2xl h-[500px] mt-16 pt-8">
              <Radar data={chartData} options={{ maintainAspectRatio: false, scales: { r: { ticks: { display: false } } } }} />
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
function ClusterExplorerView({ data, clusterCount, nonPremPlayers, premPlayers }) {
  const [selectedCluster, setSelectedCluster] = useState(0);

  const clusterNumbers = Array.from({ length: clusterCount }, (_, i) => i);
  const currentNonPrem = nonPremPlayers.filter(d => d.Cluster === selectedCluster);
  const currentPrem = premPlayers.filter(d => d.Cluster === selectedCluster);

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 mb-4 tracking-tight">Select Profile Cluster</h2>
        <div className="flex gap-4 overflow-x-auto pb-2">
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
                  backgroundColor: isSelected ? color.border : '#fff',
                  borderColor: isSelected ? color.border : '#e5e7eb',
                  color: isSelected ? '#fff' : '#111827',
                  boxShadow: isSelected ? `0 10px 15px -3px ${color.bg}` : 'none'
                }}
              >
                <div className="text-sm font-bold opacity-80 uppercase tracking-widest mb-1">Cluster {c}</div>
                <div className="text-3xl font-black">{totalPlayers}</div>
                <div className="text-xs mt-1 opacity-80 font-medium">total players</div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-0">
        <PlayerListCard title="European Archetype Players (Non-Prem)" players={currentNonPrem} cluster={selectedCluster} isPrem={false} />
        <PlayerListCard title="Premier League Fits (Prem)" players={currentPrem} cluster={selectedCluster} isPrem={true} />
      </div>
    </div>
  );
}

function PlayerListCard({ title, players, cluster, isPrem }) {
  const cColor = clusterColors[cluster % clusterColors.length];

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col overflow-hidden">
      <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <h3 className="font-bold text-gray-900">{title}</h3>
        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white border border-gray-200 text-gray-500 shadow-sm">{players.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-gray-200">
        {players.map((p, i) => (
          <div key={i} className="flex justify-between items-center p-3 hover:bg-gray-50 border-b border-gray-50 last:border-0 transition-colors">
            <div>
              <div className="font-semibold text-sm text-gray-800">{p.Player}</div>
              <div className="text-[11px] text-gray-500 mt-0.5">{p.Squad} • {p.Comp || 'Premier League'}</div>
            </div>
            {isPrem && <span style={{ color: cColor.border, backgroundColor: cColor.bg }} className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded">MATCHED</span>}
          </div>
        ))}
        {players.length === 0 && (
          <div className="p-8 text-center text-sm text-gray-400">No players found in this cluster.</div>
        )}
      </div>
    </div>
  )
}

/* =========================================
   SCATTER PLOT VISUALIZER
========================================= */
function VisualizerView({ data, clusterCount }) {
  if (data.length === 0 || !('PCA1' in data[0])) {
    return <div className="p-12 text-center text-gray-500">PCA Data is still loading or could not be found...</div>
  }

  // Create datasets for each cluster
  const datasets = [];

  for (let c = 0; c < clusterCount; c++) {
    const cColor = clusterColors[c % clusterColors.length];

    // Non-prem dataset
    const clusterNonPrem = data.filter(d => d.Cluster === c && (String(d.IsPrem).toLowerCase() === 'false' || d.IsPrem === false));
    datasets.push({
      label: `Cluster ${c} Archetypes (Europe)`,
      data: clusterNonPrem.map(d => ({ x: d.PCA1, y: d.PCA2, raw: d })),
      backgroundColor: cColor.bg,
      borderColor: 'transparent',
      pointRadius: 3,
      pointHoverRadius: 5,
    });

    // Prem dataset (star or different shape)
    const clusterPrem = data.filter(d => d.Cluster === c && String(d.IsPrem).toLowerCase() === 'true');
    datasets.push({
      label: `Cluster ${c} Matches (Prem)`,
      data: clusterPrem.map(d => ({ x: d.PCA1, y: d.PCA2, raw: d })),
      backgroundColor: cColor.border,
      borderColor: '#ffffff',
      borderWidth: 1.5,
      pointRadius: 7,
      pointHoverRadius: 9,
      pointStyle: 'circle'
    });
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: { boxWidth: 10, usePointStyle: true, padding: 20, font: { family: 'Inter', size: 12 } }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#111827',
        bodyColor: '#374151',
        borderColor: '#e5e7eb',
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
      x: { grid: { color: 'rgba(0,0,0,0.03)' }, title: { display: true, text: 'Principal Component 1', font: { family: 'Inter' } } },
      y: { grid: { color: 'rgba(0,0,0,0.03)' }, title: { display: true, text: 'Principal Component 2', font: { family: 'Inter' } } }
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm h-[calc(100vh-140px)] flex flex-col">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">2D PCA Cluster Map</h2>
        <p className="text-sm text-gray-500 mt-1">Mathematical projection of multidimensional player stats into 2D space. Squares represent Premier League matches.</p>
      </div>
      <div className="flex-1 min-h-0 relative">
        <Scatter options={options} data={{ datasets }} />
      </div>
    </div>
  )
}
