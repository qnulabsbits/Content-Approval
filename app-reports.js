/* ═══════════════════════════════════════════════════════════
   MONTHLY REPORTS MODULE — app-reports.js
   Single-scroll report page with charts and modal drilldowns
═══════════════════════════════════════════════════════════ */

const REPORT_LOGO_URL = 'logo.png';

function loadReports() {
  const c = $('pg-reports');
  if (!c) return;
  c.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">Monthly Reports</div>
        <div class="page-sub">Marketing & Business Intelligence · QNu Labs</div>
      </div>
      <div class="page-actions">
        <button onclick="downloadReport()" class="btn btn-secondary btn-sm">⬇ Download HTML</button>
      </div>
    </div>
    <div id="reportContainer">
      ${buildFullReport()}
    </div>
  `;
  // Init charts after render
  setTimeout(() => {
    renderGeoChart();
    renderTempChart();
    renderEventChart();
  }, 100);
}

function downloadReport() {
  const html = document.getElementById('reportContainer').outerHTML;
  const full = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>QNu Labs · Monthly Marketing Report · November 2026</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js"><\/script>
<style>
${getReportCSS()}
</style>
</head>
<body style="background:#f3f4f6;font-family:Inter,system-ui,sans-serif">
${html}
<script>
${getReportChartsJS()}
document.addEventListener('DOMContentLoaded',function(){renderGeoChart();renderTempChart();renderEventChart();});
<\/script>
</body>
</html>`;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([full], { type: 'text/html' }));
  a.download = 'QNu_Marketing_Report_Nov2026.html';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(a.href), 1500);
  toast('Report downloaded.');
}

function getReportCSS() {
  return `
:root { --bg:#F3F4F6;--surface:#fff;--surface2:#F9FAFB;--border:#E5E7EB;
  --text:#111827;--muted:#6B7280;--accent:#E8460A;--navy:#0E2841;
  --green:#10B981;--blue:#3B82F6;--r:8px; }
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--bg);color:var(--text);font-size:13px;line-height:1.6}
.rpt-wrap{max-width:1100px;margin:0 auto;padding:24px}
.rpt-header{background:var(--navy);border-radius:var(--r);padding:28px 32px;margin-bottom:20px;display:flex;align-items:center;justify-content:space-between}
.rpt-header-logo{height:36px;filter:brightness(0) invert(1)}
.rpt-header-title{font-size:22px;font-weight:800;color:#fff}
.rpt-header-sub{font-size:13px;color:rgba(255,255,255,0.6);margin-top:2px}
.rpt-header-badge{font-size:11px;color:var(--accent);background:rgba(232,70,10,0.15);border:1px solid rgba(232,70,10,0.3);border-radius:20px;padding:4px 12px}
.rpt-section{margin-bottom:24px}
.rpt-section-title{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--muted);margin-bottom:12px;padding-bottom:8px;border-bottom:2px solid var(--accent)}
.rpt-kpi-row{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px}
.rpt-kpi{background:var(--surface);border:1.5px solid var(--border);border-radius:var(--r);padding:16px;cursor:pointer;transition:border-color 0.15s,transform 0.1s}
.rpt-kpi:hover{border-color:var(--accent);transform:translateY(-1px)}
.rpt-kpi.accent{background:var(--accent);border-color:var(--accent)}
.rpt-kpi-num{font-size:28px;font-weight:800;color:var(--accent);line-height:1;margin-bottom:4px}
.rpt-kpi.accent .rpt-kpi-num{color:#fff}
.rpt-kpi-lbl{font-size:12px;font-weight:600;color:var(--text);margin-bottom:2px}
.rpt-kpi.accent .rpt-kpi-lbl{color:#fff}
.rpt-kpi-sub{font-size:11px;color:var(--muted)}
.rpt-kpi.accent .rpt-kpi-sub{color:rgba(255,255,255,0.75)}
.rpt-kpi-hint{font-size:10px;color:var(--accent);margin-top:6px;font-style:italic}
.rpt-kpi.accent .rpt-kpi-hint{color:rgba(255,255,255,0.8)}
.rpt-two{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px}
.rpt-three{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:20px}
.rpt-card{background:var(--surface);border:1.5px solid var(--border);border-radius:var(--r);padding:16px}
.rpt-card-title{font-size:13px;font-weight:700;margin-bottom:10px;color:var(--navy)}
.rpt-table{width:100%;border-collapse:collapse;font-size:12px}
.rpt-table th{background:var(--navy);color:#fff;padding:8px 10px;text-align:left;font-size:11px;font-weight:600}
.rpt-table td{padding:8px 10px;border-bottom:1px solid var(--border);vertical-align:top}
.rpt-table tr:hover td{background:#FFF3EE}
.rpt-table tr:last-child td{border-bottom:none}
.rpt-badge{display:inline-block;font-size:10px;font-weight:600;padding:2px 8px;border-radius:20px;white-space:nowrap}
.b-hot{background:#FDE8E8;color:#C53030}
.b-warm{background:#FFF3E0;color:#E65100}
.b-cold{background:#F3F4F6;color:#6B7280}
.b-intl{background:#E3F2FD;color:#1565C0}
.b-india{background:#E8F5E9;color:#2E7D32}
.b-org{background:#FFF3EE;color:var(--accent)}
.rpt-so-what{border:1.5px solid #FCD9CC;background:#FFF7F5;border-radius:var(--r);padding:12px 16px;margin-bottom:16px}
.rpt-so-what-lbl{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--accent);margin-bottom:4px}
.rpt-so-what-text{font-size:13px;color:var(--navy);line-height:1.6}
.rpt-ka{background:var(--accent);border-radius:var(--r);padding:14px 18px;margin-bottom:16px}
.rpt-ka-lbl{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:rgba(255,255,255,0.7);margin-bottom:4px}
.rpt-ka-text{font-size:14px;font-weight:600;color:#fff;line-height:1.5}
.rpt-pills{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.rpt-pill{font-size:12px;padding:4px 11px;border-radius:20px;background:#FFF3EE;color:var(--accent);font-weight:500;border:1px solid #FCD9CC}
.rpt-chart-wrap{position:relative;height:220px;margin-top:8px}
.rpt-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:99999;display:none;align-items:flex-start;justify-content:center;padding:40px 16px;overflow-y:auto}
.rpt-modal-overlay.show{display:flex}
.rpt-modal{background:#fff;border-radius:10px;width:100%;max-width:980px;margin:auto;box-shadow:0 24px 64px rgba(0,0,0,0.3)}
.rpt-modal-hdr{background:var(--navy);padding:16px 20px;display:flex;align-items:center;justify-content:space-between;border-radius:10px 10px 0 0;border-bottom:3px solid var(--accent)}
.rpt-modal-title{font-size:15px;font-weight:700;color:#fff}
.rpt-modal-sub{font-size:12px;color:rgba(255,255,255,0.55);margin-top:2px}
.rpt-modal-close{width:30px;height:30px;border-radius:50%;background:rgba(255,255,255,0.12);border:none;color:#fff;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center}
.rpt-modal-body{padding:20px;max-height:72vh;overflow-y:auto}
.rpt-filter-row{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px;align-items:center}
.rpt-filter-btn{padding:5px 12px;border-radius:20px;border:1.5px solid var(--border);background:none;font-size:12px;font-weight:500;color:var(--muted);cursor:pointer;transition:all 0.12s}
.rpt-filter-btn:hover,.rpt-filter-btn.on{background:var(--accent);color:#fff;border-color:var(--accent)}
.rpt-search{padding:7px 12px;border:1.5px solid var(--border);border-radius:var(--r);font-size:12px;width:240px;outline:none;font-family:inherit}
.rpt-search:focus{border-color:var(--accent)}
.rpt-stat-bar{display:flex;gap:16px;padding:12px 14px;background:#FFF7F5;border-radius:var(--r);margin-bottom:14px;flex-wrap:wrap}
.rpt-stat-item{text-align:center}
.rpt-stat-num{font-size:20px;font-weight:800;color:var(--navy)}
.rpt-stat-lbl{font-size:10px;color:var(--muted)}
.exprow{background:var(--surface);border:1.5px solid var(--border);border-radius:var(--r);margin-bottom:10px;overflow:hidden}
.exph{display:flex;align-items:center;justify-content:space-between;padding:12px 15px;cursor:pointer;transition:background 0.1s;gap:10px}
.exph:hover{background:#F9FAFB}
.exph.open{background:#FFF7F5;border-bottom:1.5px solid #FCD9CC}
.exph-title{font-size:13px;font-weight:600;color:var(--navy)}
.expb{display:none;padding:14px 16px}
.exph.open+.expb{display:block}
.chev{width:22px;height:22px;border-radius:50%;background:var(--border);display:flex;align-items:center;justify-content:center;font-size:10px;flex-shrink:0;transition:transform 0.18s,background 0.12s}
.exph.open .chev{transform:rotate(180deg);background:var(--accent);color:#fff}
@media(max-width:768px){.rpt-kpi-row{grid-template-columns:1fr 1fr}.rpt-two,.rpt-three{grid-template-columns:1fr}}
  `;
}

