import type { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import fs from 'fs';

function readJSON(filename: string) {
  return JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', filename), 'utf8'));
}

// Load mock data files
const GEO_DATA = readJSON('geopolitical_risk_file.json');
const REVIEWS_DATA = readJSON('reviews_file.json');
const RULES_DATA = readJSON('supplier_risk_rules.json');
const REQUIRED_DOCS = readJSON('required_documents_checklist.json').requiredDocuments;

function getCountryRisk(country: string): string {
  const entry = GEO_DATA.find((g: any) => g.country === country);
  return entry ? entry.risk : 'Unverified Risk Status';
}

function getCountryNotes(country: string): string {
  const entry = GEO_DATA.find((g: any) => g.country === country);
  return entry ? entry.notes : '';
}

function getReviewEntry(supplierName: string) {
  return REVIEWS_DATA.find((r: any) => r.supplier.toLowerCase() === supplierName.toLowerCase());
}

function parseProvidedDocs(text: string): string[] {
  if (!text) return [];
  return text.split(/[,\n]+/).map(d => d.trim()).filter(d => d.length > 0);
}

function normalizeDoc(doc: string): string {
  return doc.trim().toLowerCase();
}

function runGapAnalysis(providedText: string) {
  const provided = parseProvidedDocs(providedText).map(normalizeDoc);
  const present: string[] = [];
  const missing: string[] = [];
  for (const required of REQUIRED_DOCS) {
    const found = provided.some(p => p.includes(required.toLowerCase()) || required.toLowerCase().includes(p));
    if (found) present.push(required); else missing.push(required);
  }
  return { presentDocuments: present, missingDocuments: missing };
}

function calcCompletenessScore(presentCount: number): number {
  return Math.round((presentCount / REQUIRED_DOCS.length) * 100);
}

function calcCredibilityScore(completenessScore: number, countryRisk: string, reviewRisk: string | null, hasTerms: boolean): number {
  const rules = RULES_DATA;
  let cred = rules.baseCredibility;
  const missingCount = REQUIRED_DOCS.length - Math.round(completenessScore / 100 * REQUIRED_DOCS.length);
  if (missingCount > 0) cred -= missingCount * rules.penalties.missingDocument;
  if (countryRisk.includes('Medium')) cred -= rules.penalties.mediumCountryRisk;
  if (countryRisk.includes('High')) cred -= rules.penalties.highCountryRisk;
  if (reviewRisk === 'Medium') cred -= rules.penalties.mediumReviewRisk;
  if (reviewRisk === 'High') cred -= rules.penalties.highReviewRisk;
  if (!hasTerms) cred -= rules.penalties.unclearPaymentTerms;
  return Math.max(0, Math.min(100, cred));
}

function buildRecommendedNextSteps(missingDocs: string[], countryRisk: string): string[] {
  const steps: string[] = [];
  if (missingDocs.length > 0) steps.push(`Request missing documents: ${missingDocs.join(', ')}.`);
  if (countryRisk.includes('High')) steps.push('Enhanced due diligence required — supplier is in a high-risk country.');
  else if (countryRisk.includes('Medium')) steps.push('Verify delivery track record independently before committing.');
  steps.push('Obtain a sample shipment before committing to a bulk order.');
  if (steps.length === 1) steps.push('Supplier dossier appears complete — proceed with standard review.');
  return steps;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { supplierName, supplierCountry, providedTextDocs, paymentTerms, deliveryTerms } = req.body as {
    supplierName?: string; supplierCountry?: string; providedTextDocs?: string; paymentTerms?: string; deliveryTerms?: string;
  };

  if (!supplierName || !supplierCountry) {
    return res.status(400).json({ error: 'supplierName and supplierCountry are required.' });
  }

  const gap = runGapAnalysis(providedTextDocs ?? '');
  const countryRiskStatus = getCountryRisk(supplierCountry);
  const countryNotes = getCountryNotes(supplierCountry);
  const reviewEntry = getReviewEntry(supplierName);
  const completenessScore = calcCompletenessScore(gap.presentDocuments.length);
  const hasTerms = !!(paymentTerms?.length > 5 || deliveryTerms?.length > 5);
  const credibilityScore = calcCredibilityScore(completenessScore, countryRiskStatus, reviewEntry?.reviewRisk ?? null, hasTerms);
  const recommendedNextSteps = buildRecommendedNextSteps(gap.missingDocuments, countryRiskStatus);

  const response = {
    evaluationSummary: { supplierName, credibilityScore, completenessScore, countryRiskStatus },
    gapAnalysis: { presentDocuments: gap.presentDocuments, missingDocuments: gap.missingDocuments },
    countryRiskCheck: {
      countryRiskLevel: countryRiskStatus,
      onSanctionsList: countryRiskStatus.includes('High'),
      travelAdvisoryLevel: countryRiskStatus === 'Low Risk' ? 'None' : 'Minor',
      notes: countryNotes,
    },
    redFlags: reviewEntry ? reviewEntry.signals.map((s: string) => ({ flag: s, mitigation: 'Investigate this signal before proceeding.' })) : [],
    reviewSignals: reviewEntry?.signals ?? [],
    recommendedNextSteps,
    humanControlStatus: 'Pending Human Action',
  };

  return res.status(200).json(response);
}