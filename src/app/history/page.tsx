'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Expense } from '@/types';
import { formatDateShort, getGenreColor, DEFAULT_GENRES } from '@/utils';
import { ArrowUpDown, Filter, AlertCircle, Home, RefreshCw, Calendar, ArrowUp, ArrowDown } from 'lucide-react';

export default function HistoryPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  
  // フィルター & ソート設定
  const [filterGenre, setFilterGenre] = useState<string>('All');
  const [filterMonth, setFilterMonth] = useState<string>('All');
  
  const [sortKey, setSortKey] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const [customGenres, setCustomGenres] = useState<string[]>([]);
  
  // 通貨レート
  const [isJPY, setIsJPY] = useState(false);
  const [currentRate, setCurrentRate] = useState(160);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. データ取得 (エラー対策済み)
        const res = await fetch('/api/expenses');
        let data = [];
        try {
            data = await res.json();
            if (!Array.isArray(data)) data = [];
        } catch (e) { console.error(e); }
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

  // 表示用ジャンルリスト
  const displayGenres = useMemo(() => {
    const existing = new Set(expenses.map(e => e.genre).filter(Boolean));
    return Array.from(new Set([...customGenres, ...Array.from(existing)]));
  }, [expenses, customGenres]);

  // 月のリスト（データが存在する月のみ抽出）
  const monthList = useMemo(() => {
    const months = new Set(expenses.map(e => {
        const d = new Date(e.date);
        return isNaN(d.getTime()) ? null : `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}`;
    }).filter(Boolean));
    return Array.from(months).sort().reverse() as string[];
  }, [expenses]);

  // 未分類アイテム（フィルターに関わらず常に表示）
  const uncategorizedItems = useMemo(() => {
    return expenses.filter(e => !e.genre).sort((a, b) => b.rowNumber - a.rowNumber);
  }, [expenses]);

  // 履歴リスト（フィルター＆ソート適用）
  const historyItems = useMemo(() => {
    // ジャンルがあるものだけを履歴リストの対象にする
    let data = expenses.filter(e => e.genre); 

    // 1. ジャンルフィルター
    if (filterGenre !== 'All') {
        data = data.filter(e => e.genre === filterGenre);
    }
    
    // 2. 月フィルター
    if (filterMonth !== 'All') {
        data = data.filter(e => {
            const d = new Date(e.date);
            const m = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}`;
            return m === filterMonth;
        });
    }
    
    // 3. ソート
    data.sort((a, b) => {
      if (sortKey === 'amount') {
          return sortOrder === 'asc' ? a.amount - b.amount : b.amount - a.amount;
      }
      // 日付順 (行番号を代理として使用すると安定)
      return sortOrder === 'asc' ? a.rowNumber - b.rowNumber : b.rowNumber - a.rowNumber;
    });

    return data;
  }, [expenses, filterGenre, filterMonth, sortKey, sortOrder]);

  const toggleSort = (key: 'date' | 'amount') => {
    if (sortKey === key) {
        setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else { 
        setSortKey(key); 
        setSortOrder('desc'); 
    }
  };

  // 通貨フォーマット（円換算対応）
  const formatCurrency = (amount: number) => {
    if (isJPY) {
      return `¥${Math.round(amount * currentRate).toLocaleString()}`;
    } else {
      return `€${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-screen bg-gray-50 text-blue-400 font-bold animate-pulse">
        Loading...
    </div>
  );

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
        <button 
          onClick={() => setIsJPY(!isJPY)}
          className="bg-gray-100 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 hover:bg-gray-200 transition-all"
        >
          <RefreshCw size={12} className={isJPY ? "rotate-180" : ""} /> {isJPY ? 'JPY' : 'EUR'}
        </button>
      </div>

      <div className="p-5 space-y-6">
        
        {/* Uncategorized Section (常に表示) */}
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
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
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

        {/* --- Controls Section --- */}
        <section className="bg-gray-50 p-4 rounded-3xl space-y-4">
          
          {/* 月選択 & ソートボタン */}
          <div className="flex justify-between items-center">
            {/* 月選択プルダウン */}
            <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <select 
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                    className="pl-9 pr-8 py-2 bg-white border border-gray-200 rounded-full text-xs font-bold text-gray-600 focus:outline-none focus:border-blue-400 appearance-none shadow-sm"
                >
                    <option value="All">All Months</option>
                    {monthList.map(m => (
                        <option key={m} value={m}>{m}</option>
                    ))}
                </select>
            </div>

            {/* ソート切り替え */}
            <div className="flex gap-2">
                <button 
                    onClick={() => toggleSort('date')} 
                    className={`flex items-center gap-1 px-3 py-2 rounded-full text-xs font-bold transition-all ${sortKey === 'date' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}
                >
                    Date 
                    {sortKey === 'date' && (sortOrder === 'desc' ? <ArrowDown size={12}/> : <ArrowUp size={12}/>)}
                </button>
                <button 
                    onClick={() => toggleSort('amount')} 
                    className={`flex items-center gap-1 px-3 py-2 rounded-full text-xs font-bold transition-all ${sortKey === 'amount' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}
                >
                    Amount
                    {sortKey === 'amount' && (sortOrder === 'desc' ? <ArrowDown size={12}/> : <ArrowUp size={12}/>)}
                </button>
            </div>
          </div>

          {/* 横スクロールジャンルリスト (スクロールバー用の余白 pb-2 を追加) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 bg-white rounded-full text-gray-400 shadow-sm">
              <Filter size={14} />
            </div>
            <button 
              onClick={() => setFilterGenre('All')} 
              className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all shadow-sm ${filterGenre === 'All' ? 'bg-blue-500 text-white' : 'bg-white text-gray-500'}`}
            >All</button>
            {displayGenres.map(g => (
              <button 
                key={g} 
                onClick={() => setFilterGenre(g)} 
                className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all shadow-sm ${filterGenre === g ? 'bg-blue-500 text-white' : 'bg-white text-gray-500'}`}
              >
                {g}
              </button>
            ))}
          </div>

        </section>

        {/* History List */}
        <div className="space-y-3 pb-10">
          <AnimatePresence initial={false} mode="popLayout">
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
             <div className="text-center py-20 text-gray-300 font-bold flex flex-col items-center">
                 <Filter size={32} className="opacity-20 mb-2"/>
                 No history found for this filter.
             </div>
          )}
        </div>
      </div>
    </main>
  );
}