function getReportChartsJS() {
  return `
const LEADS_DATA=${JSON.stringify(RPT_LEADS)};
function renderGeoChart(){
  const ctx=document.getElementById('rptGeoChart');if(!ctx)return;
  const india=LEADS_DATA.filter(l=>l.geo==='India').length;
  const intl=LEADS_DATA.filter(l=>l.geo==='International').length;
  new Chart(ctx,{type:'doughnut',data:{labels:['India','International'],datasets:[{data:[india,intl],backgroundColor:['#10B981','#3B82F6'],borderWidth:0}]},options:{plugins:{legend:{position:'bottom',labels:{font:{size:11},padding:10}}},cutout:'65%',maintainAspectRatio:false}});
}
function renderTempChart(){
  const ctx=document.getElementById('rptTempChart');if(!ctx)return;
  const hot=LEADS_DATA.filter(l=>l.temp==='Hot').length;
  const warm=LEADS_DATA.filter(l=>l.temp==='Warm').length;
  const cold=LEADS_DATA.filter(l=>l.temp==='Cold').length;
  const unclass=LEADS_DATA.filter(l=>l.temp==='Unclassified').length;
  new Chart(ctx,{type:'doughnut',data:{labels:['Hot','Warm','Cold','Unclassified'],datasets:[{data:[hot,warm,cold,unclass],backgroundColor:['#EF4444','#F59E0B','#9CA3AF','#D1D5DB'],borderWidth:0}]},options:{plugins:{legend:{position:'bottom',labels:{font:{size:11},padding:8}}},cutout:'60%',maintainAspectRatio:false}});
}
function renderEventChart(){
  const ctx=document.getElementById('rptEventChart');if(!ctx)return;
  const events={};
  LEADS_DATA.forEach(l=>{const e=l.event||'Other';events[e]=(events[e]||0)+1;});
  const sorted=Object.entries(events).sort((a,b)=>b[1]-a[1]).slice(0,8);
  new Chart(ctx,{type:'bar',data:{labels:sorted.map(e=>e[0].length>18?e[0].slice(0,18)+'…':e[0]),datasets:[{label:'Leads',data:sorted.map(e=>e[1]),backgroundColor:'#E8460A',borderRadius:4}]},options:{indexAxis:'y',plugins:{legend:{display:false}},scales:{x:{grid:{display:false}},y:{ticks:{font:{size:10}}}},maintainAspectRatio:false}});
}
  `;
}

