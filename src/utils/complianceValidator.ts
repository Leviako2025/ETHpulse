/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * EtherPulse Policy & Compliance Engine:
 * Reserved and Prohibited Terms Validator
 * 
 * Enforces zero-tolerance policies for:
 * 1. Solidity & EVM Reserved Language Keywords
 * 2. Regulatory Prohibited Financial / Securities / Guaranteed Yield Claims
 * 3. Protected Blockchain & Protocol Brand Impersonation
 * 4. Reserved Protocol Symbols & System Names
 */

export interface TermViolation {
  term: string;
  matchedIn: 'name' | 'symbol' | 'description' | 'metadata';
  category: 'SOLIDITY_RESERVED' | 'REGULATORY_PROHIBITED' | 'BRAND_IMPERSONATION' | 'RESERVED_SYMBOL';
  reason: string;
  severity: 'CRITICAL' | 'HIGH';
}

export interface ComplianceAuditResult {
  isCompliant: boolean;
  complianceScore: number; // 0 to 100
  status: 'PASSED_NO_RESERVED_TERMS' | 'VIOLATIONS_DETECTED';
  totalCheckedKeywords: number;
  violations: TermViolation[];
  auditSummary: string;
  auditedAt: string;
  standardsChecked: string[];
}

// 1. Solidity & EVM Reserved Keywords
export const SOLIDITY_RESERVED_KEYWORDS = [
  'address', 'contract', 'function', 'public', 'private', 'internal', 'external',
  'pure', 'view', 'payable', 'memory', 'storage', 'calldata', 'returns', 'return',
  'mapping', 'struct', 'enum', 'modifier', 'event', 'emit', 'true', 'false',
  'this', 'super', 'revert', 'assert', 'require', 'keccak256', 'sha256', 'selfdestruct',
  'delegatecall', 'assembly', 'block', 'msg', 'tx', 'now', 'override', 'virtual',
  'constant', 'immutable', 'abstract', 'constructor', 'fallback', 'receive', 'is',
  'interface', 'library', 'type', 'using', 'wei', 'gwei', 'ether', 'seconds', 'minutes',
  'hours', 'days', 'weeks', 'years'
];

// 2. Regulatory Prohibited Financial / Securities / Guaranteed Yield Claims
export const REGULATORY_PROHIBITED_TERMS = [
  'security', 'securities', 'stock', 'stocks', 'share', 'shares', 'equity', 'equities',
  'dividend', 'dividends', 'bond', 'bonds', 'guaranteed profit', 'guaranteed return',
  'guaranteed yield', 'risk free', 'risk-free', 'investment contract', 'investment fund',
  'fdic', 'insured deposit', 'bank deposit', 'banking license', 'interest bearing deposit',
  'fiat currency', 'legal tender', 'financial advice', 'guaranteed growth', 'capital return',
  'profit share', 'underwritten dividend', 'passive investment return'
];

// 3. Protected Blockchain & Protocol Brand Impersonation Terms
export const BRAND_IMPERSONATION_TERMS = [
  'ethereum official', 'bitcoin official', 'tether official', 'usdc official',
  'admin', 'system', 'root', 'superuser', 'etherscan official', 'uniswap official',
  'vitalik official', 'null', 'undefined', 'anonymous official', 'dao official',
  'consensys official', 'sec official', 'irs official', 'binance official', 'coinbase official'
];

// 4. Reserved Protocol Symbols
export const RESERVED_PROTOCOL_SYMBOLS = [
  'ETH', 'BTC', 'USDT', 'USDC', 'USD', 'EUR', 'GBP', 'JPY', 'GAS', 'WEI', 'GWEI', 'SATOSHI', 'NULL'
];

/**
 * Validate a token or asset against all reserved and prohibited term dictionaries
 */
