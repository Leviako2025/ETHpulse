import React, { useState } from 'react';
import { TokenProfile } from '../types/token';
import { 
  ShieldCheck, ShieldAlert, CheckCircle2, XCircle, AlertTriangle, 
  Code, FileCode, Lock, Key, ExternalLink, Flame, RefreshCcw 
} from 'lucide-react';

interface SmartContractAnalyticsProps {
  token: TokenProfile;
}

export const SmartContractAnalytics: React.FC<SmartContractAnalyticsProps> = ({ token }) => {
  const [activeTab, setActiveTab] = useState<'audit' | 'interface' | 'events'>('audit');

  const audit = token.securityAudit;

  const erc20Methods = [
    { name: 'name()', type: 'view returns (string)', status: 'Implemented' },
    { name: 'symbol()', type: 'view returns (string)', status: 'Implemented' },
    { name: 'decimals()', type: 'view returns (uint8)', status: 'Implemented' },
    { name: 'totalSupply()', type: 'view returns (uint256)', status: 'Implemented' },
    { name: 'balanceOf(address account)', type: 'view returns (uint256)', status: 'Implemented' },
    { name: 'transfer(address to, uint256 amount)', type: 'public returns (bool)', status: 'Implemented' },
    { name: 'allowance(address owner, address spender)', type: 'view returns (uint256)', status: 'Implemented' },
    { name: 'approve(address spender, uint256 amount)', type: 'public returns (bool)', status: 'Implemented' },
    { name: 'transferFrom(address from, address to, uint256 amount)', type: 'public returns (bool)', status: 'Implemented' },
    { 
      name: 'permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s)', 
      type: 'public (EIP-2612 Gasless)', 
      status: token.hasPermit ? 'Supported' : 'Not Implemented' 
    }
  ];

  const recentContractEvents = [
    {
      eventName: 'Transfer',
      signature: '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
      params: 'from: 0x28c6...1d60, to: 0x3fc9...7fad, value: 12,450.00 ' + token.symbol,
      block: 21458928,
      age: '12s ago'
    },
    {
      eventName: 'Approval',
      signature: '0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925',
      params: 'owner: 0x71a5...b92b, spender: 0x3fc9...7fad (Uniswap Router), value: Unlimited (2^256-1)',
      block: 21458925,
      age: '48s ago'
    },
    {
      eventName: 'Transfer',
      signature: '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
      params: 'from: 0x1d42...d801, to: 0xab58...ec9b (vitalik.eth), value: 4,500.00 ' + token.symbol,
      block: 21458921,
      age: '1m ago'
    },
    {
      eventName: 'OwnershipTransferred',
      signature: '0x8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0',
      params: `previousOwner: ${token.deployerAddress.slice(0, 8)}..., newOwner: ${audit.ownerAddress?.slice(0, 10) || '0x0000...0000'}`,
      block: token.deploymentBlock + 140,
      age: 'Historical'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Contract Verification & Metadata Strip */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold text-white">Smart Contract Architecture & Bytecode</span>
              {token.verified && (
                <span className="text-xs text-emerald-400 font-mono">Verified Solidity Source</span>
              )}
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Deployed on block #{token.deploymentBlock.toLocaleString()} · {token.deploymentDate}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`https://etherscan.io/address/${token.address}#code`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors border border-slate-700"
            >
              <Code className="w-3.5 h-3.5 text-indigo-400" />
              <span>Inspect Source on Etherscan</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
          </div>
        </div>

        {/* Contract specifications */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 text-xs font-mono">
          <div>
            <span className="text-slate-500 block text-[11px]">Compiler Version</span>
            <span className="text-white font-medium">{token.compilerVersion}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Open Source License</span>
            <span className="text-white font-medium">{token.license}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Deployer Address</span>
            <span className="text-indigo-400 font-medium" title={token.deployerAddress}>
              {token.deployerAddress.slice(0, 8)}...{token.deployerAddress.slice(-6)}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Proxy Architecture</span>
            <span className={token.isProxy ? 'text-amber-400' : 'text-slate-300'}>
              {token.isProxy ? `Upgradeable Proxy (${token.proxyImplementation?.slice(0, 6)}...)` : 'Immutable Contract'}
            </span>
          </div>
        </div>
      </div>

      {/* Security Honeypot & Safety Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Safety Score Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-sm font-semibold text-white">Security & Audit Score</span>
              <span className={`text-xs font-mono font-semibold ${audit.riskLevel === 'LOW' ? 'text-emerald-400' : 'text-amber-400'}`}>
                {audit.riskLevel} RISK
              </span>
            </div>

            <div className="mt-6 text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-slate-950 border-4 border-emerald-500/80">
                <span className="text-3xl font-bold font-mono text-white tabular-nums">
                  {audit.safetyScore}
                </span>
                <span className="text-xs text-slate-500 font-mono">/100</span>
              </div>
              <p className="text-xs text-slate-300 font-medium mt-3">
                {audit.safetyScore >= 90 ? 'Contract passes standard ERC-20 integrity checks' : 'Review flagged permissions below'}
              </p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-500">
            Automated bytecode heuristic scanning for hidden mint backdoors, variable fee taxes, and transfer locks.
          </div>
        </div>

        {/* Detailed Safety Checks Grid (2 cols) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white pb-3 border-b border-slate-800">
            Honeypot, Tax & Privileged Access Analysis
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-4 text-xs">
            {/* Buy Tax */}
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-white block">Buy Tax: {audit.buyTaxPercent}%</span>
                <span className="text-slate-400 text-[11px]">No slippage deduction on purchases</span>
              </div>
            </div>

            {/* Sell Tax */}
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-white block">Sell Tax: {audit.sellTaxPercent}%</span>
                <span className="text-slate-400 text-[11px]">Zero penalty tax on Uniswap sales</span>
              </div>
            </div>

            {/* Ownership Status */}
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-start gap-3">
              {audit.isOwnershipRenounced ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              )}
              <div>
                <span className="font-semibold text-white block">
                  Ownership: {audit.isOwnershipRenounced ? 'Renounced / Dead Address' : 'Owned / Timelock'}
                </span>
                <span className="text-slate-400 text-[11px] truncate block max-w-[200px]" title={audit.ownerAddress}>
                  {audit.ownerAddress || '0x0000...0000'}
                </span>
              </div>
            </div>

            {/* Blacklist Function */}
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-start gap-3">
              {!audit.canBlacklist ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              )}
              <div>
                <span className="font-semibold text-white block">
                  Blacklist Function: {audit.canBlacklist ? 'Detected' : 'None'}
                </span>
                <span className="text-slate-400 text-[11px]">
                  {audit.canBlacklist ? 'Admin can freeze target addresses' : 'Transfers cannot be censored'}
                </span>
              </div>
            </div>

            {/* Mintable Status */}
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-start gap-3">
              <div className="mt-0.5">
                {audit.isMintable ? (
                  <Flame className="w-4 h-4 text-indigo-400" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                )}
              </div>
              <div>
                <span className="font-semibold text-white block">
                  Supply Minting: {audit.isMintable ? 'Inflationary / Timelock Capped' : 'Fixed Supply (Non-mintable)'}
                </span>
                <span className="text-slate-400 text-[11px]">
                  {audit.isMintable ? 'Subject to protocol governance rules' : 'Hard supply cap cannot be altered'}
                </span>
              </div>
            </div>

            {/* Transfer Pausability */}
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-start gap-3">
              {!audit.canPauseTransfers ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              )}
              <div>
                <span className="font-semibold text-white block">
                  Pausable Transfers: {audit.canPauseTransfers ? 'Yes' : 'No'}
                </span>
                <span className="text-slate-400 text-[11px]">
                  {audit.canPauseTransfers ? 'Contract has pause() method' : 'Trading cannot be halted'}
                </span>
              </div>
            </div>
          </div>

          {/* Vulnerabilities warnings if any */}
          {audit.vulnerabilitiesFound.length > 0 && (
            <div className="mt-4 p-3 rounded-lg bg-amber-950/30 border border-amber-500/30 text-xs text-amber-300 space-y-1">
              <span className="font-semibold block text-amber-200">Security Considerations:</span>
              {audit.vulnerabilitiesFound.map((v, i) => (
                <p key={i} className="text-[11px] leading-relaxed">· {v}</p>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ERC-20 Interface & Contract Events Tabs */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="flex border-b border-slate-800 bg-slate-950/40">
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-5 py-3 text-xs font-semibold font-mono border-b-2 transition-colors ${
              activeTab === 'audit' ? 'border-indigo-500 text-white bg-slate-900' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            ERC-20 Interface ABI ({erc20Methods.length} Methods)
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`px-5 py-3 text-xs font-semibold font-mono border-b-2 transition-colors ${
              activeTab === 'events' ? 'border-indigo-500 text-white bg-slate-900' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Decoded Contract Event Logs
          </button>
        </div>

        {activeTab === 'audit' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-6">Method Signature</th>
                  <th className="py-3 px-6">Visibility & Returns</th>
                  <th className="py-3 px-6 text-right">Standard Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {erc20Methods.map((m, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40">
                    <td className="py-3 px-6 text-white font-semibold">{m.name}</td>
                    <td className="py-3 px-6 text-slate-400">{m.type}</td>
                    <td className="py-3 px-6 text-right">
                      <span className={m.status === 'Supported' || m.status === 'Implemented' ? 'text-emerald-400' : 'text-slate-500'}>
                        {m.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-6">Event Name</th>
                  <th className="py-3 px-6">Topic[0] Signature</th>
                  <th className="py-3 px-6">Decoded Log Parameters</th>
                  <th className="py-3 px-6 text-right">Block</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {recentContractEvents.map((evt, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40">
                    <td className="py-3 px-6 font-semibold text-white">{evt.eventName}</td>
                    <td className="py-3 px-6 text-slate-500 text-[10px]">{evt.signature.slice(0, 16)}...</td>
                    <td className="py-3 px-6 text-slate-200">{evt.params}</td>
                    <td className="py-3 px-6 text-right text-slate-400">
                      <span>#{evt.block.toLocaleString()}</span>
                      <span className="text-[10px] text-slate-500 block">{evt.age}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