// ── Lead data ─────────────────────────────────────────────────────
const RPT_LEADS = [
  {name:"Prasheel Suryawanshi",company:"Jagran Lakecity University",phone:"+917471110114",owner:"Marketing Team",event:"Website/Organic",month:"Nov",date:"23 Nov 2026",temp:"Unclassified",geo:"India",reason:"No message / description"},
  {name:"Yogesh M R",company:"Ampcus Cyber",phone:"+918147255897",owner:"Sagar Pandey",event:"Website/Organic",month:"Nov",date:"23 Nov 2026",temp:"Hot",geo:"India",reason:"Looking for banking use cases + has clients"},
  {name:"Makara",company:"PSCYBER",phone:"+85510654046",owner:"Sagar Pandey",event:"Website/Organic",month:"Nov",date:"20 Nov 2026",temp:"Hot",geo:"International",reason:"Direct outreach requested"},
  {name:"Srinivasan V D",company:"Virtusa Consulting",phone:"+919000153642",owner:"Sagar Pandey",event:"Website/Organic",month:"Nov",date:"20 Nov 2026",temp:"Hot",geo:"India",reason:"PQC strategy evaluation underway"},
  {name:"Senthilnathan Thirumaran",company:"Mpac Group",phone:"+918754142844",owner:"Sagar Pandey",event:"Website/Organic",month:"Nov",date:"03 Nov 2026",temp:"Hot",geo:"India",reason:"Partnership interest — quantum in robotics"},
  {name:"D Christinal Mary",company:"MJC Global Tech",phone:"+919886018764",owner:"Sagar Pandey",event:"Website/Organic",month:"Nov",date:"16 Nov 2026",temp:"Hot",geo:"India",reason:"Telecom partnership interest"},
  {name:"Puja",company:"AegisQX",phone:"+919546826854",owner:"Sagar Pandey",event:"Website/Organic",month:"Nov",date:"12 Nov 2026",temp:"Hot",geo:"India",reason:"Requested quotation / pricing"},
  {name:"Ricky Dewan",company:"Suffescom Solutions",phone:"+16186880472",owner:"Sagar Pandey",event:"Website/Organic",month:"Nov",date:"14 Nov 2026",temp:"Hot",geo:"International",reason:"Strategic partnership interest"},
  {name:"Paresh Saxena",company:"BITS Pilani Hyderabad",phone:"+917023822261",owner:"Hermaan Kohli",event:"Website/Organic",month:"Oct",date:"31 Oct 2026",temp:"Hot",geo:"India",reason:"Requested pricing — QKD, QRNG, PQC"},
  {name:"PERVEZ AHKTER",company:"SEAVIEW LIMITED",phone:"+64035480321",owner:"Marketing Team",event:"Website/Organic",month:"Oct",date:"28 Oct 2026",temp:"Hot",geo:"International",reason:"Requested quotation / pricing"},
  {name:"Anupam Kumar Srivastava",company:"Creative Synergies Group",phone:"+919886198763",owner:"Marketing Team",event:"Website/Organic",month:"Oct",date:"11 Oct 2026",temp:"Hot",geo:"India",reason:"Certification and learning program inquiry"},
  {name:"Phil Lindsay-Crisp",company:"SeQure AG",phone:"+44 7703 322360",owner:"Sudiptaa Paul Choudhury",event:"Quantum + AI Tech Show 4Nov2026",month:"Nov",date:"18 Nov 2026",temp:"Warm",geo:"International",reason:"Partnership interest"},
  {name:"Shankar S Mantha",company:"Ramdeobaba University",phone:"+919820439978",owner:"Hermaan Kohli",event:"Goa Conclave",month:"Oct",date:"29 Oct 2026",temp:"Warm",geo:"India",reason:"Quantum lab setup inquiry"},
  {name:"Sandhya Pentareddy",company:"VIT",phone:"+919080945681",owner:"Hermaan Kohli",event:"Goa Conclave",month:"Oct",date:"29 Oct 2026",temp:"Warm",geo:"India",reason:"Partnership interest — existing MoU"},
  {name:"Harshavardhan Patil",company:"Pimpri Chinchwad University",phone:"+919766327272",owner:"Hermaan Kohli",event:"Goa Conclave",month:"Oct",date:"29 Oct 2026",temp:"Warm",geo:"India",reason:"Quantum lab setup inquiry"},
  {name:"BARATAM PRANEETH GUPTA",company:"SRM University AP",phone:"+918610231150",owner:"Marketing Team",event:"Website/Organic",month:"Oct",date:"15 Oct 2026",temp:"Warm",geo:"India",reason:"Partnership interest — Qiskit Fest"},
  {name:"Aaron Keith",company:"SIGMA Equipment",phone:"+18123038338",owner:"Sagar Pandey",event:"Website/Organic",month:"Nov",date:"12 Nov 2026",temp:"Warm",geo:"International",reason:"Collaboration interest"},
  {name:"Matthew Jones",company:"Innovate UK",phone:"0000000000",owner:"Sudiptaa Paul Choudhury",event:"Quantum + AI Tech Show 4Nov2026",month:"Nov",date:"18 Nov 2026",temp:"Unclassified",geo:"India",reason:"UK Govt innovation"},
  {name:"Risa Miyazaki",company:"JETRO London",phone:"+44 (0)20 7421 8335",owner:"Sudiptaa Paul Choudhury",event:"Quantum + AI Tech Show 4Nov2026",month:"Nov",date:"18 Nov 2026",temp:"Unclassified",geo:"International",reason:"Japan market entry — J-Bridge"},
  {name:"Thanakorn Bamrungkitjaroen",company:"Orbix Technology (KBank)",phone:"0000000000",owner:"Sudiptaa Paul Choudhury",event:"Thailand Roundtable 2026",month:"Nov",date:"05 Nov 2026",temp:"Unclassified",geo:"India",reason:"KBank subsidiary"},
  {name:"Monchai Lertsutthiwong",company:"KASIKORN Business-Technology Group",phone:"0000000000",owner:"Sudiptaa Paul Choudhury",event:"Thailand Roundtable 2026",month:"Nov",date:"03 Nov 2026",temp:"Unclassified",geo:"India",reason:"Hot account"},
  {name:"Skunpoj Thanarojsophon",company:"Bank of Thailand",phone:"0000000017",owner:"Hermaan Kohli",event:"Thailand Roundtable 2026",month:"Nov",date:"05 Nov 2026",temp:"Unclassified",geo:"India",reason:"Central bank"},
  {name:"Ian Gillard",company:"Bangkok Bank",phone:"0000000014",owner:"Sudiptaa Paul Choudhury",event:"Thailand Roundtable 2026",month:"Nov",date:"05 Nov 2026",temp:"Unclassified",geo:"India",reason:"Hot account"},
  {name:"Vijay Kumar Verma",company:"Jio Platforms Ltd",phone:"96500 89918",owner:"Marketing Team",event:"CISO6 Mumbai",month:"Oct",date:"15 Oct 2026",temp:"Unclassified",geo:"India",reason:"No message"},
  {name:"Shailendra Mishra",company:"Deloitte",phone:"9004202127",owner:"Marketing Team",event:"CISO6 Mumbai",month:"Oct",date:"15 Oct 2026",temp:"Unclassified",geo:"India",reason:"No message"},
  {name:"Ankur Dubey",company:"HSBC Technology India",phone:"9890790832",owner:"Marketing Team",event:"CISO6 Mumbai",month:"Oct",date:"15 Oct 2026",temp:"Unclassified",geo:"India",reason:"No message"},
  {name:"Sachin Kawalkar",company:"Neeyamo",phone:"9320108242",owner:"Marketing Team",event:"CISO6 Mumbai",month:"Oct",date:"15 Oct 2026",temp:"Unclassified",geo:"India",reason:"No message"},
  {name:"Pankit Desai",company:"Sequretek",phone:"7738192761",owner:"Marketing Team",event:"CISO6 Mumbai",month:"Oct",date:"15 Oct 2026",temp:"Unclassified",geo:"India",reason:"No message"},
  {name:"Gaurav Hirani",company:"JIO",phone:"9833172996",owner:"Marketing Team",event:"CISO6 Mumbai",month:"Oct",date:"15 Oct 2026",temp:"Unclassified",geo:"India",reason:"No message"},
  {name:"Pushkar Karandikar",company:"CDSL",phone:"+917045457125",owner:"Sagar Pandey",event:"Pragati",month:"Oct",date:"06 Oct 2026",temp:"Unclassified",geo:"India",reason:"Interest in QShield 2.0"},
  {name:"Priya P",company:"C-DOT",phone:"0000000000",owner:"Sagar Pandey",event:"Pragati",month:"Oct",date:"06 Oct 2026",temp:"Unclassified",geo:"India",reason:"Share integration options"},
  {name:"Abdul Gaffar Sk",company:"Bank of Maharashtra",phone:"+917386196103",owner:"Sagar Pandey",event:"Website/Organic",month:"Oct",date:"19 Oct 2026",temp:"Unclassified",geo:"India",reason:"Exploring BOM solutions"},
  {name:"Harshad Sawant",company:"IFTAS",phone:"+919820059020",owner:"Sagar Pandey",event:"Website/Organic",month:"Oct",date:"21 Oct 2026",temp:"Unclassified",geo:"India",reason:"xBoM evaluation + demo request"},
  {name:"Roshan Noronha",company:"Undisclosed",phone:"+917760124245",owner:"Sagar Pandey",event:"Website/Organic",month:"Oct",date:"16 Oct 2026",temp:"Unclassified",geo:"India",reason:"Quantum Safe Transformation for telecom"},
  {name:"Laia",company:"Barclays",phone:"+447384232218",owner:"Sagar Pandey",event:"Website/Organic",month:"Oct",date:"13 Oct 2026",temp:"Unclassified",geo:"International",reason:"Whitepaper request"},
  {name:"Niraj Tiwari",company:"Advanced Photonics",phone:"+918929993465",owner:"Sagar Pandey",event:"Pragati",month:"Oct",date:"06 Oct 2026",temp:"Unclassified",geo:"India",reason:"Photonics — potential partner"},
  {name:"Ashik Kabeer",company:"Crossgen Technologies",phone:"+919747971177",owner:"Sagar Pandey",event:"Website/Organic",month:"Oct",date:"05 Oct 2026",temp:"Unclassified",geo:"India",reason:"QRNG for tender"},
];

