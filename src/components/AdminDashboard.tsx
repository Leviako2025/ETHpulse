import React, { useState } from 'react';
import { Shield, Users, Gift, Activity, FileText, CheckCircle2, AlertOctagon, Plus, Search, Filter, Lock, Unlock, Eye, RefreshCw, SlidersHorizontal, ArrowUpRight, AlertTriangle } from 'lucide-react';
import { UserPortfolio } from '../types/token';
import { 
  checkTermsCompliance, 
  SOLIDITY_RESERVED_KEYWORDS, 
  REGULATORY_PROHIBITED_TERMS, 
  BRAND_IMPERSONATION_TERMS, 
  RESERVED_PROTOCOL_SYMBOLS 
} from '../utils/complianceValidator';

type AdminRole = 'SUPER_ADMIN' | 'RISK_OPERATOR' | 'COMPLIANCE_AUDITOR';

interface ManagedUser {
  id: string;
  address: string;
  ens?: string;
  tier: 'TIER_1_RETAIL' | 'TIER_2_PRO' | 'TIER_3_WHALE' | 'INSTITUTIONAL';
  status: 'ACTIVE' | 'FLAGGED' | 'SUSPENDED';
  ethBalance: number;
  ctBalance: number;
  tradeCount: number;
  totalVolumeUsd: number;
  lastActive: string;
}

interface AdminLog {
  id: string;
  timestamp: string;
  adminRole: AdminRole;
  action: string;
  target: string;
  details: string;
  severity: 'INFO' | 'WARN' | 'CRITICAL';
}

interface AdminCampaign {
  id: string;
  title: string;
  allocatedPoolCt: number;
  claimedCt: number;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
}

const INITIAL_USERS: ManagedUser[] = [
  {
    id: 'u_1',
    address: '0x71a56bc22998a44d852a3b984180801249b6b92b',
    ens: 'etherpulse.eth',
    tier: 'TIER_2_PRO',
    status: 'ACTIVE',
    ethBalance: 12.5,
    ctBalance: 25000,
    tradeCount: 42,
    totalVolumeUsd: 18540,
    lastActive: 'Just now'
  },
  {
    id: 'u_2',
    address: '0x47ac0fb4f2d84898e4d9e7b4dab3c24507a6d503',
    ens: 'binance-cold.eth',
    tier: 'INSTITUTIONAL',
    status: 'ACTIVE',
    ethBalance: 1450.0,
    ctBalance: 2450000,
    tradeCount: 1420,
    totalVolumeUsd: 4950000,
    lastActive: '3 mins ago'
  },
  {
    id: 'u_3',
    address: '0x00000000219ab540356cbb839cbe05303d7705fa',
    ens: 'eth2-beacon-vault.eth',
    tier: 'TIER_3_WHALE',
    status: 'ACTIVE',
    ethBalance: 320.0,
    ctBalance: 850000,
    tradeCount: 88,
    totalVolumeUsd: 940000,
    lastActive: '12 mins ago'
  },
  {
    id: 'u_4',
    address: '0xde0b295669a9fd93d5f28d9ec85e40f4cb697bae',
    ens: 'suspicious-sandwich.eth',
    tier: 'TIER_1_RETAIL',
    status: 'FLAGGED',
    ethBalance: 3.12,
    ctBalance: 450,
    tradeCount: 310,
    totalVolumeUsd: 62000,
    lastActive: '45 mins ago'
  },
  {
    id: 'u_5',
    address: '0x28c6c06298d514db089934071355e5743bf21d60',
    ens: 'arbitrage-bot.eth',
    tier: 'TIER_2_PRO',
    status: 'ACTIVE',
    ethBalance: 48.2,
    ctBalance: 120000,
    tradeCount: 890,
    totalVolumeUsd: 310000,
    lastActive: '1 hour ago'
  }
];

