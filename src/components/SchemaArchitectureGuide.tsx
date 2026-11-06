import React, { useState } from 'react';
import { SCHEMA_TABLES, MISSING_DATA_SOURCES } from '../data/schemaMetadata';
import { 
  Table, Database, AlertCircle, CheckCircle2, 
  ExternalLink, ArrowRight, Layers, FileSpreadsheet, Server, Zap 
} from 'lucide-react';

export const SchemaArchitectureGuide: React.FC = () => {
  const [selectedTable, setSelectedTable] = useState<string>(SCHEMA_TABLES[0].tableName);

  const activeTable = SCHEMA_TABLES.find((t) => t.tableName === selectedTable) || SCHEMA_TABLES[0];

  return (
    <div className="space-y-6">
      {/* Intro & Production Architecture Blueprint Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base font-semibold text-white">Database Schema & Ingestion Blueprint</h2>
              <span className="text-xs text-slate-400 font-mono">Real-time Ethereum Indexer</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Production schema specifications, column definitions, index tuning, and honest data source gap analysis for high-throughput ERC-20 token telemetry.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300">
              6 Core Tables
            </span>
            <span className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300">
              5 Identified Missing Sources
            </span>
          </div>
        </div>

        {/* Real-time Ingestion Pipeline Diagram */}
        <div className="mt-5 pt-4 border-t border-slate-800">
          <span className="text-xs font-semibold text-slate-300 block mb-3 font-mono">
            Recommended Production Data Pipeline Architecture:
          </span>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800">
              <span className="text-[10px] text-indigo-400 font-semibold block">01. INGESTION LAYER</span>
              <span className="text-white font-medium block mt-1">Ethereum RPC Node</span>
              <span className="text-slate-400 text-[11px] block mt-0.5">Alchemy / Infura / Nethermind WebSocket (<code className="text-slate-300">eth_subscribe("logs")</code>)</span>
            </div>

            <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800">
              <span className="text-[10px] text-cyan-400 font-semibold block">02. STREAM PROCESSOR</span>
              <span className="text-white font-medium block mt-1">Kafka / SubSquid</span>
              <span className="text-slate-400 text-[11px] block mt-0.5">Decodes ABI topics, joins USD price oracles, computes rolling metrics</span>
            </div>

            <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800">
              <span className="text-[10px] text-amber-400 font-semibold block">03. DATA WAREHOUSE</span>
              <span className="text-white font-medium block mt-1">ClickHouse / PostgreSQL</span>
              <span className="text-slate-400 text-[11px] block mt-0.5">Partitioned column-store with materialized views for fast 15m OHLCV aggregation</span>
            </div>

            <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800">
              <span className="text-[10px] text-emerald-400 font-semibold block">04. SERVING LAYER</span>
              <span className="text-white font-medium block mt-1">GraphQL / WebSocket API</span>
              <span className="text-slate-400 text-[11px] block mt-0.5">Pushes new blocks and whale transfer alerts directly to the live dashboard UI</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tables Explorer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Table Selector (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="px-2 py-1 text-xs font-mono text-slate-400 uppercase tracking-wider">
            Indexed Schema Tables
          </div>

          <div className="space-y-1.5">
            {SCHEMA_TABLES.map((tbl) => {
              const isActive = tbl.tableName === selectedTable;
              return (
                <button
                  key={tbl.tableName}
                  onClick={() => setSelectedTable(tbl.tableName)}
                  className={`w-full text-left p-3 rounded-lg transition-colors border ${
                    isActive
                      ? 'bg-indigo-950/40 border-indigo-500/40 text-white'
                      : 'bg-slate-950/40 border-transparent hover:bg-slate-800/60 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-white">
                      {tbl.tableName}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {tbl.columns.length} cols
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                    {tbl.description}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-[10px] font-mono text-slate-500">
                    <span>Cadence: {tbl.updateCadence}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Table Columns & Indexes (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            {/* Table Details Header */}
            <div className="p-5 border-b border-slate-800 bg-slate-950/40">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-semibold text-white font-mono">{activeTable.tableName}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{activeTable.description}</p>
                </div>
                <div className="text-xs font-mono text-slate-400">
                  <span>PK: ({activeTable.primaryKey.join(', ')})</span>
                  {activeTable.partitionKey && (
                    <span className="ml-3 text-indigo-400">Partition: {activeTable.partitionKey}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Column Definitions Grid */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Column Name</th>
                    <th className="py-2.5 px-4 font-semibold">Data Type</th>
                    <th className="py-2.5 px-4 font-semibold">Data Origin / Source</th>
                    <th className="py-2.5 px-4 font-semibold">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {activeTable.columns.map((col) => (
                    <tr key={col.name} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-4 font-semibold text-white">
                        <span className="flex items-center gap-1.5">
                          {col.name}
                          {col.isPrimary && <span className="text-[10px] text-amber-400">(PK)</span>}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-indigo-300">{col.type}</td>
                      <td className="py-2.5 px-4">
                        <span className={
                          col.source.includes('Missing') 
                            ? 'text-rose-400 font-semibold' 
                            : col.source.includes('RPC') 
                            ? 'text-emerald-400' 
                            : 'text-slate-300'
                        }>
                          {col.source}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-400 font-sans text-xs">{col.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Suggested Indexes */}
            <div className="p-4 bg-slate-950/80 border-t border-slate-800">
              <span className="text-xs font-semibold text-slate-300 block mb-2 font-mono">
                Recommended Database Indexes:
              </span>
              <div className="space-y-1 font-mono text-xs text-slate-400">
                {activeTable.suggestedIndexes.map((idx, i) => (
                  <div key={i} className="p-1.5 bg-slate-900 rounded border border-slate-800/60 text-slate-300 select-all">
                    {idx}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Missing Data Sources & Honest Gap Analysis Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-semibold text-white">
              Data Gap Analysis & Integration Recommendations
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Raw Ethereum event logs only store byte arrays, topics, and integer token amounts. Building an enterprise-grade real-time token platform requires enriching these raw events with the following missing data sources:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {MISSING_DATA_SOURCES.map((gap, idx) => (
            <div key={idx} className="p-4 bg-slate-950/80 rounded-lg border border-slate-800 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-xs font-semibold text-white">{gap.dataPoint}</h4>
                <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${
                  gap.currentState.includes('Missing') ? 'bg-rose-950/60 text-rose-300 border border-rose-500/30' : 'bg-amber-950/60 text-amber-300 border border-amber-500/30'
                }`}>
                  {gap.currentState}
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {gap.businessImpact}
              </p>

              <div className="pt-2 border-t border-slate-800/80 text-xs font-mono space-y-1">
                <div>
                  <span className="text-slate-500">Recommended Source: </span>
                  <span className="text-emerald-400 font-semibold">{gap.recommendedSource}</span>
                </div>
                <div>
                  <span className="text-slate-500">Ingestion Strategy: </span>
                  <span className="text-slate-300">{gap.implementationStrategy}</span>
                </div>
                <div className="p-2 bg-slate-900 rounded border border-slate-800/60 text-[11px] text-indigo-300 select-all">
                  {gap.exampleCallOrEndpoint}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