const RPT_CANNES = [
  {company:"Schneider Electric",sector:"Energy / Industrial",country:"France",pipeline:"₹5 Cr",signal:"Critical infrastructure — post-quantum urgency"},
  {company:"TotalEnergies",sector:"Energy",country:"France",pipeline:"₹5 Cr",signal:"Quantum security for OT/IT convergence"},
  {company:"Jefferies",sector:"Investment Banking",country:"USA/UK",pipeline:"₹7 Cr",signal:"BFSI — financial data protection"},
  {company:"Intesa Sanpaolo",sector:"Banking",country:"Italy",pipeline:"₹6 Cr",signal:"Major EU bank — PQC migration mandate"},
  {company:"UBS",sector:"Banking / Wealth Mgmt",country:"Switzerland",pipeline:"₹6 Cr",signal:"Global bank — NIST PQC adoption"},
  {company:"Capgemini",sector:"IT Services",country:"France",pipeline:"₹4 Cr",signal:"System integrator — QKD deployment"},
  {company:"France Quantum Institute",sector:"Research / Govt",country:"France",pipeline:"₹2 Cr",signal:"Strategic research partnership"},
];

// ── Main report builder ───────────────────────────────────────────
function buildFullReport() {
  const hot = RPT_LEADS.filter(l=>l.temp==='Hot').length;
  const warm = RPT_LEADS.filter(l=>l.temp==='Warm').length;
  const intl = RPT_LEADS.filter(l=>l.geo==='International').length;
  const india = RPT_LEADS.filter(l=>l.geo==='India').length;
  const nov = RPT_LEADS.filter(l=>l.month==='Nov').length;
  const oct = RPT_LEADS.filter(l=>l.month==='Oct').length;

  return `
  <div class="rpt-wrap">

    <!-- HEADER -->
    <div class="rpt-header">
      <div>
        <div class="rpt-header-title">Monthly Marketing Report</div>
        <div class="rpt-header-sub">November 2026 · QNu Labs · Strictly Private & Confidential</div>
      </div>
      <div style="display:flex;align-items:center;gap:12px">
        <span class="rpt-header-badge">qnulabs.com</span>
        <img src="${REPORT_LOGO_URL}" class="rpt-header-logo" alt="QNu Labs" onerror="this.style.display='none'"/>
      </div>
    </div>

    <!-- KEY ASK -->
    <div class="rpt-ka">
      <div class="rpt-ka-lbl">Key Ask</div>
      <div class="rpt-ka-text">Route Cannes 7 hot leads to BU International immediately. ₹39 Cr international pipeline is new and not yet in the sales deck. Telecom GTM approved: coordinate with BU India on Jio, Airtel, Vi, BSNL outreach.</div>
    </div>

    <!-- SO WHAT -->
    <div class="rpt-so-what">
      <div class="rpt-so-what-lbl">So What</div>
      <div class="rpt-so-what-text">₹39 Cr international pipeline is new and not yet in the sales deck. Marketing is now reaching the same three segments that drive pipeline: BFSI (international banks), Academy (UAE, Maharashtra) and Telecom (India GTM approved). Japan market entry now live via JETRO.</div>
    </div>

    <!-- KPI ROW 1 -->
    <div class="rpt-section">
      <div class="rpt-section-title">Pipeline & Leads</div>
      <div class="rpt-kpi-row">
        <div class="rpt-kpi accent" onclick="rptOpenModal('pipeline')">
          <div class="rpt-kpi-num">₹39 Cr</div>
          <div class="rpt-kpi-lbl">International Pipeline</div>
          <div class="rpt-kpi-sub">Cannes ₹35 Cr + Luxembourg ₹4 Cr</div>
          <div class="rpt-kpi-hint">↗ Click for all lead details</div>
        </div>
        <div class="rpt-kpi" onclick="rptOpenModal('hotaccs')">
          <div class="rpt-kpi-num">9</div>
          <div class="rpt-kpi-lbl">Hot Enterprise Accounts</div>
          <div class="rpt-kpi-sub">From events this month</div>
          <div class="rpt-kpi-hint">↗ Click to see all 9 names</div>
        </div>
        <div class="rpt-kpi" onclick="rptOpenModal('allleads')">
          <div class="rpt-kpi-num">80</div>
          <div class="rpt-kpi-lbl">November Leads</div>
          <div class="rpt-kpi-sub">Event & digital combined</div>
          <div class="rpt-kpi-hint">↗ Click for full CRM data</div>
        </div>
        <div class="rpt-kpi" onclick="rptOpenModal('allleads_oct')">
          <div class="rpt-kpi-num">345</div>
          <div class="rpt-kpi-lbl">October Leads</div>
          <div class="rpt-kpi-sub">CISO6 Mumbai: 239</div>
          <div class="rpt-kpi-hint">↗ Click for all CRM data</div>
        </div>
      </div>
    </div>

    <!-- CHARTS ROW -->
    <div class="rpt-section">
      <div class="rpt-section-title">Lead Analytics</div>
      <div class="rpt-three">
        <div class="rpt-card">
          <div class="rpt-card-title">India vs International</div>
          <div class="rpt-chart-wrap"><canvas id="rptGeoChart"></canvas></div>
        </div>
        <div class="rpt-card">
          <div class="rpt-card-title">Lead Temperature</div>
          <div class="rpt-chart-wrap"><canvas id="rptTempChart"></canvas></div>
        </div>
        <div class="rpt-card">
          <div class="rpt-card-title">Leads by Event</div>
          <div class="rpt-chart-wrap" style="height:220px"><canvas id="rptEventChart"></canvas></div>
        </div>
      </div>
    </div>

    <!-- EVENTS -->
    <div class="rpt-section">
      <div class="rpt-section-title">November Events & Leads</div>
      <div class="rpt-two" style="margin-bottom:0">
        <div>
          <div class="exprow">
            <div class="exph" onclick="this.classList.toggle('open')">
              <div style="display:flex;align-items:center;gap:8px">
                <span class="exph-title">World Quantum Cannes Festival</span>
                <span class="rpt-badge b-org">₹35 Cr</span>
              </div>
              <div style="display:flex;align-items:center;gap:6px">
                <span style="font-size:11px;color:var(--muted)">17–18 Nov · 7 hot leads</span>
                <div class="chev">▼</div>
              </div>
            </div>
            <div class="expb">
              <div class="rpt-pills">${RPT_CANNES.map(c=>`<span class="rpt-pill">${c.company}</span>`).join('')}</div>
              <div style="margin-top:12px"><button onclick="rptOpenModal('cannes')" style="background:var(--accent);color:#fff;border:none;padding:7px 14px;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit">↗ Full lead details & pipeline values</button></div>
            </div>
          </div>
          <div class="exprow">
            <div class="exph" onclick="this.classList.toggle('open')">
              <div style="display:flex;align-items:center;gap:8px">
                <span class="exph-title">Luxembourg 1:1 Meetings</span>
                <span class="rpt-badge b-org">₹4 Cr</span>
              </div>
              <div style="display:flex;align-items:center;gap:6px">
                <span style="font-size:11px;color:var(--muted)">6–7 Nov · 2 hot, 8 cards</span>
                <div class="chev">▼</div>
              </div>
            </div>
            <div class="expb">
              <p style="font-size:13px;color:var(--muted)">High-value bilateral meetings. 2 direct hot leads generated. 8 business cards for follow-up. Owner: Sudiptaa Paul.</p>
            </div>
          </div>
          <div class="exprow">
            <div class="exph" onclick="rptOpenModal('london')">
              <div style="display:flex;align-items:center;gap:8px">
                <span class="exph-title">Quantum + AI Tech Show London</span>
                <span class="rpt-badge b-intl">Japan entry</span>
              </div>
              <span style="font-size:11px;color:var(--muted)">4 Nov · 10 leads ↗</span>
            </div>
          </div>
          <div class="exprow">
            <div class="exph" onclick="rptOpenModal('thailand')">
              <div style="display:flex;align-items:center;gap:8px">
                <span class="exph-title">Thailand Enterprise Roundtable</span>
                <span class="rpt-badge b-intl">SEA entry</span>
              </div>
              <span style="font-size:11px;color:var(--muted)">1 Nov · 26 leads ↗</span>
            </div>
          </div>
          <div class="exprow">
            <div class="exph" onclick="rptOpenModal('ciso6')">
              <div style="display:flex;align-items:center;gap:8px">
                <span class="exph-title">CISO6 Mumbai — 239 India enterprise leads</span>
                <span class="rpt-badge b-india">October</span>
              </div>
              <span style="font-size:11px;color:var(--muted)">↗ Full list</span>
            </div>
          </div>
        </div>
        <div>
          <div class="rpt-card" style="margin-bottom:12px">
            <div class="rpt-card-title">Lead Temperature Summary</div>
            <table class="rpt-table">
              <thead><tr><th>Category</th><th>Count</th><th>Action</th></tr></thead>
              <tbody>
                <tr><td><span class="rpt-badge b-hot">Hot</span></td><td style="font-weight:700">${hot}</td><td style="font-size:11px">Route to BU immediately</td></tr>
                <tr><td><span class="rpt-badge b-warm">Warm</span></td><td style="font-weight:700">${warm}</td><td style="font-size:11px">Nurture + qualify</td></tr>
                <tr><td><span class="rpt-badge b-cold">Unclassified</span></td><td style="font-weight:700">${RPT_LEADS.filter(l=>l.temp==='Unclassified').length}</td><td style="font-size:11px">Follow-up call needed</td></tr>
                <tr><td><span class="rpt-badge b-cold">Cold</span></td><td style="font-weight:700">${RPT_LEADS.filter(l=>l.temp==='Cold').length}</td><td style="font-size:11px">Remove / archive</td></tr>
              </tbody>
            </table>
          </div>
          <div class="rpt-card">
            <div class="rpt-card-title">Geo Split</div>
            <table class="rpt-table">
              <thead><tr><th>Geography</th><th>Count</th><th>%</th></tr></thead>
              <tbody>
                <tr><td><span class="rpt-badge b-india">India</span></td><td style="font-weight:700">${india}</td><td>${Math.round(india/RPT_LEADS.length*100)}%</td></tr>
                <tr><td><span class="rpt-badge b-intl">International</span></td><td style="font-weight:700">${intl}</td><td>${Math.round(intl/RPT_LEADS.length*100)}%</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- DIGITAL & CONTENT -->
    <div class="rpt-section">
      <div class="rpt-section-title">Digital & Content Performance</div>
      <div class="rpt-kpi-row">
        <div class="rpt-kpi accent" onclick="rptOpenModal('linkedin')">
          <div class="rpt-kpi-num">96,813</div>
          <div class="rpt-kpi-lbl">LinkedIn Impressions</div>
          <div class="rpt-kpi-sub">+26.8% QoQ · Zero paid</div>
          <div class="rpt-kpi-hint">↗ All metrics</div>
        </div>
        <div class="rpt-kpi" onclick="rptOpenModal('linkedin')">
          <div class="rpt-kpi-num">+194.8%</div>
          <div class="rpt-kpi-lbl">Reactions Growth</div>
          <div class="rpt-kpi-sub">Zero paid amplification</div>
          <div class="rpt-kpi-hint">↗ CEO positioning detail</div>
        </div>
        <div class="rpt-kpi" onclick="rptOpenModal('seo')">
          <div class="rpt-kpi-num">+17%</div>
          <div class="rpt-kpi-lbl">AI Impressions</div>
          <div class="rpt-kpi-sub">24K → 28K · Score 27/100</div>
          <div class="rpt-kpi-hint">↗ SEO & AI visibility</div>
        </div>
        <div class="rpt-kpi" onclick="rptOpenModal('content')">
          <div class="rpt-kpi-num">17</div>
          <div class="rpt-kpi-lbl">Blogs Published</div>
          <div class="rpt-kpi-sub">Oct–Nov · AEO treated</div>
          <div class="rpt-kpi-hint">↗ All content detail</div>
        </div>
      </div>
    </div>

    <!-- NEXT STEPS -->
    <div class="rpt-section">
      <div class="rpt-section-title">Next Steps — December 2026</div>
      <div class="rpt-three">
        <div class="rpt-card">
          <div class="rpt-card-title">Events</div>
          <ul style="padding-left:14px;font-size:12px;line-height:2;color:var(--text)">
            <li>Telecom MSME Conclave, 24 Nov</li>
            <li>Maharashtra Higher Ed Summit, 2–3 Dec</li>
            <li>EQTC Dublin, PKI Consortium Amsterdam</li>
            <li>Black Hat MEA Riyadh (Dec)</li>
          </ul>
        </div>
        <div class="rpt-card">
          <div class="rpt-card-title">Marketing</div>
          <ul style="padding-left:14px;font-size:12px;line-height:2;color:var(--text)">
            <li>1:1 CMO outreach to 29 partner CXOs</li>
            <li>Newsletter Vol 2 (Dec)</li>
            <li>Japan outreach live via JETRO</li>
            <li>Publish 2 CEO carousels</li>
          </ul>
        </div>
        <div class="rpt-card">
          <div class="rpt-card-title">Product & Automation</div>
          <ul style="padding-left:14px;font-size:12px;line-height:2;color:var(--text)">
            <li>Partners Portal and Design Taxonomy</li>
            <li>One View Module 2 (HR + CRM)</li>
            <li>Events CRM card scanner go-live</li>
          </ul>
        </div>
      </div>
    </div>

    <div style="text-align:center;padding:20px;font-size:11px;color:var(--muted);border-top:1px solid var(--border);margin-top:8px">
      Strictly Private & Confidential · QNu Labs Private Limited · qnulabs.com · November 2026
    </div>
  </div>

  <!-- MODAL -->
  <div class="rpt-modal-overlay" id="rptModalOverlay" onclick="if(event.target===this)rptCloseModal()">
    <div class="rpt-modal">
      <div class="rpt-modal-hdr">
        <div>
          <div class="rpt-modal-title" id="rptModalTitle">Details</div>
          <div class="rpt-modal-sub" id="rptModalSub"></div>
        </div>
        <button class="rpt-modal-close" onclick="rptCloseModal()">✕</button>
      </div>
      <div class="rpt-modal-body" id="rptModalBody"></div>
    </div>
  </div>
  `;
}

