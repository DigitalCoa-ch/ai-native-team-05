import React, { useState } from 'react';
import Head from 'next/head';

const C = {p:'#1e3a5f',a:'#3b82f6',al:'#dbeafe',s:'#059669',w:'#d97706',d:'#dc2626',g:'#6b7280',lt:'#f9fafb',wh:'#ffffff'};

function Badge({label, color}: {label: string; color: string}) {
  return <span style={{
    display:'inline-block', padding:'4px 12px', borderRadius:'999px', fontSize:'0.75rem',
    fontWeight:600, backgroundColor:color+'22', color, border:'1px solid '+color+'44', margin:'4px'
  }}>{label}</span>;
}

function Section({id, title, badge, badgeColor, children, light}: {
  id:string; title:string; badge?:string; badgeColor?:string; children:React.ReactNode; light?:boolean;
}) {
  return <section id={id} style={{
    padding:'4rem 2rem', backgroundColor:light ? C.lt : C.wh, borderBottom:'1px solid #e5e7eb'
  }}>
    <div style={{maxWidth:'900px', margin:'0 auto'}}>
      <div style={{display:'flex', alignItems:'center', gap:'12px', marginBottom:'1.5rem', flexWrap:'wrap' as const}}>
        <h2 style={{fontSize:'1.75rem', fontWeight:700, color:C.p, margin:0}}>{title}</h2>
        {badge && <span style={{
          padding:'4px 10px', borderRadius:'6px', fontSize:'0.7rem', fontWeight:700,
          backgroundColor:(badgeColor ?? C.a)+'18', color:badgeColor ?? C.a,
          border:'1px solid '+(badgeColor ?? C.a)+'33', textTransform:'uppercase', letterSpacing:'0.05em'
        }}>{badge}</span>}
      </div>
      {children}
    </div>
  </section>;
}

function Card({children, highlight}: {children:React.ReactNode; highlight?:boolean}) {
  return <div style={{
    backgroundColor:highlight ? C.al : C.wh,
    border:'1px solid '+(highlight ? C.a+'40' : '#e5e7eb'),
    borderRadius:'12px', padding:'1.5rem', boxShadow:'0 2px 8px rgba(0,0,0,0.05)'
  }}>{children}</div>;
}

function ScoreBox({label, value, sub, color}: {label:string; value:number|string; sub:string; color:string}) {
  return <div style={{textAlign:'center', padding:'1.25rem', borderRadius:'10px', backgroundColor:C.wh, border:'1px solid #e5e7eb'}}>
    <div style={{fontSize:'0.65rem', color:C.g, marginBottom:'0.3rem', textTransform:'uppercase', letterSpacing:'0.06em'}}>{label}</div>
    <div style={{fontSize:'2.5rem', fontWeight:800, color}}>{value}</div>
    <div style={{fontSize:'0.75rem', color:C.g}}>{sub}</div>
  </div>;
}

function RiskCard({risk, mit}: {risk:string; mit:string}) {
  return <div style={{backgroundColor:C.wh, border:'1px solid #e5e7eb', borderRadius:'10px', padding:'1rem', fontSize:'0.85rem'}}>
    <div style={{fontWeight:700, color:C.d, marginBottom:'0.4rem'}}>⚠️ {risk}</div>
    <div style={{color:C.g, lineHeight:1.5}}>→ {mit}</div>
  </div>;
}

