
const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>10-K Event Classifier</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f5f4;color:#1c1c1a;min-height:100vh;padding:2rem 1rem}
.container{max-width:900px;margin:0 auto}
h1{font-size:22px;font-weight:500;margin-bottom:4px}
.subtitle{font-size:14px;color:#6b6b67;margin-bottom:1.5rem}
.search-row{display:flex;gap:8px;margin-bottom:1.5rem}
.search-row input{flex:1;padding:10px 14px;border:0.5px solid #d3d1c7;border-radius:8px;font-size:15px;background:#fff;text-transform:uppercase;outline:none}
.search-row input::placeholder{text-transform:none}
.search-row input:focus{border-color:#888780}
.search-row button{padding:10px 22px;background:#1c1c1a;color:#fff;border:none;border-radius:8px;font-size:14px;cursor:pointer;white-space:nowrap}
.search-row button:hover{background:#3d3d3a}
.search-row button:disabled{opacity:.5;cursor:not-allowed}
.status{display:flex;align-items:center;gap:8px;font-size:13px;color:#6b6b67;padding:.75rem 1rem;background:#fff;border-radius:8px;border:0.5px solid #d3d1c7;margin-bottom:1rem}
.spinner{width:14px;height:14px;border:2px solid #d3d1c7;border-top-color:#6b6b67;border-radius:50%;animation:spin .7s linear infinite;flex-shrink:0}
@keyframes spin{to{transform:rotate(360deg)}}
.err{color:#a32d2d;font-size:13px;padding:.75rem 1rem;background:#fcebeb;border-radius:8px;border:0.5px solid #f09595;margin-bottom:1rem}
.section-label{font-size:11px;font-weight:500;letter-spacing:.06em;color:#888780;text-transform:uppercase;margin-bottom:8px}
.metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:1.5rem}
@media(max-width:600px){.metrics{grid-template-columns:repeat(2,1fr)}.two-col{grid-template-columns:1fr!important}}
.metric-card{background:#f1efe8;border-radius:8px;padding:.9rem 1rem}
.metric-label{font-size:12px;color:#6b6b67;margin-bottom:4px}
.metric-value{font-size:20px;font-weight:500}
.metric-sub{font-size:11px;color:#888780;margin-top:2px}
.two-col{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:1.5rem}
.card{background:#fff;border:0.5px solid #d3d1c7;border-radius:12px;padding:1rem 1.25rem;margin-bottom:0}
.top-event{display:flex;align-items:center;gap:10px;padding:.75rem 1rem;border-radius:8px;border:2px solid #185fa5;background:#e6f1fb;margin-bottom:1.25rem}
.top-event-label{font-size:11px;color:#185fa5;font-weight:500}
.top-event-name{font-size:15px;font-weight:500;color:#0c447c}
.top-event-score{font-size:24px;font-weight:500;color:#0c447c;margin-left:auto}
.event-row{display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:0.5px solid #e8e6df}
.event-row:last-child{border-bottom:none}
.event-name{font-size:13px;flex:1}
.bar-wrap{width:90px;height:6px;background:#e8e6df;border-radius:3px;overflow:hidden}
.bar-fill{height:100%;border-radius:3px}
.score-pill{font-size:11px;font-weight:500;padding:2px 8px;border-radius:4px;min-width:36px;text-align:center}
.factor-row{display:flex;align-items:flex-start;gap:8px;padding:6px 0;border-bottom:0.5px solid #e8e6df}
.factor-row:last-child{border-bottom:none}
.dot{width:8px;height:8px;border-radius:50%;margin-top:4px;flex-shrink:0}
.factor-name{font-size:12px;flex:1;line-height:1.4}
.factor-val{font-size:11px;color:#6b6b67;white-space:nowrap}
.nlp-box{background:#f5f5f4;border-radius:8px;padding:.9rem;font-size:13px;color:#6b6b67;line-height:1.6;margin-top:.5rem;min-height:72px}
.tag{display:inline-block;font-size:11px;padding:2px 8px;border-radius:4px;margin:2px 3px 2px 0;background:#faeeda;color:#854f0b}
.company-name{font-size:18px;font-weight:500;margin-bottom:3px}
.company-meta{font-size:13px;color:#6b6b67;margin-bottom:1.25rem}
.action-btn{width:100%;margin-top:1rem;padding:10px;background:#f1efe8;border:0.5px solid #d3d1c7;border-radius:8px;font-size:13px;cursor:pointer;color:#1c1c1a}
.action-btn:hover{background:#e8e6df}
#results{display:none}
.proxy-note{font-size:12px;color:#888780;margin-bottom:1rem;padding:.6rem .9rem;background:#f1efe8;border-radius:6px;border-left:3px solid #d3d1c7}
</style>
</head>
<body>
<div class="container">
  <h1>10-K Event Classifier</h1>
  <p class="subtitle">Enter any public company ticker to analyze their latest 10-K for major corporate events</p>

  <div class="search-row">
    <input type="text" id="ticker" placeholder="Enter ticker — e.g. MSFT, GE, INTC" maxlength="10"/>
    <button id="run-btn" onclick="runAnalysis()">Analyze 10-K</button>
  </div>
  <div class="proxy-note">Data sourced from SEC EDGAR (free, public). NLP analysis via Claude API.</div>

  <div id="status-area"></div>
  <div id="results"></div>
</div>

<script>
const PROXY = 'https://sec-edgar-proxy.pranav33.workers.dev/?url=';

async function pFetch(url) {
  const r = await fetch(PROXY + encodeURIComponent(url));
  if (!r.ok) throw new Error('Proxy fetch failed (' + r.status + ') for ' + url);
  return r;
}

const EVENT_TYPES = [
  {id:'ma',       label:'M&A activity',       color:'#378ADD'},
  {id:'distress', label:'Financial distress',  color:'#E24B4A'},
  {id:'restruc',  label:'Restructuring',       color:'#EF9F27'},
  {id:'fraud',    label:'Fraud / restatement', color:'#D4537E'},
  {id:'leader',   label:'Leadership change',   color:'#7F77DD'},
  {id:'reg',      label:'Regulatory action',   color:'#1D9E75'},
];

const EVENT_WEIGHTS = {
  ma:       {gw:3,capex:2,debt:2,seg:2,risk:1},
  distress: {fcf:3,dso:2,debt:3,gc:4,mw:2},
  restruc:  {seg:3,imp:3,capex:2,risk:1},
  fraud:    {mw:4,aud:3,rest:4,fcf:2},
  leader:   {mw:1,aud:2,risk:1,comp:2},
  reg:      {lit:3,risk:2,inv:3},
};

function setStatus(msg) {
  const a = document.getElementById('status-area');
  if (!msg) { a.innerHTML = ''; return; }
  a.innerHTML = '<div class="status"><div class="spinner"></div>' + msg + '</div>';
}
function showErr(msg) {
  setStatus('');
  document.getElementById('status-area').innerHTML = '<div class="err">' + msg + '</div>';
}

async function runAnalysis() {
  const ticker = document.getElementById('ticker').value.trim().toUpperCase();
  if (!ticker) { showErr('Enter a ticker symbol.'); return; }
  document.getElementById('results').style.display = 'none';
  document.getElementById('status-area').innerHTML = '';
  document.getElementById('run-btn').disabled = true;

  try {
    setStatus('Resolving ticker on SEC EDGAR...');
    const { cik, name } = await getCIK(ticker);
    setStatus('Fetching latest 10-K filing...');
    const { accession, filingDate } = await getLatest10K(cik);
    setStatus('Extracting XBRL financial data...');
    const fin = await getFinancials(cik);
    setStatus('Downloading MD&A text...');
    const mdaText = await getMDAText(cik, accession);
    setStatus('Running Claude NLP analysis...');
    const nlp = await runNLP(mdaText, ticker);
    setStatus('Scoring and classifying...');
    const factors = scoreFactors(fin, nlp);
    const events = scoreEvents(factors);
    setStatus('');
    renderResults(ticker, name, filingDate, fin, factors, events, nlp);
  } catch(e) {
    showErr('Analysis failed: ' + (e.message || 'Unknown error. Try a large-cap ticker like MSFT or GE.'));
  } finally {
    document.getElementById('run-btn').disabled = false;
  }
}

async function getCIK(ticker) {
  const r = await pFetch('https://www.sec.gov/files/company_tickers.json');
  const data = await r.json();
  const entry = Object.values(data).find(c => c.ticker === ticker);
  if (!entry) throw new Error('Ticker "' + ticker + '" not found on SEC EDGAR.');
  return { cik: String(entry.cik_str).padStart(10,'0'), name: entry.title };
}

async function getLatest10K(cik) {
  const r = await pFetch('https://data.sec.gov/submissions/CIK' + cik + '.json');
  const data = await r.json();
  const forms = data.filings.recent.form;
  const acc = data.filings.recent.accessionNumber;
  const dates = data.filings.recent.filingDate;
  for (let i = 0; i < forms.length; i++) {
    if (forms[i] === '10-K') return { accession: acc[i].replace(/-/g,''), filingDate: dates[i] };
  }
  throw new Error('No 10-K found for this ticker.');
}

async function getFinancials(cik) {
  const r = await pFetch('https://data.sec.gov/api/xbrl/companyfacts/CIK' + cik + '.json');
  const data = await r.json();
  const us = data.facts['us-gaap'] || {};

  function getAnnual(concept) {
    const c = us[concept];
    if (!c) return [];
    const key = Object.keys(c.units)[0];
    if (!key) return [];
    return c.units[key]
      .filter(e => e.form === '10-K' && e.fp === 'FY')
      .sort((a,b) => b.end.localeCompare(a.end))
      .slice(0,3);
  }

  const lat = arr => arr[0]?.val ?? null;
  const prv = arr => arr[1]?.val ?? null;
  const pct = (a,b) => (a == null || b == null || b === 0) ? null : (a-b)/Math.abs(b)*100;

  const rev   = getAnnual('Revenues').concat(getAnnual('RevenueFromContractWithCustomerExcludingAssessedTax')).sort((a,b)=>b.end.localeCompare(a.end));
  const ni    = getAnnual('NetIncomeLoss');
  const cfo   = getAnnual('NetCashProvidedByUsedInOperatingActivities');
  const capex = getAnnual('PaymentsToAcquirePropertyPlantAndEquipment');
  const gw    = getAnnual('Goodwill');
  const debt  = getAnnual('LongTermDebt');
  const ar    = getAnnual('AccountsReceivableNetCurrent');
  const imp   = getAnnual('GoodwillImpairmentLoss');

  const revN=lat(rev),revP=prv(rev),niN=lat(ni),cfoN=lat(cfo),capexN=lat(capex),capexP=prv(capex),gwN=lat(gw),gwP=prv(gw),debtN=lat(debt),debtP=prv(debt),arN=lat(ar),arP=prv(ar),impN=lat(imp)||0;

  return {
    revGrowth:     pct(revN,revP),
    fcfDivergence: (niN!=null&&cfoN!=null)?Math.abs(niN-cfoN)/Math.max(Math.abs(niN),1)*100:null,
    capexChange:   pct(capexN,capexP),
    goodwillStep:  pct(gwN,gwP),
    debtChange:    pct(debtN,debtP),
    dsoChange:     (arN&&arP&&revN&&revP)?((arN/revN)-(arP/revP))/(arP/revP)*100:null,
    hasImpairment: impN>0, impairmentAmt:impN,
    revN,niN,cfoN,capexN,gwN,debtN,
  };
}

async function getMDAText(cik,accession) {
  try {
    const cikInt = parseInt(cik);
    const idxUrl = 'https://www.sec.gov/Archives/edgar/data/'+cikInt+'/'+accession+'/'+accession+'-index.htm';
    const r = await pFetch(idxUrl);
    const html = await r.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html,'text/html');
    let docUrl = null;
    for (const a of doc.querySelectorAll('a')) {
      const h = a.getAttribute('href')||'';
      if (h.match(/\.(htm|html)$/i) && !h.toLowerCase().includes('index')) {
        docUrl = h.startsWith('http') ? h : 'https://www.sec.gov'+h;
        break;
      }
    }
    if (!docUrl) return 'MD&A text unavailable.';
    const r2 = await pFetch(docUrl);
    const fullHtml = await r2.text();
    const d2 = parser.parseFromString(fullHtml,'text/html');
    const text = d2.body?.innerText||d2.body?.textContent||'';
    const lower = text.toLowerCase();
    const start = Math.max(
      lower.indexOf("management's discussion"),
      lower.indexOf("management\u2019s discussion"),
      lower.indexOf("item 7.")
    );
    const end = lower.indexOf("item 7a",start+200);
    if (start>-1) return text.slice(start,end>-1?end:start+7000).slice(0,5000);
    return text.slice(0,5000);
  } catch(e) {
    return 'MD&A extraction failed.';
  }
}

async function runNLP(mdaText,ticker) {
  const prompt = 'You are a financial analyst. Analyze this 10-K MD&A excerpt for '+ticker+'. Return ONLY valid JSON, no markdown, no code fences:\n{"summary":"2-3 sentence summary","signals":{"goingConcern":false,"materialWeakness":false,"auditorChange":false,"restatement":false,"investigationLang":false,"litigationSpike":false,"newRiskFactors":false,"segmentChange":false,"comp":false},"riskTags":["tag1"],"sentiment":"positive","confidence":0.8}\n\nMD&A:\n'+mdaText.slice(0,4000);
  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({model:'claude-haiku-4-5-20251001',max_tokens:800,messages:[{role:'user',content:prompt}]})
    });
    const data = await resp.json();
    const raw = (data.content?.[0]?.text||'{}').replace(/\`\`\`[a-z]*/g,'').replace(/\`\`\`/g,'').trim();
    return JSON.parse(raw);
  } catch(e) {
    return {summary:'NLP unavailable.',signals:{},riskTags:[],sentiment:'neutral',confidence:0};
  }
}

function scoreFactors(fin,nlp) {
  const s = nlp.signals||{};
  const F = (id,label,triggered,value) => ({id,label,triggered,value});
  return [
    F('rev',  'Revenue growth YoY',       fin.revGrowth!=null&&(fin.revGrowth<-15||fin.revGrowth>40), fin.revGrowth!=null?fin.revGrowth.toFixed(1)+'%':'N/A'),
    F('fcf',  'FCF vs NI divergence',     fin.fcfDivergence!=null&&fin.fcfDivergence>50, fin.fcfDivergence!=null?fin.fcfDivergence.toFixed(0)+'%':'N/A'),
    F('capex','Capex change YoY',         fin.capexChange!=null&&Math.abs(fin.capexChange)>40, fin.capexChange!=null?fin.capexChange.toFixed(1)+'%':'N/A'),
    F('gw',   'Goodwill step-up',         fin.goodwillStep!=null&&fin.goodwillStep>25, fin.goodwillStep!=null?fin.goodwillStep.toFixed(1)+'%':'N/A'),
    F('debt', 'Long-term debt change',    fin.debtChange!=null&&(fin.debtChange>40||fin.debtChange<-30), fin.debtChange!=null?fin.debtChange.toFixed(1)+'%':'N/A'),
    F('dso',  'DSO change',               fin.dsoChange!=null&&fin.dsoChange>20, fin.dsoChange!=null?fin.dsoChange.toFixed(1)+'%':'N/A'),
    F('imp',  'Goodwill impairment',      fin.hasImpairment, fin.hasImpairment?'$'+fmtM(fin.impairmentAmt):'None'),
    F('gc',   'Going concern language',   !!s.goingConcern,  s.goingConcern?'Flagged':'Clear'),
    F('mw',   'Material weakness',        !!s.materialWeakness, s.materialWeakness?'Flagged':'Clear'),
    F('aud',  'Auditor change',           !!s.auditorChange, s.auditorChange?'Flagged':'Clear'),
    F('rest', 'Restatement language',     !!s.restatement,   s.restatement?'Flagged':'Clear'),
    F('inv',  'Investigation language',   !!s.investigationLang, s.investigationLang?'Flagged':'Clear'),
    F('lit',  'Litigation reserve spike', !!s.litigationSpike, s.litigationSpike?'Flagged':'Clear'),
    F('risk', 'New risk factors',         !!s.newRiskFactors, s.newRiskFactors?'Flagged':'Clear'),
    F('seg',  'Segment change',           !!s.segmentChange, s.segmentChange?'Flagged':'Clear'),
    F('comp', 'Leadership comp shift',    !!s.comp,          s.comp?'Flagged':'Clear'),
  ];
}

function scoreEvents(factors) {
  const fMap = Object.fromEntries(factors.map(f=>[f.id,f.triggered?1:0]));
  return EVENT_TYPES.map(et => {
    const w = EVENT_WEIGHTS[et.id]||{};
    let score=0, max=0;
    Object.entries(w).forEach(([id,wt])=>{max+=wt; score+=(fMap[id]||0)*wt;});
    return {...et, score: max>0?Math.round(score/max*100):0};
  }).sort((a,b)=>b.score-a.score);
}

function fmtM(v) {
  if (v==null) return 'N/A';
  if (Math.abs(v)>=1e9) return (v/1e9).toFixed(1)+'B';
  if (Math.abs(v)>=1e6) return (v/1e6).toFixed(0)+'M';
  return v.toLocaleString();
}

function renderResults(ticker,name,filingDate,fin,factors,events,nlp) {
  const top = events[0];
  const sentBg = nlp.sentiment==='positive'?'#eaf3de':nlp.sentiment==='negative'||nlp.sentiment==='cautious'?'#faeeda':'#f1efe8';
  const sentC  = nlp.sentiment==='positive'?'#3b6d11':nlp.sentiment==='negative'||nlp.sentiment==='cautious'?'#854f0b':'#6b6b67';

  const evHtml = events.map(e=>{
    const bb=e.score>60?'#fcebeb':e.score>30?'#faeeda':'#f1efe8';
    const bc=e.score>60?'#a32d2d':e.score>30?'#854f0b':'#6b6b67';
    return '<div class="event-row"><div style="width:8px;height:8px;border-radius:50%;background:'+e.color+';flex-shrink:0"></div><span class="event-name">'+e.label+'</span><div class="bar-wrap"><div class="bar-fill" style="width:'+e.score+'%;background:'+e.color+'"></div></div><span class="score-pill" style="background:'+bb+';color:'+bc+'">'+e.score+'%</span></div>';
  }).join('');

  const fHtml = factors.map(f=>'<div class="factor-row"><div class="dot" style="background:'+(f.triggered?'#E24B4A':'#639922')+'"></div><span class="factor-name">'+f.label+'</span><span class="factor-val">'+f.value+'</span></div>').join('');

  const tags = (nlp.riskTags||[]).map(t=>'<span class="tag">'+t+'</span>').join('') || '<span style="font-size:12px;color:#888780">No tags extracted</span>';

  document.getElementById('results').innerHTML =
    '<div class="company-name">'+name+'</div>'+
    '<div class="company-meta">'+ticker+' &nbsp;&middot;&nbsp; 10-K filed '+filingDate+'</div>'+
    '<div class="top-event"><div><div class="top-event-label">Top classification</div><div class="top-event-name">'+top.label+'</div></div><div class="top-event-score">'+top.score+'%</div></div>'+
    '<div class="section-label">Financial metrics</div>'+
    '<div class="metrics">'+
      '<div class="metric-card"><div class="metric-label">Revenue (FY)</div><div class="metric-value">$'+fmtM(fin.revN)+'</div><div class="metric-sub">YoY '+(fin.revGrowth!=null?fin.revGrowth.toFixed(1)+'%':'N/A')+'</div></div>'+
      '<div class="metric-card"><div class="metric-label">Net income</div><div class="metric-value">$'+fmtM(fin.niN)+'</div><div class="metric-sub">FCF div. '+(fin.fcfDivergence!=null?fin.fcfDivergence.toFixed(0)+'%':'N/A')+'</div></div>'+
      '<div class="metric-card"><div class="metric-label">Long-term debt</div><div class="metric-value">$'+fmtM(fin.debtN)+'</div><div class="metric-sub">YoY '+(fin.debtChange!=null?fin.debtChange.toFixed(1)+'%':'N/A')+'</div></div>'+
      '<div class="metric-card"><div class="metric-label">Goodwill</div><div class="metric-value">$'+fmtM(fin.gwN)+'</div><div class="metric-sub">YoY '+(fin.goodwillStep!=null?fin.goodwillStep.toFixed(1)+'%':'N/A')+'</div></div>'+
    '</div>'+
    '<div class="two-col">'+
      '<div class="card"><div class="section-label">Event classification</div>'+evHtml+'</div>'+
      '<div class="card"><div class="section-label">Factor scorecard</div>'+fHtml+'</div>'+
    '</div>'+
    '<div class="card" style="margin-bottom:1rem">'+
      '<div class="section-label">AI analysis &nbsp;&middot;&nbsp; MD&amp;A sentiment: <span style="background:'+sentBg+';color:'+sentC+';padding:1px 8px;border-radius:4px;font-size:11px;font-weight:500">'+( nlp.sentiment||'neutral')+'</span></div>'+
      '<div class="nlp-box">'+( nlp.summary||'No summary available.')+'</div>'+
      '<div style="margin-top:10px">'+tags+'</div>'+
    '</div>';

  document.getElementById('results').style.display = 'block';
}

document.getElementById('ticker').addEventListener('keydown',e=>{if(e.key==='Enter')runAnalysis();});
</script>
</body>
</html>`;

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === '/' || url.pathname === '/index.html') {
      return new Response(HTML, {
        headers: { 'Content-Type': 'text/html;charset=UTF-8' },
      });
    }
    return new Response('Not found', { status: 404 });
  },
};