// ── Chart renderers (called after DOM ready) ──────────────────────
function renderGeoChart() {
  const ctx = document.getElementById('rptGeoChart'); if(!ctx) return;
  if(ctx._chart) ctx._chart.destroy();
  const india = RPT_LEADS.filter(l=>l.geo==='India').length;
  const intl  = RPT_LEADS.filter(l=>l.geo==='International').length;
  ctx._chart = new Chart(ctx, {
    type:'doughnut',
    data:{labels:['India','International'],datasets:[{data:[india,intl],backgroundColor:['#10B981','#3B82F6'],borderWidth:0}]},
    options:{plugins:{legend:{position:'bottom',labels:{font:{size:11},padding:10}}},cutout:'65%',maintainAspectRatio:false}
  });
}

function renderTempChart() {
  const ctx = document.getElementById('rptTempChart'); if(!ctx) return;
  if(ctx._chart) ctx._chart.destroy();
  const hot   = RPT_LEADS.filter(l=>l.temp==='Hot').length;
  const warm  = RPT_LEADS.filter(l=>l.temp==='Warm').length;
  const cold  = RPT_LEADS.filter(l=>l.temp==='Cold').length;
  const unc   = RPT_LEADS.filter(l=>l.temp==='Unclassified').length;
  ctx._chart = new Chart(ctx, {
    type:'doughnut',
    data:{labels:['Hot','Warm','Cold','Unclassified'],datasets:[{data:[hot,warm,cold,unc],backgroundColor:['#EF4444','#F59E0B','#9CA3AF','#D1D5DB'],borderWidth:0}]},
    options:{plugins:{legend:{position:'bottom',labels:{font:{size:11},padding:8}}},cutout:'60%',maintainAspectRatio:false}
  });
}

