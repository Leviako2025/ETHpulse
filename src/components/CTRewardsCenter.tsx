import React, { useState } from 'react';
import { Gift, Award, CheckCircle2, Clock, Sparkles, AlertTriangle, ArrowRight, TrendingUp, ShieldAlert, Coins, Users, Check } from 'lucide-react';
import { UserPortfolio } from '../types/token';

interface RewardCampaign {
  id: string;
  title: string;
  description: string;
  category: 'STAKING' | 'LIQUIDITY' | 'TRADING_VOLUME' | 'COMMUNITY' | 'BUG_BOUNTY';
  rewardAmountCt: number;
  rewardPoints: number;
  progressPercent: number;
  status: 'ACTIVE' | 'CLAIMABLE' | 'CLAIMED' | 'UPCOMING';
  endsInDays: number;
  totalPoolCt: number;
  participantsCount: number;
  requirements: string[];
}

interface RewardHistoryItem {
  id: string;
  campaignTitle: string;
  pointsEarned: number;
  ctGranted: number;
  claimedAt: string;
  status: 'CONFIRMED' | 'SETTLING';
  txHash: string;
}

interface CTRewardsCenterProps {
  portfolio: UserPortfolio;
  onClaimReward: (ctAmount: number, points: number, campaignTitle: string) => void;
  currentBlock: number;
}

const INITIAL_CAMPAIGNS: RewardCampaign[] = [
  {
    id: 'camp_1',
    title: 'Uniswap V3 Concentrated Liquidity Incentive',
    description: 'Provide dual-sided liquidity into the CT/ETH 0.30% fee tier pool to earn continuous CT protocol rewards.',
    category: 'LIQUIDITY',
    rewardAmountCt: 750,
    rewardPoints: 1200,
    progressPercent: 100,
    status: 'CLAIMABLE',
    endsInDays: 14,
    totalPoolCt: 250000,
    participantsCount: 3840,
    requirements: ['Supply at least 0.5 ETH in CT/ETH Pool', 'Hold liquidity active for 72+ hours']
  },
  {
    id: 'camp_2',
    title: 'Alpha DEX Trader Volume Tier II',
    description: 'Execute $2,500+ in simulated DEX trading volume across any EtherPulse market pairs this week.',
    category: 'TRADING_VOLUME',
    rewardAmountCt: 500,
    rewardPoints: 850,
    progressPercent: 78,
    status: 'ACTIVE',
    endsInDays: 4,
    totalPoolCt: 150000,
    participantsCount: 1420,
    requirements: ['Execute 5+ swap orders', 'Total trading volume > $2,500 USD']
  },
  {
    id: 'camp_3',
    title: 'CoreToken (CT) Genesis Staking Vault',
    description: 'Lock CT in the governance timelock contract to participate in fee share distribution and DAO votes.',
    category: 'STAKING',
    rewardAmountCt: 1200,
    rewardPoints: 2400,
    progressPercent: 100,
    status: 'CLAIMABLE',
    endsInDays: 32,
    totalPoolCt: 500000,
    participantsCount: 5920,
    requirements: ['Stake min 1,000 CT', 'Vote on active proposal CIP-04']
  },
  {
    id: 'camp_4',
    title: 'On-Chain Security Vulnerability Disclosure',
    description: 'Report potential edge cases in the CoreToken ERC-20 permit implementation or DEX slippage calculation.',
    category: 'BUG_BOUNTY',
    rewardAmountCt: 5000,
    rewardPoints: 10000,
    progressPercent: 30,
    status: 'ACTIVE',
    endsInDays: 45,
    totalPoolCt: 100000,
    participantsCount: 18,
    requirements: ['Verified whitehat submission', 'Zero-day audit validation']
  },
  {
    id: 'camp_5',
    title: 'Decentralized Community Ambassador Sprint',
    description: 'Participate in testnet benchmarking and assist new users in onboarding to EtherPulse DEX.',
    category: 'COMMUNITY',
    rewardAmountCt: 350,
    rewardPoints: 500,
    progressPercent: 0,
    status: 'UPCOMING',
    endsInDays: 12,
    totalPoolCt: 75000,
    participantsCount: 0,
    requirements: ['Connect Web3 wallet', 'Submit testnet feedback survey']
  }
];

const INITIAL_HISTORY: RewardHistoryItem[] = [
  {
    id: 'hist_1',
    campaignTitle: 'Testnet Launchpad Early Adopter Airdrop',
    pointsEarned: 500,
    ctGranted: 250,
    claimedAt: '2026-11-04 14:22',
    status: 'CONFIRMED',
    txHash: '0x9a3e14728bce82e99b00fa4476a445dceaa9681b'
  },
  {
    id: 'hist_2',
    campaignTitle: 'ERC-2612 Permit Gasless Signature Tester',
    pointsEarned: 350,
    ctGranted: 150,
    claimedAt: '2026-11-02 09:15',
    status: 'CONFIRMED',
    txHash: '0x327bf001fa884ca9037be38917e75ccbb414167a'
  }
];