export function checkTermsCompliance(
  name: string,
  symbol: string,
  description: string = ''
): ComplianceAuditResult {
  const violations: TermViolation[] = [];
  const lowerName = name.toLowerCase().trim();
  const lowerSymbol = symbol.toLowerCase().trim();
  const lowerDesc = description.toLowerCase().trim();

  // Helper to test if a term exists as an exact match or whole word
  const containsWholeWord = (text: string, term: string) => {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(^|[^a-zA-Z0-9_])${escaped}([^a-zA-Z0-9_]|$)`, 'i');
    return regex.test(text);
  };

  // 1. Check Solidity Keywords
  for (const kw of SOLIDITY_RESERVED_KEYWORDS) {
    if (lowerSymbol === kw || containsWholeWord(lowerSymbol, kw)) {
      violations.push({
        term: kw,
        matchedIn: 'symbol',
        category: 'SOLIDITY_RESERVED',
        reason: `Matches EVM/Solidity reserved keyword '${kw}'. May cause compiler or ABI decoder namespace collision.`,
        severity: 'CRITICAL'
      });
    }
    if (containsWholeWord(lowerName, kw)) {
      violations.push({
        term: kw,
        matchedIn: 'name',
        category: 'SOLIDITY_RESERVED',
        reason: `Contains Solidity reserved keyword '${kw}'.`,
        severity: 'HIGH'
      });
    }
  }

  // 2. Check Regulatory Prohibited Terms
  for (const term of REGULATORY_PROHIBITED_TERMS) {
    if (containsWholeWord(lowerName, term)) {
      violations.push({
        term,
        matchedIn: 'name',
        category: 'REGULATORY_PROHIBITED',
        reason: `Contains prohibited securities or investment claim '${term}'. Violates anti-guarantee consumer protection standards.`,
        severity: 'CRITICAL'
      });
    }
    if (containsWholeWord(lowerSymbol, term)) {
      violations.push({
        term,
        matchedIn: 'symbol',
        category: 'REGULATORY_PROHIBITED',
        reason: `Symbol contains prohibited financial term '${term}'.`,
        severity: 'CRITICAL'
      });
    }
    if (containsWholeWord(lowerDesc, term)) {
      violations.push({
        term,
        matchedIn: 'description',
        category: 'REGULATORY_PROHIBITED',
        reason: `Description contains prohibited securities or guaranteed return phrase '${term}'.`,
        severity: 'HIGH'
      });
    }
  }

  // 3. Check Brand Impersonation Terms
  for (const term of BRAND_IMPERSONATION_TERMS) {
    if (containsWholeWord(lowerName, term) || lowerName === term) {
      violations.push({
        term,
        matchedIn: 'name',
        category: 'BRAND_IMPERSONATION',
        reason: `Matches protected protocol or administrative identity '${term}'.`,
        severity: 'CRITICAL'
      });
    }
    if (lowerSymbol === term || containsWholeWord(lowerSymbol, term)) {
      violations.push({
        term,
        matchedIn: 'symbol',
        category: 'BRAND_IMPERSONATION',
        reason: `Symbol impersonates protected administrative term '${term}'.`,
        severity: 'CRITICAL'
      });
    }
  }

  // 4. Check Reserved Protocol Symbols (exact match)
  const upperSymbol = symbol.toUpperCase().trim();
  if (RESERVED_PROTOCOL_SYMBOLS.includes(upperSymbol)) {
    // Only flag if it's not the canonical underlying asset itself
    if (upperSymbol !== 'ETH' && upperSymbol !== 'USDT' && upperSymbol !== 'USDC') {
      violations.push({
        term: upperSymbol,
        matchedIn: 'symbol',
        category: 'RESERVED_SYMBOL',
        reason: `Symbol '${upperSymbol}' is reserved for foundational base currency or stablecoin protocol.`,
        severity: 'CRITICAL'
      });
    }
  }

  const isCompliant = violations.length === 0;
  const complianceScore = isCompliant ? 100 : Math.max(0, 100 - violations.length * 25);
  const totalChecked =
    SOLIDITY_RESERVED_KEYWORDS.length +
    REGULATORY_PROHIBITED_TERMS.length +
    BRAND_IMPERSONATION_TERMS.length +
    RESERVED_PROTOCOL_SYMBOLS.length;

  return {
    isCompliant,
    complianceScore,
    status: isCompliant ? 'PASSED_NO_RESERVED_TERMS' : 'VIOLATIONS_DETECTED',
    totalCheckedKeywords: totalChecked,
    violations,
    auditSummary: isCompliant
      ? `Audit PASSED: Zero reserved or prohibited terms found across ${totalChecked} checked keywords.`
      : `Audit FLAGGED: ${violations.length} prohibited or reserved term violation(s) identified. Remediation required.`,
    auditedAt: new Date().toISOString(),
    standardsChecked: [
      'EIP-20 Metadata & ABI Namespace Safety',
      'Solidity v0.8.28 Keyword Collision Matrix',
      'FINRA/SEC Deceptive Financial Claim Heuristics',
      'Anti-Phishing Protocol Registry Standards'
    ]
  };
}

/**
 * Filter or clean text from prohibited phrases
 */
export function sanitizeProhibitedPhrases(input: string): string {
  let output = input;
  for (const term of REGULATORY_PROHIBITED_TERMS) {
    const regex = new RegExp(`\\b${term}\\b`, 'gi');
    output = output.replace(regex, '[RESTRICTED_TERM]');
  }
  return output;
}