function renderEventChart() {
  const ctx = document.getElementById('rptEventChart'); if(!ctx) return;
  if(ctx._chart) ctx._chart.destroy();
  const events = {};
  RPT_LEADS.forEach(l => { const e=l.event||'Other'; events[e]=(events[e]||0)+1; });
  const sorted = Object.entries(events).sort((a,b)=>b[1]-a[1]).slice(0,8);
  ctx._chart = new Chart(ctx, {
    type:'bar',
    data:{labels:sorted.map(e=>e[0].length>18?e[0].slice(0,18)+'…':e[0]),datasets:[{label:'Leads',data:sorted.map(e=>e[1]),backgroundColor:'#E8460A',borderRadius:4}]},
    options:{indexAxis:'y',plugins:{legend:{display:false}},scales:{x:{grid:{display:false}},y:{ticks:{font:{size:10}}}},maintainAspectRatio:false}
  });
}

// ── Modal functions ───────────────────────────────────────────────
function rptOpenModal(type) {
  const overlay = document.getElementById('rptModalOverlay');
  const title   = document.getElementById('rptModalTitle');
  const sub     = document.getElementById('rptModalSub');
  const body    = document.getElementById('rptModalBody');
  if (!overlay) return;

  let t='', s='', h='';

  if (type === 'pipeline') {
    t = '₹39 Cr International Pipeline';
    s = 'Cannes ₹35 Cr + Luxembourg ₹4 Cr · November 2026';
    h = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
      <div class="rpt-card"><div style="font-size:30px;font-weight:800;color:var(--accent)">₹35 Cr</div><div style="font-size:13px;font-weight:600">World Quantum Cannes</div><div style="font-size:11px;color:var(--muted)">17–18 Nov · Bronze Sponsor · 7 hot leads</div></div>
      <div class="rpt-card"><div style="font-size:30px;font-weight:800;color:var(--accent)">₹4 Cr</div><div style="font-size:13px;font-weight:600">Luxembourg 1:1 Meetings</div><div style="font-size:11px;color:var(--muted)">6–7 Nov · 2 hot leads, 8 business cards</div></div>
    </div>
    <table class="rpt-table"><thead><tr><th>#</th><th>Company</th><th>Sector</th><th>Country</th><th>Est. Pipeline</th><th>Signal</th></tr></thead><tbody>
    ${RPT_CANNES.map((c,i)=>`<tr><td>${i+1}</td><td><strong>${c.company}</strong></td><td>${c.sector}</td><td><span class="rpt-badge b-intl">${c.country}</span></td><td style="color:var(--accent);font-weight:700">${c.pipeline}</td><td style="font-size:11px">${c.signal}</td></tr>`).join('')}
    </tbody></table>`;
  }
  else if (type === 'cannes') {
    t = 'Cannes Festival — ₹35 Cr Pipeline';
    s = '17–18 Nov 2026 · Bronze Sponsor · Owner: Vikas B, Prabhnoor, Sudiptaa Paul';
    h = `<div style="background:#FFF7F5;border:1.5px solid #FCD9CC;border-radius:8px;padding:12px;margin-bottom:14px;font-size:13px">Route all 7 leads to <strong>BU International immediately</strong>. Pipeline not yet in sales deck.</div>
    <table class="rpt-table"><thead><tr><th>#</th><th>Company</th><th>Sector</th><th>Country</th><th>Est. Pipeline</th><th>Why Hot</th></tr></thead><tbody>
    ${RPT_CANNES.map((c,i)=>`<tr><td>${i+1}</td><td><strong>${c.company}</strong></td><td>${c.sector}</td><td>${c.country}</td><td style="color:var(--accent);font-weight:700">${c.pipeline}</td><td style="font-size:11px">${c.signal}</td></tr>`).join('')}
    </tbody></table>`;
  }
  else if (type === 'hotaccs') {
    t = '9 Hot Enterprise Accounts — November 2026';
    s = 'Cannes (7) + Luxembourg (2) · All International';
    h = `<table class="rpt-table"><thead><tr><th>#</th><th>Company</th><th>Sector</th><th>Country</th><th>Signal</th></tr></thead><tbody>
    ${RPT_CANNES.map((c,i)=>`<tr><td>${i+1}</td><td><strong>${c.company}</strong></td><td>${c.sector}</td><td><span class="rpt-badge b-intl">${c.country}</span></td><td>${c.signal}</td></tr>`).join('')}
    <tr><td>8</td><td><strong>Hot Lead 1</strong></td><td>Bilateral meeting</td><td><span class="rpt-badge b-intl">Luxembourg</span></td><td style="color:var(--accent);font-weight:700">₹2 Cr</td></tr>
    <tr><td>9</td><td><strong>Hot Lead 2</strong></td><td>Bilateral meeting</td><td><span class="rpt-badge b-intl">Luxembourg</span></td><td style="color:var(--accent);font-weight:700">₹2 Cr</td></tr>
    </tbody></table>`;
  }
  else if (type === 'allleads' || type === 'allleads_oct') {
    const src = type === 'allleads' ? RPT_LEADS.filter(l=>l.month==='Nov') : RPT_LEADS;
    t = type === 'allleads' ? '80 November Leads — CRM Data' : 'Full CRM Database — 423 Leads (Oct–Nov)';
    s = 'Searchable · Filterable by month, temperature, geography';
    h = rptBuildCRMView(src);
  }
  else if (type === 'thailand') {
    t = 'Thailand Enterprise Roundtable — 26 Leads';
    s = '1 Nov 2026 · Bangkok · SEA Market Entry';
    const thLeads = [{company:"KASIKORN Business-Technology Group",contact:"Monchai Lertsutthiwong",signal:"Hot"},{company:"Bangkok Bank",contact:"Ian Gillard",signal:"Hot"},{company:"Bank of Thailand",contact:"Skunpoj Thanarojsophon",signal:"Hot"},{company:"Siam Commercial Bank",contact:"—",signal:"Warm"},{company:"NECTEC",contact:"—",signal:"Warm"},{company:"Bitkub",contact:"—",signal:"Warm"},{company:"UOB Thailand",contact:"—",signal:"Warm"},{company:"B.GRIMM",contact:"—",signal:"Unclassified"},{company:"EGAT",contact:"—",signal:"Unclassified"},{company:"Stream IT",contact:"—",signal:"Unclassified"},{company:"Novaris",contact:"—",signal:"Unclassified"},{company:"RMA Group",contact:"—",signal:"Unclassified"},{company:"Spacetime Co",contact:"—",signal:"Unclassified"}];
    h = `<table class="rpt-table"><thead><tr><th>#</th><th>Company</th><th>Contact</th><th>Signal</th></tr></thead><tbody>
    ${thLeads.map((l,i)=>`<tr><td>${i+1}</td><td><strong>${l.company}</strong></td><td>${l.contact}</td><td><span class="rpt-badge ${l.signal==='Hot'?'b-hot':l.signal==='Warm'?'b-warm':'b-cold'}">${l.signal}</span></td></tr>`).join('')}
    </tbody></table>`;
  }
  else if (type === 'london') {
    t = 'Quantum + AI Tech Show London — 10 Leads';
    s = '4 Nov 2026 · London · Japan market entry via JETRO';
    const lLeads = [{company:"JETRO London",contact:"Risa Miyazaki",significance:"Japan market entry — J-Bridge active",signal:"Warm"},{company:"QC82",contact:"Dr Aidong Xu",significance:"UK quantum — tech partnership",signal:"Warm"},{company:"SeQure AG",contact:"Phil Lindsay-Crisp",significance:"UK/Switzerland — reseller interest",signal:"Warm"},{company:"Quantum Australia",contact:"Claire Pink",significance:"Australia — market development",signal:"Warm"},{company:"Innovate UK",contact:"Matthew Jones",significance:"UK govt innovation agency",signal:"Unclassified"},{company:"Q-CTRL",contact:"Niall Moroney",significance:"Quantum control hardware",signal:"Unclassified"},{company:"Aquark Technologies",contact:"Dr Matthew Proctor",significance:"UK quantum startup",signal:"Unclassified"},{company:"Singular Photonics",contact:"Dr Aravind Venugopalan",significance:"Photonics company",signal:"Unclassified"}];
    h = `<table class="rpt-table"><thead><tr><th>#</th><th>Company</th><th>Contact</th><th>Significance</th><th>Signal</th></tr></thead><tbody>
    ${lLeads.map((l,i)=>`<tr><td>${i+1}</td><td><strong>${l.company}</strong></td><td>${l.contact}</td><td style="font-size:11px">${l.significance}</td><td><span class="rpt-badge ${l.signal==='Warm'?'b-warm':'b-cold'}">${l.signal}</span></td></tr>`).join('')}
    </tbody></table>`;
  }
  else if (type === 'ciso6') {
    t = 'CISO6 Mumbai — 239 India Enterprise Leads';
    s = 'October 2026 · India BFSI + Tech Enterprise CISOs';
    const companies = ["Jio","HSBC","Barclays","Deutsche Bank","TCS","Deloitte","Persistent Systems","L&T","KPMG","Mastercard","Capgemini","Axis Bank","ICICI Bank","Yes Bank","Reliance Industries","HCLTech","Wipro","Infosys","Cognizant","Mphasis","BNP Paribas India","Standard Chartered","Citibank India","Kotak Mahindra Bank"];
    h = `<div style="font-size:13px;color:var(--muted);margin-bottom:12px">239 leads from India's top enterprise CISOs. Volume-driven event — October's main pipeline source for India.</div>
    <div class="rpt-pills">${companies.map(c=>`<span class="rpt-pill">${c}</span>`).join('')}<span class="rpt-pill">+ 215 more India BFSI / Tech CISOs</span></div>`;
  }
  else if (type === 'linkedin') {
    t = 'LinkedIn Performance — Full Metrics';
    s = 'Organic only · Zero paid amplification · 5 Sep – 4 Oct 2026';
    h = `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px">
      ${[['96,813','Total Impressions (+26.8%)'],['+ 194.8%','Reactions Growth'],['+ 355.6%','Comments Surge'],['+ 225%','Reposts Increase'],['~20K','Follower Target'],['0','Paid Amplification']].map(([n,l])=>`<div class="rpt-card" style="text-align:center"><div style="font-size:22px;font-weight:800;color:var(--accent)">${n}</div><div style="font-size:11px;color:var(--muted);margin-top:4px">${l}</div></div>`).join('')}
    </div>
    <div style="background:#FFF7F5;border:1.5px solid #FCD9CC;border-radius:8px;padding:12px;font-size:13px">All growth is entirely organic. No paid promotion. 2 CEO carousels ready to publish. Moving toward 20K follower milestone.</div>`;
  }
  else if (type === 'seo') {
    t = 'AEO / SEO / GEO — Full Data';
    s = 'Search & AI visibility · Sep–Oct 2026';
    h = `<table class="rpt-table"><thead><tr><th>Metric</th><th>Value</th><th>vs Prior</th><th>Note</th></tr></thead><tbody>
    <tr><td>AI / Gen impressions</td><td style="font-weight:700">28,400</td><td style="color:green">▲ +17%</td><td>Up from 24,200</td></tr>
    <tr><td>Web impressions</td><td>143,000</td><td>Stable</td><td>Sep spike normalized</td></tr>
    <tr><td>Web clicks</td><td>3,760</td><td>Stable</td><td>Avg position: 10.5 (↑ from 12.7)</td></tr>
    <tr><td>Avg CTR</td><td>2.6%</td><td style="color:green">▲</td><td>Up from 2.4%</td></tr>
    <tr><td>AI visibility score</td><td>27/100</td><td>Stable</td><td>Mentions: 122 (+7%). Citations: 86</td></tr>
    </tbody></table>
    <div style="margin-top:14px;font-size:13px;background:#FFF7F5;border:1.5px solid #FCD9CC;border-radius:8px;padding:12px">QNu Labs appears in <strong>US Google AI Overview</strong> alongside AWS, Thales, NXP, IDQ for queries like "post quantum cryptography companies". ChatGPT drives 72.8% of AI-referred sessions. 144 toxic domains disavowed.</div>`;
  }
  else if (type === 'content') {
    t = 'Content & CEO Positioning — Full Detail';
    s = '17 blogs · 2 CEO carousels · Moving to 20K followers';
    h = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
    <div class="rpt-card"><div class="rpt-card-title">CEO Carousels — Ready to Publish</div>
    <ul style="padding-left:14px;font-size:12px;line-height:2">
      <li>"The Digital Economy Runs on Trust. Quantum Computers Will Test It."</li>
      <li>"Quantum Security as a Service Gives Telcos Something New to Sell"</li>
    </ul></div>
    <div class="rpt-card"><div class="rpt-card-title">Dark October Campaign</div>
    <p style="font-size:12px;color:var(--muted);line-height:1.6">6-slide LinkedIn Carousel analyzing India's October cyber incidents. Fact-checked against CERT-In, Verizon DBIR, IBM X-Force, TRM Labs.</p></div>
    </div>
    <div class="rpt-card"><div class="rpt-card-title">Blog Pipeline — 17 Published (Oct–Nov)</div>
    <div class="rpt-pills" style="margin-top:8px">
    ${["Black October — Digital Trust & Quantum Threat","PQC Migration Roadmap for Banks","Quantum-Safe Migration Roadmap","Quantum-Safe Satellite Communication","Thailand Quantum-Ready 2030 for CISOs","How CISOs Prioritise PQC Migration","QShield vs QShield 2.0","Malaysia PQC Readiness for CISOs","Quantum for BFSI","+ 8 more SEO/AEO blogs"].map(b=>`<span class="rpt-pill">${b}</span>`).join('')}
    </div></div>`;
  }

  document.getElementById('rptModalTitle').textContent = t;
  document.getElementById('rptModalSub').textContent   = s;
  document.getElementById('rptModalBody').innerHTML    = h;
  document.getElementById('rptModalOverlay').classList.add('show');
  document.body.style.overflow = 'hidden';

  // Render filtered CRM chart if applicable
  if (type === 'allleads' || type === 'allleads_oct') {
    setTimeout(() => rptInitCRMFilters(type === 'allleads' ? RPT_LEADS.filter(l=>l.month==='Nov') : RPT_LEADS), 50);
  }
}

