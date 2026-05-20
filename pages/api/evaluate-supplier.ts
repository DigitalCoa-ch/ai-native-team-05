import type { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import fs from 'fs';

function readJSON(filename: string) {
  return JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', filename), 'utf8'));
}

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
  return entry?.notes ?? '';
}

function getReviewEntry(supplierName: string) {
  return REVIEWS_DATA.find((r: any) => r.supplierName.toLowerCase() === supplierName.toLowerCase()) ?? null;
}

function calcCompletenessScore(presentCount: number): number {
  return Math.round((presentCount / REQUIRED_DOCS.length) * 100);
}

function calcCredibilityScore(completenessScore: number, countryRisk: string, reviewRisk: string | null, hasTerms: boolean): number {
  const rules = RULES_DATA.penaltyRules;
  let cred = RULES_DATA.baseCredibilityScore;
  if (countryRisk === 'High Risk') cred -= rules.highGeoPenalty;
  else if (countryRisk === 'Medium Risk') cred -= rules.mediumGeoPenalty;
  if (!hasTerms) cred -= rules.unclearPaymentTerms;
  if (reviewRisk === 'High') cred -= rules.reviewPenaltyHigh;
  else if (reviewRisk === 'Medium') cred -= rules.reviewPenaltyMedium;
  return Math.max(0, Math.min(100, cred));
}

function buildRecommendedNextSteps(missingDocs: string[], countryRiskStatus: string): string[] {
  const steps: string[] = [];
  if (missingDocs.length > 0) steps.push(`Request missing documents: ${missingDocs.join(', ')}.`);
  if (countryRiskStatus === 'High Risk') steps.push('Escalate to compliance team before any engagement.');
  else if (countryRiskStatus === 'Medium Risk') steps.push('Conduct enhanced due diligence.');
  if (steps.length === 0) steps.push('Proceed with standard onboarding.');
  return steps;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { supplierName, supplierCountry, providedTextDocs, paymentTerms, deliveryTerms } = req.body;

  if (!supplierName || !supplierCountry) {
    return res.status(400).json({ error: 'supplierName and supplierCountry are required.' });
  }

  const provided = (providedTextDocs || '').toLowerCase();
  const presentDocuments = REQUIRED_DOCS.filter((doc: string) =>
    provided.includes(doc.toLowerCase())
  );
  const missingDocuments = REQUIRED_DOCS.filter((doc: string) =>
    !provided.includes(doc.toLowerCase())
  );

  const countryRiskStatus = getCountryRisk(supplierCountry);
  const countryNotes = getCountryNotes(supplierCountry);
  const reviewEntry = getReviewEntry(supplierName);
  const completenessScore = calcCompletenessScore(presentDocuments.length);
  const hasTerms = ((paymentTerms?.length ?? 0) > 5 || (deliveryTerms?.length ?? 0) > 5);
  const credibilityScore = calcCredibilityScore(completenessScore, countryRiskStatus, reviewEntry?.reviewRisk ?? null, hasTerms);
  const recommendedNextSteps = buildRecommendedNextSteps(missingDocuments, countryRiskStatus);

  const response = {
    evaluationSummary: { supplierName, credibilityScore, completenessScore, countryRiskStatus },
    gapAnalysis: { presentDocuments, missingDocuments },
    countryRiskCheck: {
      countryRiskLevel: countryRiskStatus,
      onSanctionsList: countryRiskStatus === 'High Risk',
      travelAdvisoryLevel: countryRiskStatus === 'Low Risk' ? 'None' : 'Minor',
      notes: countryNotes,
    },
    redFlags: reviewEntry
      ? reviewEntry.signals.map((s: string) => ({ flag: s, mitigation: 'Investigate this signal before proceeding.' }))
      : [],
    reviewSignals: reviewEntry?.signals ?? [],
    recommendedNextSteps,
    humanControlStatus: 'Pending Human Action',
  };

  return res.status(200).json(response);
}
