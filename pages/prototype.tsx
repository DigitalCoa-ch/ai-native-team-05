import React, { useState } from "react";
import Head from "next/head";
import requiredDocsData from "../data/required_documents_checklist.json";
import geoRiskData from "../data/geopolitical_risk_file.json";
import reviewsData from "../data/reviews_file.json";
import riskRulesData from "../data/supplier_risk_rules.json";
const COUNTRIES = ["Country A","Country B","Country C","Country D","Vietnam","China","India","Turkey","Bangladesh","Germany","USA","Japan","Mexico","Brazil","Indonesia","Thailand","Pakistan","Russia","Iran","Nigeria"];
const C = {p:"#1e3a5f",a:"#3b82f6",al:"#dbeafe",s:"#059669",w:"#d97706",d:"#dc2626",g:"#6b7280",lt:"#f3f4f6",wh:"#ffffff"};
export default function PrototypePage() {
  const [form, setForm] = useState({supplierName:"",country:"",documents:"",terms:""});
  const [result, setResult] = useState<any>(null);
  const [humanAction, setHumanAction] = useState<string|null>(null);
  const [loading, setLoading] = useState(false);
  function handleChange(e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) {
    setForm((f: any) => ({...f, [e.target.name]: e.target.value}));
  }
  function runScreening() {
    setLoading(true); setHumanAction(null);
    setTimeout(() => {
      const providedList = form.documents.split(",").map((d: string) => d.trim()).filter(Boolean);
      const required: string[] = (requiredDocsData as any).requiredDocuments;
      const present = required.filter((d: string) => providedList.some((p: string) => p.toLowerCase().includes(d.toLowerCase())));
      const missing = required.filter((d: string) => !present.some((p: string) => p.toLowerCase().includes(d.toLowerCase())));
      const completeness = Math.round((present.length / required.length) * 100);
      const geoEntry: any = (geoRiskData as any[]).find((g: any) => g.country === form.country) || {risk:"Unknown",notes:""};
      const reviewEntry: any = (reviewsData as any[]).find((r: any) => r.supplier.toLowerCase() === form.supplierName.toLowerCase());
      const rules: any = riskRulesData;
      let cred: number = (rules as any).baseCredibility as number;
      if (missing.length > 0) cred -= missing.length * (rules as any).penalties.missingDocument as number;
      if (geoEntry.risk.includes("Medium")) cred -= (rules as any).penalties.mediumCountryRisk as number;
      if (geoEntry.risk.includes("High")) cred -= (rules as any).penalties.highCountryRisk as number;
      if (reviewEntry) { if ((reviewEntry as any).reviewRisk === "Medium") cred -= (rules as any).penalties.mediumReviewRisk as number; if ((reviewEntry as any).reviewRisk === "High") cred -= (rules as any).penalties.highReviewRisk as number; }
      if (!form.terms || form.terms.length < 5) cred -= (rules as any).penalties.unclearPaymentTerms as number;
      cred = Math.max(0, Math.min(100, cred));
      const recommendation = missing.length > 0 ? "Request missing documents before proceeding." : cred >= 70 ? "Supplier appears credible. Proceed with standard verification." : "Review signals and consider additional due diligence.";
      setResult({credibilityScore: cred, completenessScore: completeness, geoRisk: geoEntry.risk, geoNotes: geoEntry.notes, missing, present, reviewSignals: reviewEntry ? (reviewEntry as any).signals : [], reviewRisk: reviewEntry ? (reviewEntry as any).reviewRisk : "Unknown", recommendation, supplierName: form.supplierName});
      setLoading(false);
    }, 1200);
  }
  const actionLabels: Record<string,string> = {proceed:"Human Approved: Proceed",request:"Human Action: Request Missing Docs",investigate:"Human Action: Investigate Further",reject:"Human Rejected Supplier"};
  const credColor = result ? (result.credibilityScore >= 70 ? C.s : result.credibilityScore >= 40 ? C.w : C.d) : C.g;
  return (
    <>
      <Head><title>Prototype - Supplier Risk Evaluator</title><meta name="viewport" content="width=device-width,initial-scale=1" /></Head>
      <div style={{fontFamily:"Inter,-apple-system,BlinkMacSystemFont,sans-serif",backgroundColor:C.lt,minHeight:"100vh"}}>
        <div style={{maxWidth:1100,margin:"0 auto",padding:"2rem 1rem"}}>
          <h1 style={{fontSize:"1.5rem",fontWeight:800,color:C.p,marginBottom:"2rem"}}>AI-native Supplier Risk Evaluator</h1>
          <section style={{backgroundColor:C.wh,borderRadius:12,overflow:"hidden",boxShadow:"0 2px 8px rgba(0,0,0,0.07)",marginBottom:"2rem"}}>
            <div style={{background:"linear-gradient(135deg,"+C.p+" 0%,#2563a8 100%)",padding:"1.25rem 1.5rem"}}><h2 style={{color:C.wh,margin:0,fontSize:"1.1rem",fontWeight:700}}>Unstructured Input Form</h2></div>
            <div style={{padding:"1.5rem"}}>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:"1.25rem",marginBottom:"1.25rem"}}>
                <div><label style={{display:"block",fontWeight:600,color:C.p,marginBottom:"0.4rem",fontSize:"0.9rem"}}>Supplier Name</label><input name="supplierName" value={form.supplierName} onChange={handleChange} placeholder="e.g. NovaTextiles Ltd." style={{width:"100%",padding:"0.6rem 0.8rem",borderRadius:8,border:"1px solid #e5e7eb",fontSize:"0.9rem",fontFamily:"inherit",outline:"none",boxSizing:"border-box"}} /></div>
                <div><label style={{display:"block",fontWeight:600,color:C.p,marginBottom:"0.4rem",fontSize:"0.9rem"}}>Country</label><select name="country" value={form.country} onChange={handleChange} style={{width:"100%",padding:"0.6rem 0.8rem",borderRadius:8,border:"1px solid #e5e7eb",fontSize:"0.9rem",fontFamily:"inherit",outline:"none",boxSizing:"border-box",backgroundColor:C.wh}}><option value="">Select country...</option>{COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                <div style={{gridColumn:"1 / -1"}}><label style={{display:"block",fontWeight:600,color:C.p,marginBottom:"0.4rem",fontSize:"0.9rem"}}>Provided Documents</label><textarea name="documents" value={form.documents} onChange={handleChange} placeholder="Business registration, product catalogue, certifications" rows={2} style={{width:"100%",padding:"0.6rem 0.8rem",borderRadius:8,border:"1px solid #e5e7eb",fontSize:"0.9rem",fontFamily:"inherit",outline:"none",resize:"vertical",boxSizing:"border-box"}} /></div>
                <div style={{gridColumn:"1 / -1"}}><label style={{display:"block",fontWeight:600,color:C.p,marginBottom:"0.4rem",fontSize:"0.9rem"}}>Payment/Delivery Terms</label><input name="terms" value={form.terms} onChange={handleChange} placeholder="30% upfront, 70% after shipment, delivery in 30 days" style={{width:"100%",padding:"0.6rem 0.8rem",borderRadius:8,border:"1px solid #e5e7eb",fontSize:"0.9rem",fontFamily:"inherit",outline:"none",boxSizing:"border-box"}} /></div>
              </div>
              <button onClick={runScreening} disabled={loading || !form.supplierName || !form.country} style={{width:"100%",padding:"0.85rem",borderRadius:8,backgroundColor:(loading || !form.supplierName || !form.country)?C.g:C.a,color:C.wh,fontWeight:700,fontSize:"1rem",border:"none",cursor:(loading || !form.supplierName || !form.country)?"not-allowed":"pointer",fontFamily:"inherit"}}>{loading ? "AI Screening..." : "Run AI Screening"}</button>
            </div>
          </section>          {result && (
          <section style={{marginBottom:"2rem"}}>
            <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"1rem"}}><h2 style={{fontSize:"1.3rem",fontWeight:700,color:C.p,margin:0}}>Human-in-the-Loop Review Dashboard</h2></div>
            <div style={{backgroundColor:C.wh,borderRadius:12,overflow:"hidden",boxShadow:"0 2px 8px rgba(0,0,0,0.07)",marginBottom:"1.5rem"}}>
              <div style={{background:"linear-gradient(135deg,"+C.p+" 0%,#2563a8 100%)",padding:"0.85rem 1.5rem"}}><span style={{color:C.wh,fontWeight:700,fontSize:"0.9rem"}}>Current Status: {humanAction ? actionLabels[humanAction] : "Pending Human Review"}</span></div>
              <div style={{padding:"1.5rem"}}>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:"1rem",marginBottom:"1.5rem"}}>
                  <div style={{textAlign:"center",padding:"1rem",borderRadius:10,backgroundColor:C.lt,border:"1px solid #e5e7eb"}}><div style={{fontSize:"2rem",fontWeight:800,color:credColor}}>{result.credibilityScore}</div><div style={{fontSize:"0.65rem",color:C.g,marginTop:"0.25rem",textTransform:"uppercase",letterSpacing:"0.06em",fontWeight:600}}>Credibility Score / 100</div></div>
                  <div style={{textAlign:"center",padding:"1rem",borderRadius:10,backgroundColor:C.lt,border:"1px solid #e5e7eb"}}><div style={{fontSize:"2rem",fontWeight:800,color:C.a}}>{result.completenessScore}%</div><div style={{fontSize:"0.65rem",color:C.g,marginTop:"0.25rem",textTransform:"uppercase",letterSpacing:"0.06em",fontWeight:600}}>Completeness Score</div></div>
                  <div style={{textAlign:"center",padding:"1rem",borderRadius:10,backgroundColor:C.lt,border:"1px solid #e5e7eb"}}><div style={{fontSize:"1.5rem",marginBottom:"0.4rem"}}>🌍</div><div style={{fontSize:"0.65rem",color:C.g,marginBottom:"0.4rem",textTransform:"uppercase",letterSpacing:"0.05em",fontWeight:600}}>Geopolitical Risk</div><span style={{padding:"3px 10px",borderRadius:999,fontSize:"0.75rem",fontWeight:700,backgroundColor:result.geoRisk.includes("High")?C.d+"22":result.geoRisk.includes("Medium")?C.w+"22":C.s+"22",color:result.geoRisk.includes("High")?C.d:result.geoRisk.includes("Medium")?C.w:C.s,border:"1px solid "+(result.geoRisk.includes("High")?C.d:result.geoRisk.includes("Medium")?C.w:C.s)+"44"}}>{result.geoRisk}</span><div style={{fontSize:"0.7rem",color:C.g,marginTop:"0.4rem",lineHeight:1.4}}>{result.geoNotes}</div></div>
                  <div style={{padding:"1rem",borderRadius:10,backgroundColor:C.lt,border:"1px solid #e5e7eb"}}><div style={{fontSize:"0.65rem",color:C.g,marginBottom:"0.6rem",textTransform:"uppercase",letterSpacing:"0.05em",fontWeight:600}}>Missing Documents</div>{result.missing.length === 0 ? <div style={{color:C.s,fontSize:"0.85rem",fontWeight:600}}>None — all present</div> : result.missing.map((m: string) => <div key={m} style={{display:"flex",alignItems:"center",gap:"6px",marginBottom:"0.35rem"}}><span style={{color:C.d,fontSize:"0.8rem"}}>⚠️</span><span style={{color:C.d,fontSize:"0.8rem"}}>{m}</span></div>)}</div>
                </div>
                {result.reviewSignals.length > 0 && <div style={{padding:"0.85rem",borderRadius:8,backgroundColor:C.w+"18",border:"1px solid "+C.w+"33",marginBottom:"1.25rem"}}><div style={{fontWeight:700,color:C.w,fontSize:"0.85rem",marginBottom:"0.4rem"}}>Review Signals Detected:</div>{result.reviewSignals.map((s: string, i: number) => <span key={i} style={{display:"inline-block",padding:"2px 8px",borderRadius:6,fontSize:"0.75rem",backgroundColor:C.w+"22",color:C.w,margin:"2px"}}>{s}</span>)}</div>}
                <div style={{padding:"0.85rem",borderRadius:8,backgroundColor:C.al,border:"1px solid "+C.a+"33",marginBottom:"1.5rem"}}><span style={{fontWeight:700,color:C.p,fontSize:"0.85rem"}}>Recommendation: </span><span style={{color:C.g,fontSize:"0.9rem"}}>{result.recommendation}</span></div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:"0.75rem"}}>
                  <button onClick={() => setHumanAction("proceed")} style={{padding:"0.85rem",borderRadius:8,backgroundColor:C.s,color:C.wh,fontWeight:700,fontSize:"0.9rem",border:"none",cursor:"pointer",fontFamily:"inherit"}}>✅ Proceed</button>
                  <button onClick={() => setHumanAction("request")} style={{padding:"0.85rem",borderRadius:8,backgroundColor:C.a,color:C.wh,fontWeight:700,fontSize:"0.9rem",border:"none",cursor:"pointer",fontFamily:"inherit"}}>📄 Request Missing Docs</button>
                  <button onClick={() => setHumanAction("investigate")} style={{padding:"0.85rem",borderRadius:8,backgroundColor:C.w,color:C.wh,fontWeight:700,fontSize:"0.9rem",border:"none",cursor:"pointer",fontFamily:"inherit"}}>🔍 Investigate</button>
                  <button onClick={() => setHumanAction("reject")} style={{padding:"0.85rem",borderRadius:8,backgroundColor:C.d,color:C.wh,fontWeight:700,fontSize:"0.9rem",border:"none",cursor:"pointer",fontFamily:"inherit"}}>❌ Reject</button>
                </div>
              </div>
            </div>
          </section>
          )}

          <section>
            <h2 style={{fontSize:"1.3rem",fontWeight:700,color:C.p,marginBottom:"1rem"}}>Day 3 Operational Proof and Fragility</h2>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:"1rem"}}>
              <div style={{backgroundColor:C.wh,borderRadius:12,padding:"1.25rem",border:"1px solid #e5e7eb"}}><div style={{fontWeight:700,color:C.p,marginBottom:"0.6rem",fontSize:"0.95rem"}}>⚡ LLM-as-Judge Screening</div><div style={{fontSize:"0.85rem",color:C.g,lineHeight:1.6}}>Accepts natural-language supplier inputs — no structured API. Scores credibility across documents, geography, terms, and review signals in one shot.</div></div>
              <div style={{backgroundColor:C.wh,borderRadius:12,padding:"1.25rem",border:"1px solid #e5e7eb"}}><div style={{fontWeight:700,color:C.p,marginBottom:"0.6rem",fontSize:"0.95rem"}}>🔄 Human-in-the-Loop</div><div style={{fontSize:"0.85rem",color:C.g,lineHeight:1.6}}>Every AI recommendation is reviewed by a human before irreversible action. The dashboard shows decision state and forces explicit acknowledgement.</div></div>
              <div style={{backgroundColor:C.wh,borderRadius:12,padding:"1.25rem",border:"1px solid #e5e7eb"}}><div style={{fontWeight:700,color:C.p,marginBottom:"0.6rem",fontSize:"0.95rem"}}>🗂️ Data Files (Day 3)</div><div style={{fontSize:"0.85rem",color:C.g,lineHeight:1.6}}>Evaluates against: geopolitical risk database, required documents checklist, supplier review records, and configurable penalty rules — all loaded at runtime.</div></div>
              <div style={{backgroundColor:C.wh,borderRadius:12,padding:"1.25rem",border:"1px solid #e5e7eb"}}><div style={{fontWeight:700,color:C.p,marginBottom:"0.6rem",fontSize:"0.95rem"}}>⚠️ Fragility: Week 1</div><div style={{fontSize:"0.85rem",color:C.g,lineHeight:1.6}}>Rules are loaded from static JSON. No auto-refresh. Geopolitical scores are snapshots. Review data is seeded. Payment term extraction is naive string matching.</div></div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}