'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Expense } from '@/types';
// ★修正: 新しい関数と変数をインポート
import { formatDateShort, getGenreColor, DEFAULT_GENRES } from '@/utils';
import { ArrowUpDown, Filter, AlertCircle, Home, RefreshCw } from 'lucide-react';

export default function HistoryPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterGenre, setFilterGenre] = useState<string>('All');
  const [sortKey, setSortKey] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // カスタムジャンル管理
  const [customGenres, setCustomGenres] = useState<string[]>([]);
  
  // 通貨レート (履歴ページでも円換算したい場合用)
  const [isJPY, setIsJPY] = useState(false);
  const [currentRate, setCurrentRate] = useState(160);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. データ取得
        const res = await fetch('/api/expenses');
        const data = await res.json();
        setExpenses(data);

        // 2. ジャンル設定取得
        const resSettings = await fetch('/api/settings');
        const dataSettings = await resSettings.json();
        if (dataSettings.genres && dataSettings.genres.length > 0) {
          setCustomGenres(dataSettings.genres);
        } else {
          setCustomGenres(DEFAULT_GENRES);
        }

        // 3. レート取得
        const resRate = await fetch('https://api.exchangerate-api.com/v4/latest/EUR');
        const dataRate = await resRate.json();
        if (dataRate?.rates?.JPY) setCurrentRate(dataRate.rates.JPY);

      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const updateGenre = async (rowNumber: number, genre: string) => {
    setExpenses(prev => prev.map(e => e.rowNumber === rowNumber ? { ...e, genre } : e));
    await fetch('/api/expenses', { method: 'POST', body: JSON.stringify({ rowNumber, genre }) });
  };
  
  const saveDescription = async (rowNumber: number, description: string) => {
    await fetch('/api/expenses', { method: 'POST', body: JSON.stringify({ rowNumber, description }) });
  };

  const handleDescriptionChange = (rowNumber: number, newText: string) => {
    setExpenses(prev => prev.map(e => e.rowNumber === rowNumber ? { ...e, description: newText } : e));
  };

  // 表示用ジャンルリスト (設定 + 実データにあるもの)
  const displayGenres = useMemo(() => {
    const existing = new Set(expenses.map(e => e.genre).filter(Boolean));
    return Array.from(new Set([...customGenres, ...existing]));
  }, [expenses, customGenres]);

  const uncategorizedItems = useMemo(() => {
    return expenses.filter(e => !e.genre).sort((a, b) => b.rowNumber - a.rowNumber);
  }, [expenses]);

  const historyItems = useMemo(() => {
    let data = expenses.filter(e => e.genre);
    if (filterGenre !== 'All') data = data.filter(e => e.genre === filterGenre);
    
    data.sort((a, b) => {
      if (sortKey === 'amount') return sortOrder === 'asc' ? a.amount - b.amount : b.amount - a.amount;
      // 日付順 (行番号を代理として使用)
      return sortOrder === 'asc' ? a.rowNumber - b.rowNumber : b.rowNumber - a.rowNumber;
    });

    return data;
  }, [expenses, filterGenre, sortKey, sortOrder]);

  const toggleSort = (key: 'date' | 'amount') => {
    if (sortKey === key) setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortOrder('desc'); }
  };

  const formatCurrency = (amount: number) => {
    return isJPY 
      ? `¥${Math.round(amount * currentRate).toLocaleString()}`
      : `€${amount.toLocaleString()}`;
  };

  if (loading) return <div className="flex justify-center items-center h-screen bg-white text-blue-300 font-bold animate-pulse">Loading...</div>;

  return (
    <main className="min-h-screen bg-white pb-24 text-gray-700 font-rounded">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-gray-50 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2.5 bg-gray-50 rounded-full text-gray-500 hover:bg-blue-50 hover:text-blue-500 transition-colors">
            <Home size={20} />
          </Link>
          <h1 className="text-lg font-bold text-gray-800">History</h1>
        </div>
        {/* 通貨切り替えボタン (履歴ページにも追加) */}
        <button 
          onClick={() => setIsJPY(!isJPY)}
          className="bg-gray-100 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 hover:bg-gray-200 transition-all"
        >
          <RefreshCw size={12} className={isJPY ? "rotate-180" : ""} /> {isJPY ? 'JPY' : 'EUR'}
        </button>
      </div>

      <div className="p-5 space-y-8">
        
        {/* Uncategorized Section */}
        <AnimatePresence>
          {uncategorizedItems.length > 0 && (
            <section>
               <h2 className="text-xs font-bold flex items-center gap-2 mb-4 text-gray-400 uppercase tracking-wider">
                <AlertCircle className="text-red-400" size={16} />
                Uncategorized ({uncategorizedItems.length})
              </h2>
              <div className="space-y-4">
                {uncategorizedItems.map((item) => (
                  <motion.div
                    key={item.rowNumber}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, height: 0, marginBottom: 0, transition: { duration: 0.3 } }}
                    className="bg-white p-5 rounded-2xl shadow-[0_4px_20px_-5px_rgba(0,0,0,0.1)] border border-gray-50 relative overflow-hidden"
                  >
                     <div className="flex justify-between items-start mb-4">
                      <div className="w-full mr-4">
                        <span className="text-xs text-gray-400 font-bold block mb-1">{formatDateShort(item.date)}</span>
                        <input 
                          type="text" 
                          value={item.description}
                          onChange={(e) => handleDescriptionChange(item.rowNumber, e.target.value)}
                          onBlur={(e) => saveDescription(item.rowNumber, e.target.value)}
                          className="text-lg font-bold text-gray-800 border-b-2 border-transparent focus:border-blue-200 focus:outline-none bg-transparent w-full transition-colors"
                          placeholder="Tap to edit..."
                        />
                      </div>
                      <span className="text-xl font-extrabold text-blue-500 whitespace-nowrap">
                        {formatCurrency(item.amount)}
                      </span>
                    </div>
                    {/* 改行形式に変更 */}
                    <div className="flex flex-wrap gap-2">
                      {displayGenres.map(genre => (
                        <button
                          key={genre}
                          onClick={() => updateGenre(item.rowNumber, genre)}
                          className="bg-gray-50 hover:bg-blue-50 text-gray-500 hover:text-blue-600 border border-gray-100 hover:border-blue-200 px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
                        >
                          {genre}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          )}
        </AnimatePresence>

        {/* Filter & Sort Controls */}
        <section className="bg-gray-50 p-4 rounded-3xl">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar mb-2">
            <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 bg-white rounded-full text-gray-400 shadow-sm">
              <Filter size={14} />
            </div>
            <button 
              onClick={() => setFilterGenre('All')} 
              className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all shadow-sm ${filterGenre === 'All' ? 'bg-blue-500 text-white' : 'bg-white text-gray-500'}`}
            >All</button>
            {displayGenres.map(g => (
              <button key={g} onClick={() => setFilterGenre(g)} className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all shadow-sm ${filterGenre === g ? 'bg-blue-500 text-white' : 'bg-white text-gray-500'}`}>
                {g}
              </button>
            ))}
          </div>
          <div className="flex gap-6 border-t border-gray-200/50 pt-3 px-2">
             <button onClick={() => toggleSort('date')} className={`flex items-center gap-1 text-xs font-bold ${sortKey === 'date' ? 'text-blue-600' : 'text-gray-400'}`}>
               Date <ArrowUpDown size={12} />
             </button>
             <button onClick={() => toggleSort('amount')} className={`flex items-center gap-1 text-xs font-bold ${sortKey === 'amount' ? 'text-blue-600' : 'text-gray-400'}`}>
               Amount <ArrowUpDown size={12} />
             </button>
          </div>
        </section>

        {/* Full History List */}
        <div className="space-y-3 pb-10">
          <AnimatePresence initial={false}>
          {historyItems.map((item) => (
            <motion.div 
              key={item.rowNumber}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              className="bg-white p-4 rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] border border-gray-50 flex items-center justify-between"
            >
              <div className="flex-1 mr-4">
                <div className="flex items-center gap-2 mb-1">
                  <input 
                    type="text" 
                    value={item.description} 
                    onChange={(e) => handleDescriptionChange(item.rowNumber, e.target.value)}
                    onBlur={(e) => saveDescription(item.rowNumber, e.target.value)}
                    className="font-bold text-gray-700 text-sm bg-transparent focus:outline-none focus:border-b focus:border-blue-200 w-full"
                  />
                  {/* ★修正: getGenreColorを使用 */}
                  <span 
                    className="text-[10px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap"
                    style={{backgroundColor: getGenreColor(item.genre) + '33', color: '#64748b'}}
                  >
                    {item.genre}
                  </span>
                </div>
                <div className="text-xs text-gray-400 font-bold tracking-wide">{formatDateShort(item.date)}</div>
              </div>
              <div className="text-right whitespace-nowrap">
                <span className="font-extrabold text-gray-800">
                  {formatCurrency(item.amount)}
                </span>
              </div>
            </motion.div>
          ))}
          </AnimatePresence>
          {historyItems.length === 0 && (
             <div className="text-center py-20 text-gray-300 font-bold">No history found...</div>
          )}
        </div>
      </div>
    </main>
  );
}