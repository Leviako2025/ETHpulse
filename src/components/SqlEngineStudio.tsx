import React, { useState } from 'react';
import { TokenProfile, SqlDialect, SqlQueryPreset } from '../types/token';
import { SQL_PRESETS } from '../data/sqlQueries';
import { 
  Database, Play, Copy, Check, Download, Code2, Zap, 
  Clock, Server, CheckCircle2, ChevronRight, Sparkles 
} from 'lucide-react';

interface SqlEngineStudioProps {
  token: TokenProfile;
}

export const SqlEngineStudio: React.FC<SqlEngineStudioProps> = ({ token }) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>(SQL_PRESETS[0].id);
  const [selectedDialect, setSelectedDialect] = useState<SqlDialect>('Dune SQL (Trino)');
  const [copied, setCopied] = useState<boolean>(false);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [hasExecuted, setHasExecuted] = useState<boolean>(true);

  const activePreset = SQL_PRESETS.find((p) => p.id === selectedPresetId) || SQL_PRESETS[0];

  // Parameterize SQL with current token details
  const getParameterizedSql = () => {
    let rawSql = activePreset.sqlByDialect[selectedDialect] || '';
    rawSql = rawSql
      .replace(/\{\{token_address\}\}/g, `'${token.address}'`)
      .replace(/@token_address/g, `'${token.address.toLowerCase()}'`)
      .replace(/\{token_address:String\}/g, `'${token.address}'`)
      .replace(/:token_address/g, `'${token.address}'`)
      .replace(/\{\{pool_address\}\}/g, `'${token.pools[0]?.poolAddress || token.address}'`)
      .replace(/@pool_address/g, `'${token.pools[0]?.poolAddress || token.address}'`)
      .replace(/\{pool_address:String\}/g, `'${token.pools[0]?.poolAddress || token.address}'`)
      .replace(/\{\{total_supply\}\}/g, `${token.totalSupplyFormatted.split(' ')[0].replace(/,/g, '')}`)
      .replace(/\{\{token_price_usd\}\}/g, `${token.currentPriceUsd}`);
    return rawSql;
  };

  const currentSql = getParameterizedSql();

  const handleCopy = () => {
    navigator.clipboard.writeText(currentSql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRun = () => {
    setIsRunning(true);
    setHasExecuted(false);
    setTimeout(() => {
      setIsRunning(false);
      setHasExecuted(true);
    }, 450);
  };

  const exportCsv = () => {
    const cols = activePreset.mockResult.columns.join(',');
    const rows = activePreset.mockResult.rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([`${cols}\n${rows}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${token.symbol}_${activePreset.id}_results.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Studio Header & Dialect Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base font-semibold text-white">Web3 Blockchain SQL Studio</h2>
              <span className="text-xs text-slate-400 font-mono">Real-time Analytics Engine</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Production-grade, optimized SQL queries designed for live Ethereum token analytics across leading decentralized data warehouses.
            </p>
          </div>

          {/* Dialect Switcher */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono hidden sm:inline">Engine:</span>
            <div className="flex items-center p-1 bg-slate-950 rounded-lg border border-slate-800 overflow-x-auto scrollbar-none">
              {(['Dune SQL (Trino)', 'Google BigQuery', 'ClickHouse EVM', 'PostgreSQL'] as SqlDialect[]).map((dialect) => (
                <button
                  key={dialect}
                  onClick={() => setSelectedDialect(dialect)}
                  className={`px-3 py-1.5 text-xs font-mono rounded whitespace-nowrap transition-colors ${
                    selectedDialect === dialect
                      ? 'bg-slate-800 text-white font-semibold shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {dialect}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Studio Split: Presets Sidebar + Query Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Presets Sidebar (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="px-2 py-1 text-xs font-mono text-slate-400 uppercase tracking-wider">
            Optimized Query Presets
          </div>

          <div className="space-y-1.5">
            {SQL_PRESETS.map((preset) => {
              const isActive = preset.id === selectedPresetId;
              return (
                <button
                  key={preset.id}
                  onClick={() => {
                    setSelectedPresetId(preset.id);
                    setHasExecuted(true);
                  }}
                  className={`w-full text-left p-3 rounded-lg transition-colors border ${
                    isActive
                      ? 'bg-indigo-950/40 border-indigo-500/40 text-white'
                      : 'bg-slate-950/40 border-transparent hover:bg-slate-800/60 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider">
                      {preset.category}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {preset.complexity}
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-white mt-1">{preset.title}</h4>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {preset.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* SQL Editor & Live Execution Panel (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Code Editor Container */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            {/* Editor Top Bar */}
            <div className="px-5 py-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-semibold text-white font-mono">
                  {activePreset.title} · {selectedDialect}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono rounded-md transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy SQL'}</span>
                </button>

                <button
                  onClick={handleRun}
                  disabled={isRunning}
                  className="flex items-center gap-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold font-mono rounded-md transition-colors"
                >
                  <Play className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
                  <span>{isRunning ? 'Executing...' : 'Run Query'}</span>
                </button>
              </div>
            </div>

            {/* SQL Code Viewport */}
            <div className="p-4 bg-slate-950 overflow-x-auto max-h-80">
              <pre className="text-xs font-mono text-slate-200 leading-relaxed selection:bg-indigo-500/30">
                <code>{currentSql}</code>
              </pre>
            </div>

            {/* Performance Tips Footer */}
            <div className="p-3 bg-slate-950/60 border-t border-slate-800/80 text-xs text-slate-400 font-mono flex items-start gap-2">
              <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-300">Optimization Note:</strong>{' '}
                <span>{activePreset.performanceTips[0]}</span>
              </div>
            </div>
          </div>

          {/* Query Execution Result Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold text-white">Execution Output</span>
                {hasExecuted && (
                  <span className="text-[11px] font-mono text-slate-400">
                    ({activePreset.mockResult.rowsAffected} rows · {activePreset.mockResult.executionTimeMs}ms)
                  </span>
                )}
              </div>

              {hasExecuted && (
                <button
                  onClick={exportCsv}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-slate-400 hover:text-white text-xs font-mono rounded hover:bg-slate-800 transition-colors"
                  title="Export results as CSV"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              )}
            </div>

            {isRunning ? (
              <div className="p-12 text-center text-xs text-slate-400 font-mono">
                <Play className="w-5 h-5 text-indigo-400 animate-spin mx-auto mb-2" />
                <span>Running query on indexed Ethereum block logs...</span>
              </div>
            ) : hasExecuted ? (
              <div className="overflow-x-auto max-h-72">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase text-[10px]">
                    <tr>
                      {activePreset.mockResult.columns.map((col, idx) => (
                        <th key={idx} className="py-2.5 px-4 font-semibold whitespace-nowrap">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {activePreset.mockResult.rows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-800/40">
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="py-2.5 px-4 whitespace-nowrap tabular-nums">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