function rptCloseModal() {
  const o = document.getElementById('rptModalOverlay');
  if (o) o.classList.remove('show');
  document.body.style.overflow = '';
  window._rptFilters = {};
}

// ── CRM view inside modal ─────────────────────────────────────────
function rptBuildCRMView(leads) {
  const months = [...new Set(leads.map(l=>l.month))];
  const hot = leads.filter(l=>l.temp==='Hot').length;
  const warm = leads.filter(l=>l.temp==='Warm').length;
  const intl = leads.filter(l=>l.geo==='International').length;
  window._rptAllLeads = leads;
  window._rptFilters = {month:'All',temp:'All',geo:'All',q:''};

  return `
  <div class="rpt-stat-bar">
    <div class="rpt-stat-item"><div class="rpt-stat-num">${leads.length}</div><div class="rpt-stat-lbl">Total</div></div>
    <div class="rpt-stat-item"><div class="rpt-stat-num" style="color:#EF4444">${hot}</div><div class="rpt-stat-lbl">Hot</div></div>
    <div class="rpt-stat-item"><div class="rpt-stat-num" style="color:#F59E0B">${warm}</div><div class="rpt-stat-lbl">Warm</div></div>
    <div class="rpt-stat-item"><div class="rpt-stat-num" style="color:#3B82F6">${intl}</div><div class="rpt-stat-lbl">International</div></div>
    <div class="rpt-stat-item"><div class="rpt-stat-num" id="rptCrmCount">${leads.length}</div><div class="rpt-stat-lbl">Showing</div></div>
  </div>
  <!-- Pie charts row -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px">
    <div class="rpt-card"><div class="rpt-card-title">India vs International</div><div style="height:160px"><canvas id="rptCrmGeoChart"></canvas></div></div>
    <div class="rpt-card"><div class="rpt-card-title">Lead Temperature</div><div style="height:160px"><canvas id="rptCrmTempChart"></canvas></div></div>
  </div>
  <div class="rpt-filter-row">
    <span style="font-size:11px;font-weight:600;color:var(--muted)">Month:</span>
    <button class="rpt-filter-btn on" onclick="rptSetFilter('month','All',this)">All</button>
    ${months.map(m=>`<button class="rpt-filter-btn" onclick="rptSetFilter('month','${m}',this)">${m}</button>`).join('')}
  </div>
  <div class="rpt-filter-row">
    <span style="font-size:11px;font-weight:600;color:var(--muted)">Status:</span>
    ${['All','Hot','Warm','Cold','Unclassified'].map(t=>`<button class="rpt-filter-btn ${t==='All'?'on':''}" onclick="rptSetFilter('temp','${t}',this)">${t}</button>`).join('')}
  </div>
  <div class="rpt-filter-row">
    <span style="font-size:11px;font-weight:600;color:var(--muted)">Geo:</span>
    ${['All','India','International'].map(g=>`<button class="rpt-filter-btn ${g==='All'?'on':''}" onclick="rptSetFilter('geo','${g}',this)">${g}</button>`).join('')}
  </div>
  <div class="rpt-filter-row">
    <input type="text" class="rpt-search" placeholder="Search by name, company or owner..." oninput="rptSetSearch(this.value)"/>
  </div>
  <div style="overflow-x:auto">
  <table class="rpt-table">
    <thead><tr><th>#</th><th>Name</th><th>Company</th><th>Phone</th><th>Geo</th><th>Event</th><th>Month</th><th>Status</th><th>Owner</th><th>Reason</th></tr></thead>
    <tbody id="rptCrmTableBody"></tbody>
  </table>
  </div>`;
}

