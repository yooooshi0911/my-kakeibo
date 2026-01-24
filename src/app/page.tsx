'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ReferenceLine, Legend
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { Expense } from '@/types';
import { formatDateShort, getGenreColor, DEFAULT_GENRES } from '@/utils';
// ★修正: Loadingコンポーネントをインポート
import Loading from '@/components/Loading';
// ★修正: X, Plus をインポートに追加
import { Wallet, AlertCircle, TrendingUp, History, RefreshCw, Settings, Trash2, RotateCcw, Clock, ArrowUp, ArrowDown, ExternalLink, X, Plus } from 'lucide-react';

// --- 物理ボタンで並び替え可能なリストアイテム ---
const SortableGenreItem = ({ 
  genre, 
  index,
  totalCount,
  onUpdate, 
  onDelete, 
  onMoveUp, 
  onMoveDown 
}: { 
  genre: string, 
  index: number,
  totalCount: number,
  onUpdate: (val: string) => void, 
  onDelete: () => void, 
  onMoveUp: () => void, 
  onMoveDown: () => void
}) => {
  const [localValue, setLocalValue] = useState(genre);

  useEffect(() => {
    setLocalValue(genre);
  }, [genre]);

  return (
    <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-100 relative">
      <div className="flex flex-col gap-1 mr-1">
        <button 
          onClick={onMoveUp} 
          disabled={index === 0}
          className="p-1 bg-white border border-gray-200 rounded hover:bg-blue-50 text-gray-400 hover:text-blue-500 disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-gray-400"
        >
          <ArrowUp size={12} />
        </button>
        <button 
          onClick={onMoveDown}
          disabled={index === totalCount - 1}
          className="p-1 bg-white border border-gray-200 rounded hover:bg-blue-50 text-gray-400 hover:text-blue-500 disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-gray-400"
        >
           <ArrowDown size={12} />
        </button>
      </div>

      <input 
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={() => {
          if (localValue !== genre) onUpdate(localValue);
        }}
        className="flex-1 bg-transparent font-bold text-sm text-gray-700 focus:outline-none border-b border-transparent focus:border-blue-300 py-1"
      />

      <button onClick={onDelete} className="text-red-300 hover:text-red-500 p-2">
        <Trash2 size={16} />
      </button>
    </div>
  );
};