const INITIAL_LOGS: AdminLog[] = [
  {
    id: 'log_1',
    timestamp: '2026-11-06 15:10:22',
    adminRole: 'SUPER_ADMIN',
    action: 'PARAMETER_UPDATE',
    target: 'CoreToken (CT) Pool Fee',
    details: 'Configured Uniswap V3 concentrated fee tier to 0.30% with 25% CT discount rebate.',
    severity: 'INFO'
  },
  {
    id: 'log_2',
    timestamp: '2026-11-06 14:48:10',
    adminRole: 'RISK_OPERATOR',
    action: 'FLAG_USER',
    target: '0xde0b...7bae',
    details: 'Flagged wallet for high-frequency MEV sandwiching heuristic on CT/ETH pool.',
    severity: 'WARN'
  },
  {
    id: 'log_3',
    timestamp: '2026-11-06 13:30:05',
    adminRole: 'COMPLIANCE_AUDITOR',
    action: 'AUDIT_EXPORT',
    target: 'Full Ledger',
    details: 'Generated compliance export of 1,240 DEX trades against OFAC sanctions screening list.',
    severity: 'INFO'
  }
];

const INITIAL_CAMPAIGNS: AdminCampaign[] = [
  { id: 'ac_1', title: 'Uniswap V3 Dual-Sided LP Incentive', allocatedPoolCt: 250000, claimedCt: 182400, status: 'ACTIVE' },
  { id: 'ac_2', title: 'Genesis Staking Vault Lockup', allocatedPoolCt: 500000, claimedCt: 320000, status: 'ACTIVE' },
  { id: 'ac_3', title: 'Alpha DEX Trading Sprint', allocatedPoolCt: 150000, claimedCt: 94000, status: 'ACTIVE' },
  { id: 'ac_4', title: 'Smart Contract Whitehat Bounty', allocatedPoolCt: 100000, claimedCt: 25000, status: 'PAUSED' }
];