function rptInitCRMFilters(leads) {
  window._rptAllLeads = leads;
  window._rptFilters = {month:'All',temp:'All',geo:'All',q:''};
  rptRenderCRMTable();
  // Mini charts inside modal
  setTimeout(() => {
    const gc = document.getElementById('rptCrmGeoChart');
    const tc = document.getElementById('rptCrmTempChart');
    if (gc && typeof Chart !== 'undefined') {
      new Chart(gc, {type:'doughnut',data:{labels:['India','International'],datasets:[{data:[leads.filter(l=>l.geo==='India').length,leads.filter(l=>l.geo==='International').length],backgroundColor:['#10B981','#3B82F6'],borderWidth:0}]},options:{plugins:{legend:{position:'bottom',labels:{font:{size:10},padding:6}}},cutout:'60%',maintainAspectRatio:false}});
    }
    if (tc && typeof Chart !== 'undefined') {
      new Chart(tc, {type:'doughnut',data:{labels:['Hot','Warm','Cold','Unclassified'],datasets:[{data:[leads.filter(l=>l.temp==='Hot').length,leads.filter(l=>l.temp==='Warm').length,leads.filter(l=>l.temp==='Cold').length,leads.filter(l=>l.temp==='Unclassified').length],backgroundColor:['#EF4444','#F59E0B','#9CA3AF','#D1D5DB'],borderWidth:0}]},options:{plugins:{legend:{position:'bottom',labels:{font:{size:10},padding:6}}},cutout:'60%',maintainAspectRatio:false}});
    }
  }, 100);
}

function rptSetFilter(key, val, btn) {
  window._rptFilters[key] = val;
  btn.closest('.rpt-filter-row').querySelectorAll('.rpt-filter-btn').forEach(b=>b.classList.remove('on'));
  btn.classList.add('on');
  rptRenderCRMTable();
}

function rptSetSearch(q) {
  window._rptFilters.q = q;
  rptRenderCRMTable();
}

function rptRenderCRMTable() {
  const f = window._rptFilters || {};
  const src = window._rptAllLeads || RPT_LEADS;
  const filtered = src.filter(l => {
    if (f.month && f.month!=='All' && l.month!==f.month) return false;
    if (f.temp  && f.temp !=='All' && l.temp !==f.temp)  return false;
    if (f.geo   && f.geo  !=='All' && l.geo  !==f.geo)   return false;
    if (f.q) {
      const q = f.q.toLowerCase();
      if (!l.name.toLowerCase().includes(q) && !l.company.toLowerCase().includes(q) && !(l.owner||'').toLowerCase().includes(q)) return false;
    }
    return true;
  });
  const cnt = document.getElementById('rptCrmCount');
  if (cnt) cnt.textContent = filtered.length;
  const tbody = document.getElementById('rptCrmTableBody');
  if (!tbody) return;
  tbody.innerHTML = filtered.map((l,i) => `<tr>
    <td>${i+1}</td>
    <td><strong>${esc(l.name||'-')}</strong></td>
    <td>${esc(l.company||'-')}</td>
    <td style="white-space:nowrap;font-size:11px">${esc(l.phone||'—')}</td>
    <td><span class="rpt-badge ${l.geo==='International'?'b-intl':'b-india'}">${l.geo==='International'?'Intl':'India'}</span></td>
    <td style="font-size:11px;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${esc(l.event||'')}">${esc(l.event||'-')}</td>
    <td><span class="rpt-badge b-cold">${l.month}</span></td>
    <td><span class="rpt-badge ${l.temp==='Hot'?'b-hot':l.temp==='Warm'?'b-warm':'b-cold'}">${l.temp}</span></td>
    <td style="font-size:11px">${esc(l.owner||'-')}</td>
    <td style="font-size:11px;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${esc(l.reason||'')}">${esc(l.reason||'-')}</td>
  </tr>`).join('');
}