export const CTRewardsCenter: React.FC<CTRewardsCenterProps> = ({
  portfolio,
  onClaimReward,
  currentBlock
}) => {
  const [campaigns, setCampaigns] = useState<RewardCampaign[]>(INITIAL_CAMPAIGNS);
  const [history, setHistory] = useState<RewardHistoryItem[]>(INITIAL_HISTORY);
  const [demoRewardPoints, setDemoRewardPoints] = useState<number>(3450);
  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const [notification, setNotification] = useState<string | null>(null);

  const handleClaim = (campaign: RewardCampaign) => {
    if (campaign.status !== 'CLAIMABLE') return;

    onClaimReward(campaign.rewardAmountCt, campaign.rewardPoints, campaign.title);
    setDemoRewardPoints((prev) => prev + campaign.rewardPoints);

    // Update campaign status
    setCampaigns((prev) =>
      prev.map((c) => (c.id === campaign.id ? { ...c, status: 'CLAIMED' } : c))
    );

    // Add to history
    const newHistItem: RewardHistoryItem = {
      id: `hist_${Date.now()}`,
      campaignTitle: campaign.title,
      pointsEarned: campaign.rewardPoints,
      ctGranted: campaign.rewardAmountCt,
      claimedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      status: 'CONFIRMED',
      txHash: `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`
    };
    setHistory((prev) => [newHistItem, ...prev]);

    setNotification(`Successfully claimed +${campaign.rewardAmountCt.toLocaleString()} CT and +${campaign.rewardPoints} points!`);
    setTimeout(() => setNotification(null), 4000);
  };

  const filteredCampaigns = campaigns.filter((c) => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'CLAIMABLE') return c.status === 'CLAIMABLE';
    if (activeFilter === 'ACTIVE') return c.status === 'ACTIVE';
    return c.category === activeFilter;
  });

  return (
    <div className="space-y-6">
      {/* Crucial Security / Disclaimer Notice Banner */}
      <div className="bg-slate-900 border border-amber-500/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-white font-semibold">Demo Sandbox Environment & Ecosystem Points</h4>
            <p className="text-slate-400 text-[11px] mt-0.5">
              EtherPulse Reward Points and CoreToken (CT) balances displayed here are demo utility tokens on the Ethereum testnet. They do not constitute financial instruments or real fiat currency.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="font-mono text-[11px] text-amber-400 bg-amber-950/60 px-2.5 py-1 rounded border border-amber-500/20">
            Current Block #{currentBlock.toLocaleString()}
          </span>
        </div>
      </div>

      {notification && (
        <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-xl p-3 text-xs text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{notification}</span>
          </div>
          <span className="font-mono text-[10px] text-emerald-400">CREDITED TO WALLET</span>
        </div>
      )}

      {/* Rewards Center KPI Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Demo Reward Points</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-2xl font-bold font-mono text-white tabular-nums mt-1 block">
            {demoRewardPoints.toLocaleString()} PTS
          </span>
          <span className="text-xs text-amber-400 font-mono mt-1 block">
            Tier III Ambassador Rank
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Claimable CT Rewards</span>
            <Gift className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="text-2xl font-bold font-mono text-cyan-400 tabular-nums mt-1 block">
            {campaigns
              .filter((c) => c.status === 'CLAIMABLE')
              .reduce((acc, c) => acc + c.rewardAmountCt, 0)
              .toLocaleString()} CT
          </span>
          <span className="text-xs text-slate-400 font-mono mt-1 block">
            ≈ ${(campaigns.filter((c) => c.status === 'CLAIMABLE').reduce((acc, c) => acc + c.rewardAmountCt, 0) * 2.48).toFixed(2)} USD value
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Your CT Balance</span>
            <Coins className="w-4 h-4 text-indigo-400" />
          </div>
          <span className="text-2xl font-bold font-mono text-white tabular-nums mt-1 block">
            {portfolio.demoCtBalance.toLocaleString()} CT
          </span>
          <span className="text-xs text-emerald-400 font-mono mt-1 block">
            -25% DEX Fee Discount Active
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Ecosystem Rewards Pool</span>
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <span className="text-2xl font-bold font-mono text-purple-400 tabular-nums mt-1 block">
            1,075,000 CT
          </span>
          <span className="text-xs text-slate-400 font-mono mt-1 block">
            11,202 Total Participants
          </span>
        </div>
      </div>

      {/* Campaign Listings Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Active Reward Campaigns & Tasks</h3>
            <p className="text-xs text-slate-400">Complete on-chain tasks and simulated liquidity contributions to earn CoreTokens</p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono">
            {[
              { id: 'ALL', label: 'All Tasks' },
              { id: 'CLAIMABLE', label: 'Claimable' },
              { id: 'ACTIVE', label: 'In Progress' },
              { id: 'LIQUIDITY', label: 'Liquidity' },
              { id: 'STAKING', label: 'Staking' }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                className={`px-3 py-1 rounded transition-colors whitespace-nowrap ${
                  activeFilter === f.id
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-slate-800/70">
          {filteredCampaigns.map((camp) => (
            <div key={camp.id} className="p-5 hover:bg-slate-800/30 transition-colors">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-indigo-950 text-indigo-400 border border-indigo-500/30">
                      {camp.category}
                    </span>
                    <h4 className="text-sm font-semibold text-white">{camp.title}</h4>
                    <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Ends in {camp.endsInDays}d
                    </span>
                  </div>

                  <p className="text-xs text-slate-400">{camp.description}</p>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-slate-400 pt-1">
                    <span>Pool: <strong className="text-slate-200">{camp.totalPoolCt.toLocaleString()} CT</strong></span>
                    <span>·</span>
                    <span>Participants: <strong className="text-slate-200">{camp.participantsCount.toLocaleString()}</strong></span>
                  </div>

                  {/* Requirements List */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {camp.requirements.map((req, i) => (
                      <span key={i} className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 flex items-center gap-1">
                        <Check className="w-3 h-3 text-indigo-400" />
                        {req}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Right side: Rewards & Claim Action */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800/50">
                  <div className="text-left sm:text-right font-mono">
                    <div className="text-sm font-bold text-cyan-400 tabular-nums">
                      +{camp.rewardAmountCt.toLocaleString()} CT
                    </div>
                    <div className="text-[11px] text-amber-400 tabular-nums">
                      +{camp.rewardPoints.toLocaleString()} Points
                    </div>
                  </div>

                  {camp.status === 'CLAIMABLE' && (
                    <button
                      onClick={() => handleClaim(camp)}
                      className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-lg shadow-xs transition-all flex items-center gap-1.5"
                    >
                      <Gift className="w-3.5 h-3.5" />
                      <span>Claim Rewards</span>
                    </button>
                  )}

                  {camp.status === 'CLAIMED' && (
                    <button
                      disabled
                      className="px-4 py-2 bg-slate-800 text-emerald-400 font-semibold text-xs rounded-lg border border-emerald-500/30 flex items-center gap-1.5 cursor-not-allowed"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Claimed</span>
                    </button>
                  )}

                  {camp.status === 'ACTIVE' && (
                    <div className="text-right">
                      <div className="text-[11px] font-mono text-slate-400 mb-1">
                        Progress: {camp.progressPercent}%
                      </div>
                      <div className="w-28 h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className="bg-indigo-500 h-full rounded-full transition-all"
                          style={{ width: `${camp.progressPercent}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {camp.status === 'UPCOMING' && (
                    <span className="text-xs font-mono text-slate-500 px-3 py-1 rounded bg-slate-950 border border-slate-800">
                      Starts Soon
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rewards History Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Your Reward Claim History</h3>
            <p className="text-xs text-slate-400">Verifiable ledger of claimed CoreToken bonuses and points</p>
          </div>
          <span className="text-xs font-mono text-slate-400">{history.length} Transactions</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-5">Campaign / Task</th>
                <th className="py-3 px-5 text-right">Points Earned</th>
                <th className="py-3 px-5 text-right">CoreToken Granted</th>
                <th className="py-3 px-5 text-right">Claim Date</th>
                <th className="py-3 px-5 text-right">Tx Hash</th>
                <th className="py-3 px-5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {history.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-5 font-sans font-medium text-white">
                    {item.campaignTitle}
                  </td>
                  <td className="py-3 px-5 text-right text-amber-400 font-semibold tabular-nums">
                    +{item.pointsEarned}
                  </td>
                  <td className="py-3 px-5 text-right text-cyan-400 font-semibold tabular-nums">
                    +{item.ctGranted} CT
                  </td>
                  <td className="py-3 px-5 text-right text-slate-400">
                    {item.claimedAt}
                  </td>
                  <td className="py-3 px-5 text-right text-slate-500">
                    {item.txHash.slice(0, 8)}...{item.txHash.slice(-6)}
                  </td>
                  <td className="py-3 px-5 text-center">
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                      <CheckCircle2 className="w-3 h-3" />
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