export default function Home() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [customGenres, setCustomGenres] = useState<string[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [newGenreName, setNewGenreName] = useState('');

  const [isJPY, setIsJPY] = useState(false);
  const [currentRate, setCurrentRate] = useState(160);

  const [activeTab, setActiveTab] = useState<'genre' | 'daily' | 'monthly'>('genre');
  const [selectedChartItem, setSelectedChartItem] = useState<any>(null);
  const [customGenreInput, setCustomGenreInput] = useState<{row: number, val: string} | null>(null);

  const fetchData = useCallback(async (isBackground = false) => {
    if (!isBackground) setRefreshing(true);
    try {
      const resExpenses = await fetch('/api/expenses');
      let dataExpenses = [];
      try {
        dataExpenses = await resExpenses.json();
        if (!Array.isArray(dataExpenses)) dataExpenses = [];
      } catch (e) { console.error(e); }
      setExpenses(dataExpenses);

      const resSettings = await fetch('/api/settings');
      const dataSettings = await resSettings.json();
      if (dataSettings.genres && dataSettings.genres.length > 0) {
        setCustomGenres(dataSettings.genres);
      } else {
        setCustomGenres(DEFAULT_GENRES);
      }

      const resRate = await fetch('https://api.exchangerate-api.com/v4/latest/EUR');
      const dataRate = await resRate.json();
      if (dataRate?.rates?.JPY) setCurrentRate(dataRate.rates.JPY);

    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setSelectedChartItem(null);
  }, [isJPY, activeTab]);

  const saveGenresToApi = async (genres: string[]) => {
    const validGenres = Array.from(new Set(genres.filter(g => g.trim() !== '')));
    await fetch('/api/settings', {
      method: 'POST',
      body: JSON.stringify({ genres: validGenres }),
    });
  };

  const addGenre = () => {
    if (!newGenreName) return;
    if (customGenres.includes(newGenreName)) {
      setNewGenreName('');
      return;
    }
    const updated = [...customGenres, newGenreName];
    setCustomGenres(updated);
    setNewGenreName('');
    saveGenresToApi(updated);
  };

  const removeGenre = (index: number) => {
    const updated = [...customGenres];
    updated.splice(index, 1);
    setCustomGenres(updated);
    saveGenresToApi(updated);
  };

  const updateGenreName = (index: number, newName: string) => {
    const updated = [...customGenres];
    updated[index] = newName;
    setCustomGenres(updated);
    saveGenresToApi(updated);
  };

  const moveGenre = (index: number, direction: 'up' | 'down') => {
    const updated = [...customGenres];
    if (direction === 'up') {
        if (index === 0) return;
        [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    } else {
        if (index === updated.length - 1) return;
        [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    }
    setCustomGenres(updated);
    saveGenresToApi(updated);
  };

  const updateGenre = async (rowNumber: number, genre: string) => {
    setExpenses(prev => prev.map(e => e.rowNumber === rowNumber ? { ...e, genre } : e));
    setCustomGenreInput(null);
    await fetch('/api/expenses', { method: 'POST', body: JSON.stringify({ rowNumber, genre }) });
  };
  
  const saveDescription = async (rowNumber: number, description: string) => {
    await fetch('/api/expenses', { method: 'POST', body: JSON.stringify({ rowNumber, description }) });
  };

  const handleDescriptionChange = (rowNumber: number, newText: string) => {
    setExpenses(prev => prev.map(e => e.rowNumber === rowNumber ? { ...e, description: newText } : e));
  };

  const formatCurrency = (amount: number) => {
    if (isJPY) {
      return `¥${Math.round(amount * currentRate).toLocaleString()}`;
    } else {
      return `€${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
  };

  const formatGraphValue = (value: number) => {
    if (isJPY) {
      return `¥${Math.round(value).toLocaleString()}`;
    } else {
      return `€${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
  };

  const displayGenres = useMemo(() => {
    const distinctCustom = Array.from(new Set(customGenres));
    const existing = new Set(expenses.map(e => e.genre).filter(Boolean));
    const uniqueExisting = Array.from(existing).filter(g => !distinctCustom.includes(g));
    return [...distinctCustom, ...uniqueExisting];
  }, [expenses, customGenres]);

  const parseDate = (dateStr: string) => {
    const match = dateStr.match(/(\d{4})[\/年](\d{1,2})[\/月](\d{1,2})/);
    return match ? new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3])) : new Date();
  };

  const totalAmount = useMemo(() => expenses.reduce((sum, item) => sum + item.amount, 0), [expenses]);
  
  const todayTotal = useMemo(() => {
    const today = new Date();
    return expenses.reduce((sum, item) => {
        const d = parseDate(item.date);
        if (d.getDate() === today.getDate() && 
            d.getMonth() === today.getMonth() && 
            d.getFullYear() === today.getFullYear()) {
            return sum + item.amount;
        }
        return sum;
    }, 0);
  }, [expenses]);
  
  const uncategorized = useMemo(() => expenses.filter(e => !e.genre), [expenses]);
  const recentHistory = useMemo(() => [...expenses].sort((a, b) => b.rowNumber - a.rowNumber).slice(0, 5), [expenses]);
  const rate = isJPY ? currentRate : 1;

  const generateChartData = (groupBy: 'genre' | 'daily' | 'monthly') => {
    const roundIfJPY = (val: number) => isJPY ? Math.round(val) : parseFloat(val.toFixed(2));

    if (groupBy === 'genre') {
      const total = expenses.reduce((sum, e) => sum + e.amount, 0);
      return displayGenres.map(genre => {
        const val = expenses.filter(e => e.genre === genre).reduce((sum, e) => sum + e.amount, 0);
        return { 
          name: genre, 
          value: roundIfJPY(val * rate), 
          percent: total > 0 ? (val / total * 100).toFixed(1) : 0 
        };
      }).filter(d => d.value > 0);
    }
    const map = new Map<string, any>();
    expenses.forEach(e => {
      let key = formatDateShort(e.date);
      if (groupBy === 'monthly') {
        const match = e.date.match(/(\d{4})[\/年](\d{1,2})[\/月]/);
        key = match ? `${match[1]}/${match[2].padStart(2, '0')}` : 'Unknown';
      }
      if (!map.has(key)) map.set(key, { name: key, total: 0 });
      const entry = map.get(key);
      const val = roundIfJPY(e.amount * rate);
      entry[e.genre || '未分類'] = (entry[e.genre || '未分類'] || 0) + val;
      entry.total = (entry.total || 0) + val;
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  };

  const genreData = useMemo(() => generateChartData('genre'), [expenses, displayGenres, rate, isJPY]);
  const dailyData = useMemo(() => generateChartData('daily'), [expenses, rate, isJPY]);
  const monthlyData = useMemo(() => generateChartData('monthly'), [expenses, rate, isJPY]);
  
  const dailyAverage = useMemo(() => dailyData.length ? (dailyData.reduce((s:number, d:any) => s + d.total, 0) / dailyData.length) : 0, [dailyData]);
  const monthlyAverage = useMemo(() => monthlyData.length ? (monthlyData.reduce((s:number, d:any) => s + d.total, 0) / monthlyData.length) : 0, [monthlyData]);

  // ★修正: ローディング画面を別コンポーネントに変更
  if (loading) return <Loading />;

  return (
    <div className="min-h-screen w-full bg-gray-100 flex justify-center items-start overflow-x-hidden">
      
      <main className="w-full max-w-md bg-white min-h-screen shadow-2xl relative font-rounded touch-pan-y overscroll-none pb-24 mx-auto">
        
        {/* --- ジャンル設定モーダル --- */}
        <AnimatePresence>
          {isSettingsOpen && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 50 }}
              className="bg-black/50 flex items-center justify-center p-4 touch-none"
              onClick={() => setIsSettingsOpen(false)}
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl max-h-[80vh] flex flex-col"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold flex items-center gap-2"><Settings size={20} /> ジャンル編集</h2>
                  <button onClick={() => setIsSettingsOpen(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X size={16}/></button>
                </div>
                
                <div className="flex gap-2 mb-4">
                  <input 
                    type="text" 
                    value={newGenreName}
                    onChange={(e) => setNewGenreName(e.target.value)}
                    placeholder="新しいジャンル名"
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                  <button onClick={addGenre} className="bg-blue-500 text-white p-2 rounded-xl hover:bg-blue-600"><Plus size={20}/></button>
                </div>

                <div className="overflow-y-auto space-y-2 pr-1 flex-1 touch-pan-y">
                  <div className="space-y-2">
                    {customGenres.map((g, index) => (
                      <SortableGenreItem 
                        key={`${g}-${index}`}
                        index={index}
                        totalCount={customGenres.length}
                        genre={g} 
                        onUpdate={(val) => updateGenreName(index, val)} 
                        onDelete={() => removeGenre(index)}
                        onMoveUp={() => moveGenre(index, 'up')}
                        onMoveDown={() => moveGenre(index, 'down')}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- ヘッダー --- */}
        <div className="bg-blue-500 p-6 text-white shadow-lg rounded-b-[30px] mb-8 relative overflow-hidden transition-all duration-500">
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-6">
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Wallet className="text-blue-100" /> My Kakeibo
              </h1>
              <div className="flex gap-2">
                <button 
                  onClick={() => fetchData(false)}
                  className={`bg-white/20 backdrop-blur-md p-2 rounded-full hover:bg-white/30 border border-white/30 ${refreshing ? 'animate-spin' : ''}`}
                >
                  <RotateCcw size={16} />
                </button>

                <button 
                  onClick={() => setIsJPY(!isJPY)}
                  className="bg-white/20 backdrop-blur-md px-3 py-2 rounded-full text-xs font-bold flex items-center gap-1 hover:bg-white/30 border border-white/30"
                >
                  <RefreshCw size={12} className={isJPY ? "rotate-180" : ""} /> {isJPY ? 'JPY' : 'EUR'}
                </button>
                <button 
                  onClick={() => setIsSettingsOpen(true)}
                  className="bg-white/20 backdrop-blur-md p-2 rounded-full hover:bg-white/30 border border-white/30"
                >
                  <Settings size={16} />
                </button>
              </div>
            </div>
            
            <div className="flex justify-between items-end">
              <div>
                <div className="text-blue-100 text-xs font-bold mb-1 opacity-80">TOTAL EXPENSES</div>
                <div className="text-4xl font-extrabold tracking-tight">{formatCurrency(totalAmount)}</div>
              </div>
              <div className="text-right">
                <div className="text-blue-100 text-xs font-bold mb-1 opacity-80 flex items-center justify-end gap-1">
                    <Clock size={12} /> TODAY
                </div>
                <div className="text-xl font-bold">{formatCurrency(todayTotal)}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 space-y-10">
          
          {/* --- 未分類 --- */}
          <AnimatePresence>
            {uncategorized.length > 0 && (
              <section>
                <h2 className="text-xs font-bold flex items-center gap-2 mb-4 text-gray-400 uppercase tracking-wider">
                  <AlertCircle className="text-red-400" size={16} /> Uncategorized ({uncategorized.length})
                </h2>
                <div className="space-y-4">
                  {uncategorized.map((item) => (
                    <motion.div
                      key={item.rowNumber}
                      layout
                      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                      className="bg-white p-5 rounded-2xl shadow-sm border border-gray-50 relative overflow-hidden"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-full mr-4">
                          <span className="text-xs text-gray-400 font-bold block mb-1">{formatDateShort(item.date)}</span>
                          <input 
                            type="text" 
                            value={item.description}
                            onChange={(e) => handleDescriptionChange(item.rowNumber, e.target.value)}
                            onBlur={(e) => saveDescription(item.rowNumber, e.target.value)}
                            className="text-lg font-bold text-gray-800 border-b-2 border-transparent focus:border-blue-200 focus:outline-none bg-transparent w-full"
                            placeholder="内容を入力..."
                          />
                        </div>
                        <span className="text-xl font-extrabold text-blue-500 whitespace-nowrap">{formatCurrency(item.amount)}</span>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {customGenres.map(genre => (
                          <button
                            key={genre}
                            onClick={() => updateGenre(item.rowNumber, genre)}
                            className="bg-gray-50 hover:bg-blue-50 text-gray-500 hover:text-blue-600 border border-gray-100 hover:border-blue-200 px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
                          >
                            {genre}
                          </button>
                        ))}
                        
                        {customGenreInput?.row === item.rowNumber ? (
                          <div className="flex items-center gap-1">
                            <input 
                              autoFocus
                              type="text"
                              className="bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold rounded-xl px-3 py-2 w-24 focus:outline-none"
                              placeholder="ジャンル名"
                              value={customGenreInput.val}
                              onChange={(e) => setCustomGenreInput({row: item.rowNumber, val: e.target.value})}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && customGenreInput.val) {
                                  updateGenre(item.rowNumber, customGenreInput.val);
                                }
                              }}
                              onBlur={() => {
                                if(customGenreInput.val) updateGenre(item.rowNumber, customGenreInput.val);
                                else setCustomGenreInput(null);
                              }}
                            />
                          </div>
                        ) : (
                          <button 
                            onClick={() => setCustomGenreInput({row: item.rowNumber, val: ''})}
                            className="flex-shrink-0 bg-blue-50 text-blue-600 border border-blue-100 px-3 py-2 rounded-xl transition-all active:scale-95 flex items-center justify-center"
                          >
                            <Plus size={14} />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}
          </AnimatePresence>

          {/* --- グラフ --- */}
          <section className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-bold flex items-center gap-2 text-gray-400 uppercase tracking-wider"><TrendingUp size={16} className="text-blue-400" /> Analytics</h2>
              <div className="bg-gray-100 p-1 rounded-xl flex gap-1">
                {['genre', 'daily', 'monthly'].map((tab) => (
                  <button key={tab} onClick={() => { setActiveTab(tab as any); setSelectedChartItem(null); }} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold capitalize transition-all ${activeTab === tab ? 'bg-white text-blue-500 shadow-sm' : 'text-gray-400'}`}>{tab}</button>
                ))}
              </div>
            </div>

            <div className="h-72 w-full min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                {activeTab === 'genre' ? (
                  <PieChart>
                    <Pie data={genreData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value">
                      {genreData.map((entry, index) => <Cell key={`cell-${index}`} fill={getGenreColor(entry.name)} stroke="none" />)}
                    </Pie>
                    <RechartsTooltip contentStyle={{borderRadius:'12px', border:'none'}} formatter={(v: any, n: any, p: any) => [formatGraphValue(Number(v)), `${n} (${p.payload.percent}%)`]} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} wrapperStyle={{fontSize: '12px'}} />
                  </PieChart>
                ) : (
                  <BarChart data={activeTab === 'daily' ? dailyData : monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{fontSize:10}} axisLine={false} tickLine={false} dy={10} />
                    <YAxis tick={{fontSize:10}} axisLine={false} tickLine={false} />
                    <RechartsTooltip cursor={{fill:'transparent'}} contentStyle={{borderRadius:'12px', border:'none'}} formatter={(value: any) => formatGraphValue(Number(value))} />
                    {displayGenres.map((genre) => (
                      <Bar key={genre} dataKey={genre} stackId="a" fill={getGenreColor(genre)} radius={[0,0,0,0]}>
                        {(activeTab === 'daily' ? dailyData : monthlyData).map((entry:any, index:number) => (
                          <Cell key={`cell-${index}`} fill={getGenreColor(genre)} onClick={() => setSelectedChartItem(entry)} style={{cursor:'pointer'}} />
                        ))}
                      </Bar>
                    ))}
                    <ReferenceLine y={activeTab === 'daily' ? dailyAverage : monthlyAverage} stroke="#8B5CF6" strokeDasharray="3 3" label={{position:'top', value:`AVG: ${formatGraphValue(activeTab === 'daily' ? dailyAverage : monthlyAverage)}`, fill:'#8B5CF6', fontSize:10, fontWeight:'bold'}} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
            
            <AnimatePresence mode="wait">
              {(activeTab === 'daily' || activeTab === 'monthly') && selectedChartItem && (
                <motion.div 
                  key={selectedChartItem.name}
                  initial={{opacity: 0, height: 0}} animate={{opacity: 1, height: 'auto'}} exit={{opacity: 0, height: 0}}
                  className="mt-4 pt-4 border-t border-dashed border-gray-100"
                >
                  <div className="flex justify-between items-center mb-3 px-1">
                     <div className="text-xs font-bold text-gray-400">{selectedChartItem.name} Breakdown</div>
                     <div className="text-lg font-extrabold text-blue-600">
                        {formatGraphValue(selectedChartItem.total)}
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {displayGenres.map(g => selectedChartItem[g] > 0 && (
                      <div key={g} className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{backgroundColor: getGenreColor(g)}}></div>
                          <span className="text-slate-600 text-xs font-bold">{g}</span>
                        </div>
                        <span className="font-bold text-gray-800">
                          {formatGraphValue(selectedChartItem[g])}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* --- 履歴 --- */}
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-bold flex items-center gap-2 text-gray-400 uppercase tracking-wider"><History size={18} /> History</h2>
              <Link href="/history" className="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-xs font-bold flex items-center gap-1 hover:bg-blue-100">View All <ExternalLink size={12} /></Link>
            </div>
            <div className="bg-white rounded-3xl shadow-sm border border-gray-50 overflow-hidden">
              {recentHistory.map((item, index) => (
                <div key={item.rowNumber} className={`p-4 flex items-center justify-between hover:bg-gray-50 ${index !== recentHistory.length - 1 ? 'border-b border-gray-50' : ''}`}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-gray-700 text-sm">{item.description || 'Unknown'}</span>
                      {item.genre && (
                        <span 
                          className="text-[10px] px-2 py-0.5 rounded-full font-bold text-slate-600" 
                          style={{backgroundColor: getGenreColor(item.genre) + '33'}}
                        >
                          {item.genre}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 font-bold tracking-wide">{formatDateShort(item.date)}</div>
                  </div>
                  <div className="text-right"><span className="font-bold text-gray-800">{formatCurrency(item.amount)}</span></div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}