export default function Prototype() {
  const [form, setForm] = useState({supplierName:'', supplierCountry:'', providedTextDocs:'', paymentTerms:'', deliveryTerms:''});
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) => {
    setForm(f => ({...f, [e.target.name]: e.target.value}));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.supplierName || !form.supplierCountry) {
      setError('Supplier Name and Country are required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/evaluate-supplier', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Evaluation failed.'); setResult(null); }
      else { setResult(data); }
    } catch { setError('Network error. Please try again.'); setResult(null); }
    finally { setLoading(false); }
  };

  const handleReset = () => {
    setForm({supplierName:'', supplierCountry:'', providedTextDocs:'', paymentTerms:'', deliveryTerms:''});
    setResult(null);
    setError('');
  };

  const credColor = result
    ? (result.evaluationSummary.credibilityScore >= 70 ? C.s : result.evaluationSummary.credibilityScore >= 40 ? C.w : C.d)
    : C.g;

  return (
    <div style={{fontFamily:'system-ui, sans-serif', color:C.g, lineHeight:1.6}}>
      <Head><title>Supplier Risk Evaluator — Prototype</title></Head>

      <header style={{backgroundColor:C.p, color:C.wh, padding:'1.5rem 2rem'}}>
        <div style={{maxWidth:'900px', margin:'0 auto', display:'flex', alignItems:'center', gap:'1rem'}}>
          <span style={{fontSize:'1.5rem'}}>🔍</span>
          <div>
            <div style={{fontWeight:700, fontSize:'1.1rem'}}>Supplier AI Risk Evaluator</div>
            <div style={{fontSize:'0.8rem', opacity:0.8}}>AI-native prototype — Human-in-the-loop</div>
          </div>
          <div style={{marginLeft:'auto', display:'flex', gap:'8px'}}>
            <Badge label="Prototype" color={C.w} />
            <Badge label="AI Screening" color={C.a} />
          </div>
        </div>
      </header>

      <Section id="form" title="Evaluate a Supplier">
        <Card>
          <form onSubmit={handleSubmit}>
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap:'1rem', marginBottom:'1rem'}}>
              <div>
                <label style={{display:'block', fontSize:'0.8rem', fontWeight:600, color:C.p, marginBottom:'4px'}}>Supplier Name *</label>
                <input name="supplierName" value={form.supplierName} onChange={handleChange} placeholder="e.g. Acme Corp" style={inputStyle} />
              </div>
              <div>
                <label style={{display:'block', fontSize:'0.8rem', fontWeight:600, color:C.p, marginBottom:'4px'}}>Country *</label>
                <select name="supplierCountry" value={form.supplierCountry} onChange={handleChange} style={{...inputStyle, color: form.supplierCountry ? C.g : '#9ca3af'}}>
                  <option value="">Select country</option>
                  <option value="China">China</option><option value="India">India</option>
                  <option value="Germany">Germany</option><option value="Vietnam">Vietnam</option>
                  <option value="Brazil">Brazil</option><option value="Nigeria">Nigeria</option>
                  <option value="Russia">Russia</option><option value="United States">United States</option>
                </select>
              </div>
            </div>
            <div style={{marginBottom:'1rem'}}>
              <label style={{display:'block', fontSize:'0.8rem', fontWeight:600, color:C.p, marginBottom:'4px'}}>Documents / Notes Available</label>
              <textarea name="providedTextDocs" value={form.providedTextDocs} onChange={handleChange} rows={4}
                placeholder="Paste available documents, notes, or any text about the supplier..."
                style={{...inputStyle, resize:'vertical'}} />
            </div>
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap:'1rem', marginBottom:'1rem'}}>
              <div>
                <label style={{display:'block', fontSize:'0.8rem', fontWeight:600, color:C.p, marginBottom:'4px'}}>Payment Terms</label>
                <input name="paymentTerms" value={form.paymentTerms} onChange={handleChange} placeholder="e.g. Net 30, Wire transfer" style={inputStyle} />
              </div>
              <div>
                <label style={{display:'block', fontSize:'0.8rem', fontWeight:600, color:C.p, marginBottom:'4px'}}>Delivery Terms</label>
                <input name="deliveryTerms" value={form.deliveryTerms} onChange={handleChange} placeholder="e.g. FOB, CIF, Door-to-door" style={inputStyle} />
              </div>
            </div>
            {error && <div style={{padding:'0.75rem 1rem', borderRadius:'8px', backgroundColor:C.d+'14', color:C.d, border:'1px solid '+C.d+'33', marginBottom:'1rem', fontSize:'0.9rem'}}>{error}</div>}
            <div style={{display:'flex', gap:'0.75rem'}}>
              <button type="submit" disabled={loading} style={{
                padding:'0.75rem 1.5rem', borderRadius:'8px', backgroundColor:loading ? C.g : C.a,
                color:C.wh, fontWeight:700, fontSize:'0.95rem', border:'none', cursor:loading ? 'not-allowed' : 'pointer'
              }}>{loading ? 'Analyzing...' : 'Run AI Screening'}</button>
              <button type="button" onClick={handleReset} style={{
                padding:'0.75rem 1.5rem', borderRadius:'8px', backgroundColor:C.wh, color:C.g,
                fontWeight:600, fontSize:'0.95rem', border:'1px solid #e5e7eb', cursor:'pointer'
              }}>Reset</button>
            </div>
          </form>
        </Card>
      </Section>

      {result && <Section id="results" title="Evaluation Results" badge="Pending Human Action" badgeColor={C.s} light>
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'1rem', marginBottom:'1.5rem'}}>
          <ScoreBox label="Credibility Score" value={result.evaluationSummary.credibilityScore} sub={`/100 — ${result.evaluationSummary.countryRiskStatus}`} color={credColor} />
          <ScoreBox label="Completeness" value={result.evaluationSummary.completenessScore} sub="percent of dossier" color={C.a} />
        </div>

        <div style={{marginBottom:'1.25rem'}}>
          <div style={{fontWeight:700, color:C.p, marginBottom:'0.75rem'}}>Document Checklist</div>
          <div style={{display:'flex', flexWrap:'wrap', gap:'0.5rem'}}>
            {['Business Registration','Product Catalogue','Compliance Certificate','Delivery Agreement','Payment Terms Confirmation'].map(doc => (
              <span key={doc} style={{
                padding:'5px 12px', borderRadius:'6px', fontSize:'0.8rem', fontWeight:600,
                backgroundColor: result.gapAnalysis.presentDocuments.includes(doc) ? C.s+'14' : C.d+'14',
                color: result.gapAnalysis.presentDocuments.includes(doc) ? C.s : C.d,
                border:'1px solid '+(result.gapAnalysis.presentDocuments.includes(doc) ? C.s+'33' : C.d+'33')
              }}>{result.gapAnalysis.presentDocuments.includes(doc) ? '✓' : '✗'} {doc}</span>
            ))}
          </div>
        </div>

        {result.gapAnalysis.missingDocuments.length > 0 && <div style={{marginBottom:'1.25rem'}}>
          <div style={{fontWeight:700, color:C.d, marginBottom:'0.5rem'}}>Missing Documents</div>
          {result.gapAnalysis.missingDocuments.map((d: string) => (
            <div key={d} style={{padding:'0.5rem 0.75rem', borderRadius:'6px', backgroundColor:C.d+'14', color:C.d, fontSize:'0.85rem', marginBottom:'0.4rem', borderLeft:'3px solid '+C.d}}>{d}</div>
          ))}
        </div>}

        {result.redFlags.length > 0 ? <div style={{marginBottom:'1.25rem'}}>
          <div style={{fontWeight:700, color:C.d, marginBottom:'0.75rem'}}>Red Flags</div>
          {result.redFlags.map((rf: any, i: number) => <RiskCard key={i} risk={rf.flag} mit={rf.mitigation} />)}
        </div> : <div style={{padding:'0.75rem 1rem', borderRadius:'8px', backgroundColor:C.s+'14', color:C.s, marginBottom:'1.25rem'}}>✓ No significant red flags detected.</div>}

        <div style={{padding:'1rem 1.25rem', borderRadius:'8px', backgroundColor:C.a+'14', border:'1px solid '+C.a+'33', marginBottom:'1.25rem'}}>
          <div style={{fontWeight:700, color:C.p, marginBottom:'0.5rem'}}>Recommended Next Steps</div>
          <ul style={{margin:0, padding:'0 0 0 1.2rem', color:C.g}}>{result.recommendedNextSteps.map((s: string, i: number) => <li key={i}>{s}</li>)}</ul>
        </div>

        <div style={{display:'flex', gap:'0.75rem', flexWrap:'wrap'}}>
          <button style={{padding:'0.75rem 1.5rem', borderRadius:'8px', backgroundColor:C.s, color:C.wh, fontWeight:700, border:'none', cursor:'pointer'}}>✓ Approve Supplier</button>
          <button style={{padding:'0.75rem 1.5rem', borderRadius:'8px', backgroundColor:C.wh, color:C.d, fontWeight:700, border:'1px solid '+C.d, cursor:'pointer'}}>✗ Reject Supplier</button>
          <button style={{padding:'0.75rem 1.5rem', borderRadius:'8px', backgroundColor:C.wh, color:C.w, fontWeight:700, border:'1px solid '+C.w, cursor:'pointer'}}>⚠ Request More Info</button>
        </div>
      </Section>}

      <footer style={{backgroundColor:C.p, color:C.wh, padding:'2rem', textAlign:'center'}}>
        <div style={{fontSize:'0.85rem', opacity:0.8}}>Supplier AI Risk Evaluator — Prototype</div>
        <div style={{fontSize:'0.75rem', opacity:0.6, marginTop:'0.5rem'}}>AI does not make final decisions. Human reviewer approves or rejects all suppliers.</div>
      </footer>
    </div>
  );
}

const inputStyle = {
  width:'100%', padding:'0.625rem 0.875rem', borderRadius:'8px', border:'1px solid #e5e7eb',
  fontSize:'0.9rem', fontFamily:'inherit', backgroundColor:C.wh, color:C.g, outline:'none', boxSizing:'border-box' as const
};