export const AdminDashboard: React.FC<{ currentBlock: number }> = ({ currentBlock }) => {
  const [currentRole, setCurrentRole] = useState<AdminRole>('SUPER_ADMIN');
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'campaigns' | 'monitoring' | 'logs' | 'compliance_registry'>('users');
  
  const [users, setUsers] = useState<ManagedUser[]>(INITIAL_USERS);
  const [logs, setLogs] = useState<AdminLog[]>(INITIAL_LOGS);
  const [campaigns, setCampaigns] = useState<AdminCampaign[]>(INITIAL_CAMPAIGNS);
  const [userSearch, setUserSearch] = useState('');
  const [newCampaignTitle, setNewCampaignTitle] = useState('');
  const [newCampaignPool, setNewCampaignPool] = useState('50000');
  const [isAddingCampaign, setIsAddingCampaign] = useState(false);
  const [campaignError, setCampaignError] = useState<string | null>(null);

  // Toggle user status
  const handleToggleUserStatus = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const nextStatus = u.status === 'ACTIVE' ? 'FLAGGED' : 'ACTIVE';
          // Log action
          const newLog: AdminLog = {
            id: `log_${Date.now()}`,
            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
            adminRole: currentRole,
            action: nextStatus === 'FLAGGED' ? 'FLAG_USER' : 'UNFLAG_USER',
            target: `${u.address.slice(0, 8)}...`,
            details: `User status changed to ${nextStatus} by ${currentRole}`,
            severity: nextStatus === 'FLAGGED' ? 'WARN' : 'INFO'
          };
          setLogs((l) => [newLog, ...l]);
          return { ...u, status: nextStatus };
        }
        return u;
      })
    );
  };

  // Toggle campaign status
  const handleToggleCampaign = (campId: string) => {
    setCampaigns((prev) =>
      prev.map((c) => {
        if (c.id === campId) {
          const nextStatus = c.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
          const newLog: AdminLog = {
            id: `log_${Date.now()}`,
            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
            adminRole: currentRole,
            action: 'CAMPAIGN_STATUS',
            target: c.title,
            details: `Campaign changed to ${nextStatus}`,
            severity: 'INFO'
          };
          setLogs((l) => [newLog, ...l]);
          return { ...c, status: nextStatus };
        }
        return c;
      })
    );
  };

  // Add new campaign with compliance check against reserved/prohibited terms
  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    setCampaignError(null);
    if (!newCampaignTitle.trim()) return;

    // Run terms compliance audit
    const compliance = checkTermsCompliance(newCampaignTitle.trim(), 'CT', '');
    if (!compliance.isCompliant) {
      const violationList = compliance.violations.map(v => `'${v.term}' (${v.category})`).join(', ');
      setCampaignError(`Campaign blocked: Contains reserved/prohibited terms: ${violationList}. EtherPulse strictly enforces zero prohibited securities or EVM reserved keywords.`);
      return;
    }

    const newCamp: AdminCampaign = {
      id: `ac_${Date.now()}`,
      title: newCampaignTitle.trim(),
      allocatedPoolCt: parseInt(newCampaignPool, 10) || 50000,
      claimedCt: 0,
      status: 'ACTIVE'
    };

    setCampaigns((prev) => [newCamp, ...prev]);

    const newLog: AdminLog = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      adminRole: currentRole,
      action: 'CREATE_CAMPAIGN',
      target: newCamp.title,
      details: `Created campaign with pool ${newCamp.allocatedPoolCt.toLocaleString()} CT (Passed Prohibited Terms Policy)`,
      severity: 'INFO'
    };
    setLogs((l) => [newLog, ...l]);

    setNewCampaignTitle('');
    setIsAddingCampaign(false);
  };

  const filteredUsers = users.filter((u) =>
    u.address.toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.ens && u.ens.toLowerCase().includes(userSearch.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Top Admin Controls & Role Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">EtherPulse Admin & Governance Console</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-400 border border-indigo-500/30">
                BLOCK #{currentBlock.toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Role-based management of users, incentive campaigns, circuit breakers, and audit trails
            </p>
          </div>
        </div>

        {/* Role Switcher */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">Role:</span>
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-mono">
            {(['SUPER_ADMIN', 'RISK_OPERATOR', 'COMPLIANCE_AUDITOR'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setCurrentRole(r)}
                className={`px-3 py-1 rounded transition-colors whitespace-nowrap ${
                  currentRole === r
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {r.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Admin Subtabs */}
      <div className="flex border-b border-slate-800 space-x-1 overflow-x-auto">
        {[
          { id: 'users', label: 'User Directory & KYC', icon: Users, count: users.length },
          { id: 'campaigns', label: 'Rewards Management', icon: Gift, count: campaigns.length },
          { id: 'monitoring', label: 'Risk & Circuit Breakers', icon: Activity, count: null },
          { id: 'compliance_registry', label: 'Prohibited Terms Registry', icon: Shield, count: null },
          { id: 'logs', label: 'Admin Activity Logs', icon: FileText, count: logs.length }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold font-mono border-b-2 whitespace-nowrap transition-colors ${
                isActive
                  ? 'border-indigo-500 text-white bg-slate-900/60'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5 text-slate-400" />
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab 1: User Management */}
      {activeSubTab === 'users' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-white">Registered Web3 Wallets & Participants</h3>
              <p className="text-xs text-slate-400">Manage user account statuses, inspect balances, and flag suspicious bots</p>
            </div>

            <div className="relative">
              <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search address or ENS..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">User Address / ENS</th>
                  <th className="py-3 px-4">Tier Bracket</th>
                  <th className="py-3 px-4 text-right">Demo ETH</th>
                  <th className="py-3 px-4 text-right">CoreToken (CT)</th>
                  <th className="py-3 px-4 text-right">Trades</th>
                  <th className="py-3 px-4 text-right">Volume</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <div>
                        <span className="font-sans font-medium text-white block">
                          {u.ens || `${u.address.slice(0, 8)}...${u.address.slice(-6)}`}
                        </span>
                        <span className="text-[10px] text-slate-500">{u.address}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {u.tier.replace('TIER_', '')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-white tabular-nums">
                      {u.ethBalance.toFixed(2)} ETH
                    </td>
                    <td className="py-3 px-4 text-right text-cyan-400 font-semibold tabular-nums">
                      {u.ctBalance.toLocaleString()} CT
                    </td>
                    <td className="py-3 px-4 text-right text-slate-300 tabular-nums">
                      {u.tradeCount}
                    </td>
                    <td className="py-3 px-4 text-right text-emerald-400 tabular-nums">
                      ${u.totalVolumeUsd.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded border font-semibold ${
                          u.status === 'ACTIVE'
                            ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30'
                            : 'bg-rose-950/60 text-rose-400 border-rose-500/30'
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleToggleUserStatus(u.id)}
                        className={`px-2.5 py-1 text-[11px] rounded transition-colors ${
                          u.status === 'ACTIVE'
                            ? 'bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-500/40'
                            : 'bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40'
                        }`}
                      >
                        {u.status === 'ACTIVE' ? 'Flag Bot' : 'Restore'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Rewards Campaign Management */}
      {activeSubTab === 'campaigns' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-white">CoreToken (CT) Reward Campaigns</h3>
              <p className="text-xs text-slate-400">Configure token incentive pools, emission rates, and claim caps</p>
            </div>

            <button
              onClick={() => {
                setIsAddingCampaign(!isAddingCampaign);
                setCampaignError(null);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold font-mono transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Campaign</span>
            </button>
          </div>

          {isAddingCampaign && (
            <form onSubmit={handleCreateCampaign} className="p-4 bg-slate-950 rounded-lg border border-indigo-500/30 space-y-3 font-mono text-xs">
              <h4 className="font-semibold text-white">Create New Incentive Campaign</h4>
              <p className="text-[11px] text-slate-400">
                Notice: Campaign titles are automatically audited. Any Solidity reserved keywords or prohibited securities terms will be rejected.
              </p>

              {campaignError && (
                <div className="p-3 bg-rose-950/40 border border-rose-500/40 rounded-lg text-rose-300 flex items-start gap-2">
                  <AlertOctagon className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{campaignError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Campaign Title:</label>
                  <input
                    type="text"
                    required
                    value={newCampaignTitle}
                    onChange={(e) => {
                      setNewCampaignTitle(e.target.value);
                      setCampaignError(null);
                    }}
                    placeholder="e.g. Q4 Concentrated Liquidity Boost"
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Total Pool CT Allocation:</label>
                  <input
                    type="number"
                    required
                    value={newCampaignPool}
                    onChange={(e) => setNewCampaignPool(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded text-white"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingCampaign(false);
                    setCampaignError(null);
                  }}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded"
                >
                  Deploy Campaign
                </button>
              </div>
            </form>
          )}

          <div className="space-y-3">
            {campaigns.map((camp) => (
              <div key={camp.id} className="p-4 bg-slate-950/60 rounded-lg border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-sans font-semibold text-white">{camp.title}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded border ${
                        camp.status === 'ACTIVE'
                          ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30'
                          : 'bg-amber-950/60 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      {camp.status}
                    </span>
                  </div>
                  <div className="text-slate-400 text-[11px] flex gap-3">
                    <span>Pool: <strong className="text-white">{camp.allocatedPoolCt.toLocaleString()} CT</strong></span>
                    <span>Claimed: <strong className="text-cyan-400">{camp.claimedCt.toLocaleString()} CT</strong></span>
                    <span>Remaining: <strong className="text-slate-300">{(camp.allocatedPoolCt - camp.claimedCt).toLocaleString()} CT</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleCampaign(camp.id)}
                    className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                      camp.status === 'ACTIVE'
                        ? 'bg-amber-950/60 hover:bg-amber-900 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {camp.status === 'ACTIVE' ? 'Pause Campaign' : 'Resume Campaign'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Risk & Circuit Breakers */}
      {activeSubTab === 'monitoring' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Risk Engine & Volatility Circuit Breakers</h3>
            <p className="text-xs text-slate-400">Automated guards against flash loans, abnormal slippage, and price oracle desync</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
            <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Max Trade Slippage</span>
                <span className="text-emerald-400 font-semibold">NORMAL (2.5%)</span>
              </div>
              <p className="text-[11px] text-slate-500">Orders exceeding 2.5% price impact automatically require manual signature.</p>
            </div>

            <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Uniswap V3 Oracle Guard</span>
                <span className="text-emerald-400 font-semibold">SYNCHRONIZED</span>
              </div>
              <p className="text-[11px] text-slate-500">TWAP 30-minute window deviation is &lt;0.08% from spot price.</p>
            </div>

            <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Circuit Breaker Status</span>
                <span className="text-cyan-400 font-semibold">ARMED (ACTIVE)</span>
              </div>
              <p className="text-[11px] text-slate-500">Pauses swaps if price swings &gt;15% within 10 consecutive blocks.</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Prohibited & Reserved Terms Policy Registry */}
      {activeSubTab === 'compliance_registry' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">No Reserved or Prohibited Terms Policy Registry</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                  ENFORCED ON ALL PLATFORM INPUTS
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Active automated filter dictionary blocking Solidity keywords, securities claims, and brand impersonation across token creation, campaigns, and metadata
              </p>
            </div>

            <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded border border-emerald-500/30">
              0 Active Violations
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs">
            {/* Column 1: Solidity Reserved */}
            <div className="space-y-3 p-4 bg-slate-950 rounded-lg border border-slate-800">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="text-white font-semibold">EVM & Solidity Reserved ({SOLIDITY_RESERVED_KEYWORDS.length})</span>
                <span className="text-[10px] text-indigo-400">Compiler Safe</span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans">
                Prevents namespace collision with Solidity language keywords, opcode identifiers, and ABI decoder types.
              </p>
              <div className="flex flex-wrap gap-1 max-h-56 overflow-y-auto pr-1">
                {SOLIDITY_RESERVED_KEYWORDS.map((kw) => (
                  <span key={kw} className="text-[10px] px-1.5 py-0.5 bg-slate-900 border border-slate-800 text-slate-400 rounded">
                    {kw}
                  </span>
                ))}
              </div>
            </div>

            {/* Column 2: Regulatory Prohibited */}
            <div className="space-y-3 p-4 bg-slate-950 rounded-lg border border-slate-800">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="text-white font-semibold">Prohibited Securities Claims ({REGULATORY_PROHIBITED_TERMS.length})</span>
                <span className="text-[10px] text-emerald-400">Howey Test Safe</span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans">
                Blocks deceptive financial terms, guaranteed returns, deposit claims, and investment security designations.
              </p>
              <div className="flex flex-wrap gap-1 max-h-56 overflow-y-auto pr-1">
                {REGULATORY_PROHIBITED_TERMS.map((term) => (
                  <span key={term} className="text-[10px] px-1.5 py-0.5 bg-rose-950/40 border border-rose-500/30 text-rose-300 rounded">
                    {term}
                  </span>
                ))}
              </div>
            </div>

            {/* Column 3: Protected Brand & Symbols */}
            <div className="space-y-3 p-4 bg-slate-950 rounded-lg border border-slate-800">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="text-white font-semibold">Protected Identities & Symbols ({BRAND_IMPERSONATION_TERMS.length + RESERVED_PROTOCOL_SYMBOLS.length})</span>
                <span className="text-[10px] text-cyan-400">Anti-Phishing</span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans">
                Prevents counterfeit tokens from masquerading as canonical protocol foundations, system administrators, or fiat currencies.
              </p>
              <div className="flex flex-wrap gap-1 max-h-56 overflow-y-auto pr-1">
                {[...BRAND_IMPERSONATION_TERMS, ...RESERVED_PROTOCOL_SYMBOLS].map((term) => (
                  <span key={term} className="text-[10px] px-1.5 py-0.5 bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 rounded">
                    {term}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Admin Activity Logs */}
      {activeSubTab === 'logs' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Immutable Administrative Audit Log</h3>
              <p className="text-xs text-slate-400">Cryptographically verifiable log of all admin interventions</p>
            </div>
            <span className="text-xs font-mono text-slate-400">{logs.length} Log Entries</span>
          </div>

          <div className="divide-y divide-slate-800/60 font-mono text-xs">
            {logs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-slate-800/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-[11px]">{log.timestamp}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-400 border border-indigo-500/30">
                      {log.adminRole}
                    </span>
                    <span className="font-semibold text-white">{log.action}</span>
                    <span className="text-slate-400">→ {log.target}</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">{log.details}</p>
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded border self-start sm:self-center font-semibold ${
                    log.severity === 'WARN'
                      ? 'bg-amber-950/60 text-amber-400 border-amber-500/30'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  {log.severity}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
