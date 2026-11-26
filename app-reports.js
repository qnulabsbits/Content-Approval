/* ═══════════════════════════════════════════════════════════
   MONTHLY REPORTS MODULE — app-reports.js
   Based on QNu Labs Nov 2026 Marketing PPT + Full Backend Data
═══════════════════════════════════════════════════════════ */

// ── Full data from backend docx ───────────────────────────────────
const RPT_CANNES_LEADS = [
  {no:1,company:"Schneider Electric",sector:"Energy / Industrial",country:"France",pipeline:"₹5 Cr",signal:"Critical infrastructure — post-quantum encryption urgency"},
  {no:2,company:"TotalEnergies",sector:"Energy",country:"France",pipeline:"₹5 Cr",signal:"Quantum security for OT/IT convergence"},
  {no:3,company:"Jefferies",sector:"Investment Banking",country:"USA/UK",pipeline:"₹7 Cr",signal:"BFSI — financial data protection regulatory driver"},
  {no:4,company:"Intesa Sanpaolo",sector:"Banking",country:"Italy",pipeline:"₹6 Cr",signal:"Major EU bank — PQC migration mandate"},
  {no:5,company:"UBS",sector:"Banking / Wealth Mgmt",country:"Switzerland",pipeline:"₹6 Cr",signal:"Global bank — NIST PQC standard adoption"},
  {no:6,company:"Capgemini",sector:"IT Services",country:"France",pipeline:"₹4 Cr",signal:"System integrator — QKD deployment for clients"},
  {no:7,company:"France Quantum Institute",sector:"Research / Government",country:"France",pipeline:"₹2 Cr",signal:"Strategic research partnership potential"},
];

const RPT_THAILAND_LEADS = [
  {no:1,name:"Thanakorn Bamrungkitjaroen",company:"Orbix Technology (KBank Subsidiary)",owner:"Sudiptaa Paul Choudhury",date:"5 Nov",signal:"Warm",note:"KBank subsidiary"},
  {no:2,name:"Monchai Lertsutthiwong",company:"KASIKORN Business-Technology Group",owner:"Sudiptaa Paul Choudhury",date:"3 Nov",signal:"Hot",note:"Major Thai bank"},
  {no:3,name:"Apiwat Chantawibul",company:"NECTEC",owner:"Hermaan Kohli",date:"5 Nov",signal:"Warm",note:"Interested in CBOM open test bed"},
  {no:4,name:"Chirawut (Jude) Kanogart",company:"MHESRI of Thailand / Siam Quantum Valley",owner:"Hermaan Kohli",date:"5 Nov",signal:"Warm",note:""},
  {no:5,name:"Thani Ratanapridakul",company:"Spacetime Co",owner:"Sudiptaa Paul Choudhury",date:"5 Nov",signal:"Unclassified",note:""},
  {no:6,name:"Kasemsook Booncharoen",company:"Upbit Exchange",owner:"Sudiptaa Paul Choudhury",date:"5 Nov",signal:"Unclassified",note:""},
  {no:7,name:"Skunpoj (Kim) Thanarojsophon",company:"Bank of Thailand",owner:"Hermaan Kohli",date:"5 Nov",signal:"Hot",note:"Central bank"},
  {no:8,name:"Archit Nunvititpong",company:"Yong Yuseng Chemethai 2005",owner:"Sudiptaa Paul Choudhury",date:"5 Nov",signal:"Unclassified",note:""},
  {no:9,name:"Denchai Tantipatanasakul",company:"Srisakul Engineering ltd",owner:"Sudiptaa Paul Choudhury",date:"5 Nov",signal:"Unclassified",note:""},
  {no:10,name:"Ian Gillard",company:"Bangkok Bank",owner:"Sudiptaa Paul Choudhury",date:"5 Nov",signal:"Hot",note:"Major Thai bank"},
  {no:11,name:"Soontorn Sirapaisan",company:"National Cyber Security Agency (Thailand)",owner:"Hermaan Kohli",date:"5 Nov",signal:"Warm",note:""},
  {no:12,name:"Tosapole Stitsuwongkul",company:"B.GRIMM",owner:"Sudiptaa Paul Choudhury",date:"5 Nov",signal:"Unclassified",note:""},
  {no:13,name:"Jitsatha Thatavakorn",company:"Electricity Generating Authority of Thailand (EGAT)",owner:"Sudiptaa Paul Choudhury",date:"5 Nov",signal:"Unclassified",note:""},
  {no:14,name:"Pongsak Pongsitthichai",company:"Stream I.T.",owner:"Hermaan Kohli",date:"5 Nov",signal:"Unclassified",note:""},
  {no:15,name:"Jarinya Junpan",company:"ACIS Professional Center",owner:"Sudiptaa Paul Choudhury",date:"5 Nov",signal:"Unclassified",note:""},
  {no:16,name:"Pokai Sriratanobhas",company:"Chulalongkorn University",owner:"Sudiptaa Paul Choudhury",date:"5 Nov",signal:"Unclassified",note:""},
  {no:17,name:"Surasak Tarawatanatham",company:"United Overseas Bank",owner:"Sudiptaa Paul Choudhury",date:"5 Nov",signal:"Unclassified",note:""},
  {no:18,name:"Somjat Maksomboon",company:"Novaris",owner:"Sudiptaa Paul Choudhury",date:"5 Nov",signal:"Unclassified",note:""},
  {no:19,name:"Pasd Putthapipat",company:"Panyapiwat Institution of Management",owner:"Hermaan Kohli",date:"5 Nov",signal:"Unclassified",note:""},
  {no:20,name:"Natdanai Srisupornwattana",company:"Krungsri Bank (Nimble)",owner:"Sudiptaa Paul Choudhury",date:"5 Nov",signal:"Unclassified",note:""},
  {no:21,name:"Orawan Wannadee",company:"RMA Group",owner:"Sudiptaa Paul Choudhury",date:"5 Nov",signal:"Unclassified",note:""},
  {no:22,name:"Mongkol Chutpathumthong",company:"Bitkub",owner:"Sudiptaa Paul Choudhury",date:"5 Nov",signal:"Warm",note:"Crypto exchange"},
  {no:23,name:"Thanusrapee Sa-Nguansup",company:"Siam Commercial Bank X",owner:"Hermaan Kohli",date:"5 Nov",signal:"Warm",note:"SCB digital arm"},
  {no:24,name:"Wanrob Boontham",company:"Token X",owner:"Sudiptaa Paul Choudhury",date:"3 Nov",signal:"Unclassified",note:""},
  {no:25,name:"Piyawan Ruengprateep",company:"Jaymart Insurance",owner:"Sudiptaa Paul Choudhury",date:"3 Nov",signal:"Unclassified",note:""},
  {no:26,name:"Brian C.",company:"SITG",owner:"Sudiptaa Paul Choudhury",date:"3 Nov",signal:"Unclassified",note:""},
];

const RPT_LONDON_LEADS = [
  {no:1,name:"Matthew Jones",company:"Innovate UK Business Connect",phone:"—",country:"UK",signal:"Unclassified",note:"UK Govt innovation agency — PR value"},
  {no:2,name:"Dr Aidong Xu",company:"QC82",phone:"+44 7780 494001",country:"UK",signal:"Unclassified",note:"SPDs (single-photon detectors). Need to understand their SPDs."},
  {no:3,name:"Phil Lindsay-Crisp",company:"SeQure AG",phone:"+44 7703 322360",country:"UK/CH",signal:"Warm",note:"Could partner with SeQure AG as they only have CBOM"},
  {no:4,name:"Risa Miyazaki",company:"JETRO London (Japan External Trade Org)",phone:"+44 (0)20 7421 8335",country:"UK/Japan",signal:"Warm",note:"KEY — Japan market entry. Invest Japan. J-Bridge could be useful."},
  {no:5,name:"Dr Aravind Venugopalan",company:"Singular Photonics",phone:"+44 7405 984166",country:"UK",signal:"Unclassified",note:"Photonics company"},
  {no:6,name:"Shahida Imani",company:"Singular Photonics",phone:"+44 7944 231537",country:"UK",signal:"Unclassified",note:""},
  {no:7,name:"Dr Matthew Proctor",company:"Aquark Technologies",phone:"—",country:"UK",signal:"Unclassified",note:"UK quantum startup"},
  {no:8,name:"Niall Moroney",company:"Q-CTRL",phone:"—",country:"UK",signal:"Unclassified",note:"Q-CTRL makes Ironstone Opal. Card has QR code."},
  {no:9,name:"Claire Pink",company:"Quantum Australia",phone:"+61 407 486 516",country:"Australia",signal:"Warm",note:"Handwritten on card: Helen Bethell"},
  {no:10,name:"James Bain",company:"Quantrologee",phone:"—",country:"UK",signal:"Unclassified",note:""},
];

const RPT_NOV_WEBSITE_LEADS = [
  {name:"Yogesh M R",company:"Ampcus Cyber",phone:"+91 8147255897",owner:"Sagar Pandey",temp:"Hot",date:"23 Nov",msg:"Looking for banking use cases + has clients looking for Quantum security"},
  {name:"Makara",company:"PSCYBER",phone:"+855 10654046",owner:"Sagar Pandey",temp:"Hot",date:"20 Nov",msg:"Would like to explore Quantum Security with QNULABS. Reach via mmakara@pscyber.asia"},
  {name:"Srinivasan V D",company:"Virtusa Consulting",phone:"+91 9000153642",owner:"Sagar Pandey",temp:"Hot",date:"20 Nov",msg:"Evaluating PQC migration and adoption strategy. Interested in QNu capabilities."},
  {name:"D Christinal Mary",company:"MJC Global Tech",phone:"+91 9886018764",owner:"Sagar Pandey",temp:"Hot",date:"16 Nov",msg:"Looking to connect with telecom companies. Exploring partnerships across telecom solutions."},
  {name:"Muhammad Anas",company:"enord",phone:"+91 9818447424",owner:"Marketing Team",temp:"Hot",date:"16 Nov",msg:"need to see quantum in action."},
  {name:"Puja",company:"AegisQX",phone:"+91 9546826854",owner:"Sagar Pandey",temp:"Hot",date:"12 Nov",msg:"I want your quotation for all the prices"},
  {name:"Ricky Dewan",company:"Suffescom Solutions Inc",phone:"+1 6186880472",owner:"Sagar Pandey",temp:"Hot",date:"14 Nov",msg:"BDH at Suffescom exploring strategic partnerships with cybersecurity and quantum technology companies."},
  {name:"Senthilnathan Thirumaran",company:"Mpac Group plc",phone:"+91 8754142844",owner:"Sagar Pandey",temp:"Hot",date:"3 Nov",msg:"Would like to understand partner opportunities and explore quantum infusion in robotics."},
  {name:"Shine Anthony",company:"S Vyasa University",phone:"+91 9895403578",owner:"Sudiptaa Paul Choudhury",temp:"Hot",date:"17 Nov",msg:"Lead from Arul. Meeting completed 16 Nov. Sales deck shared. Following up for 2nd level in-person meeting."},
  {name:"Aaron Keith",company:"SIGMA Equipment Inc",phone:"+1 8123038338",owner:"Sagar Pandey",temp:"Warm",date:"12 Nov",msg:"Reaching out to explore strategic collaboration on upcoming project."},
  {name:"Ritesh Kumar Dwivedi",company:"NIC, MeitY",phone:"+91 8527659815",owner:"Ravi Bhatnagar",temp:"Unclassified",date:"11 Nov",msg:"Requesting meeting regarding Quantum implementations in our organization."},
  {name:"Matt Cashia",company:"Morgan Stanley",phone:"+1 9177482913",owner:"Marketing Team",temp:"Unclassified",date:"1 Nov",msg:"I run coverage of quantum computing for Morgan Stanley investment banking. Active advising quantum companies on M&A and capital raises since 2020."},
];

const RPT_CISO6_COMPANIES = [
  "Jio Platforms","HSBC Technology India","Barclays","Deutsche Bank","TCS","Deloitte","Persistent Systems","L&T","KPMG",
  "Mastercard","Capgemini","Axis Bank","ICICI Bank","Yes Bank","Reliance Industries","HCLTech","WNS Global Services",
  "Cognizant","BNP Paribas India","Standard Chartered","Citibank India","Kotak Mahindra Bank","HDFC Bank","NABARD",
  "JP Morgan Chase","Synechron","Avaya","Force Motors","Bajaj Financial Securities","Mphasis","Accenture","Genpact",
  "Ness Digital Engineering","Nayara Energy","ISC2","Sutherland Global Services","MIT ADT University"
];

const RPT_SEO_PAGES = [
  {url:"/blog/quantum-101-qubit",impressions:1138},
  {url:"/blog/quantum-key-distribution-qkd-complete-guide",impressions:1066},
  {url:"/glossary/india-national-quantum-mission-nqm",impressions:1013},
  {url:"/news/qnu-labs-200-crore-round",impressions:865},
  {url:"/ (Homepage)",impressions:832},
  {url:"/blog/quantum-key-distribution-vs-post-quantum-cryptography",impressions:497},
  {url:"/quantum-security-platform",impressions:483},
  {url:"/blog/pqc-certificate",impressions:482},
  {url:"/blog/guide-to-pqc-migration",impressions:468},
  {url:"/glossary/qubit-quantum-bit",impressions:453},
];

const RPT_AI_PLATFORMS = [
  {platform:"ChatGPT",sessions:177,pct:"72.84%",engaged:104,rate:"58.76%",duration:"6m 06s"},
  {platform:"Gemini",sessions:49,pct:"20.16%",engaged:19,rate:"38.78%",duration:"4m 29s"},
  {platform:"Perplexity",sessions:8,pct:"3.29%",engaged:4,rate:"50%",duration:"6m 37s"},
  {platform:"Claude.ai",sessions:7,pct:"2.88%",engaged:1,rate:"14.29%",duration:"4m 06s"},
  {platform:"Copilot",sessions:1,pct:"0.41%",engaged:1,rate:"100%",duration:"1m 47s"},
];

// ── Helpers ───────────────────────────────────────────────────────
function rptEsc(s) {
  return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function rptBadge(type, text) {
  const cls = {hot:'rpt-hot',warm:'rpt-warm',cold:'rpt-cold',unclassified:'rpt-unc',india:'rpt-india',intl:'rpt-intl',live:'rpt-live',ongoing:'rpt-ongoing',done:'rpt-done'}[type.toLowerCase()] || 'rpt-unc';
  return `<span class="${cls}">${rptEsc(text||type)}</span>`;
}

// ── Load page ─────────────────────────────────────────────────────
function loadReports() {
  const c = $('pg-reports');
  if (!c) return;
  c.innerHTML = `
    <div class="rpt-wrap">
      ${buildRptHeader()}
      ${buildRptNav()}
      <div id="rptContent">${buildRptSummary()}</div>
    </div>
    ${buildRptModal()}
  `;
  setTimeout(() => { renderRptCharts('summary'); }, 100);
}

function buildRptHeader() {
  return `
  <div class="rpt-topbar">
    <div style="display:flex;align-items:center;gap:14px">
      <img src="logo.png" class="rpt-logo" alt="QNu Labs" onerror="this.style.display='none'"/>
      <div>
        <div class="rpt-topbar-title">Monthly Marketing Report — November 2026</div>
        <div class="rpt-topbar-sub">Strictly Private & Confidential · qnulabs.com</div>
      </div>
    </div>
    <button onclick="rptDownload()" class="btn btn-secondary btn-sm">⬇ Download HTML</button>
  </div>`;
}

function buildRptNav() {
  const tabs = [
    {id:'summary',label:'Summary'},
    {id:'events',label:'Events & Leads'},
    {id:'digital',label:'Digital & AI Search'},
    {id:'content',label:'Content & Product'},
    {id:'nextsteps',label:'Next Steps'},
  ];
  return `
  <div class="rpt-nav">
    ${tabs.map((t,i) => `<button class="rpt-nav-btn${i===0?' active':''}" onclick="rptShowTab('${t.id}',this)">${t.label}</button>`).join('')}
  </div>`;
}

// ── TAB: SUMMARY ─────────────────────────────────────────────────
function buildRptSummary() {
  return `
  <div class="rpt-slide-title">
    <div class="rpt-eyebrow">Slide 2</div>
    <div class="rpt-h1"><span class="rpt-accent">₹39 Cr</span> International pipeline built</div>
  </div>

  <div class="rpt-kpi-grid">
    <div class="rpt-kpi rpt-kpi-fill" onclick="rptOpenModal('pipeline')">
      <div class="rpt-kpi-num">₹39 Cr</div>
      <div class="rpt-kpi-label">International pipeline</div>
      <div class="rpt-kpi-sub">Cannes ₹35 Cr + Luxembourg ₹4 Cr</div>
      <div class="rpt-kpi-hint">↗ Click for all lead details</div>
    </div>
    <div class="rpt-kpi" onclick="rptOpenModal('hotaccs')">
      <div class="rpt-kpi-num">9</div>
      <div class="rpt-kpi-label">Hot enterprise accounts</div>
      <div class="rpt-kpi-sub">From events this month</div>
      <div class="rpt-kpi-hint">↗ Click to see all 9 names</div>
    </div>
    <div class="rpt-kpi" onclick="rptOpenModal('linkedin_metrics')">
      <div class="rpt-kpi-num">96,813</div>
      <div class="rpt-kpi-label">LinkedIn impressions</div>
      <div class="rpt-kpi-sub">▲ 26.8% QoQ</div>
      <div class="rpt-kpi-hint">↗ Click for all metrics</div>
    </div>
    <div class="rpt-kpi" onclick="rptOpenModal('all_leads_nov')">
      <div class="rpt-kpi-num">80</div>
      <div class="rpt-kpi-label">Leads generated</div>
      <div class="rpt-kpi-sub">Event & digital combined</div>
      <div class="rpt-kpi-hint">↗ Click for full CRM data</div>
    </div>
  </div>

  <div class="rpt-so-what">
    <div class="rpt-so-what-label">SO, WHAT</div>
    <p>₹39 Cr international pipeline is new and not yet in the sales deck. Marketing is now reaching the same three segments that drive pipeline: BFSI (international banks), Academy (UAE, Maharashtra) and Telecom (India GTM approved). Japan market entry now live via JETRO.</p>
  </div>

  <div class="rpt-seg-grid">
    <div class="rpt-seg-card" onclick="rptOpenModal('bfsi')">
      <div class="rpt-seg-label">BFSI</div>
      <div class="rpt-seg-title">International banks</div>
      <div class="rpt-seg-sub">Cannes leads + newsletter: BNP Paribas, ABN AMRO, OCBC, Optus…<br>↗ Click for accounts</div>
    </div>
    <div class="rpt-seg-card" onclick="rptOpenModal('academy')">
      <div class="rpt-seg-label">ACADEMY</div>
      <div class="rpt-seg-title">UAE, Maharashtra</div>
      <div class="rpt-seg-sub">UAE campaign + Maharashtra Higher Ed Summit 2–3 Dec<br>↗ Click for accounts</div>
    </div>
    <div class="rpt-seg-card" onclick="rptOpenModal('telecom')">
      <div class="rpt-seg-label">TELECOM</div>
      <div class="rpt-seg-title">India GTM approved</div>
      <div class="rpt-seg-sub">Jio, Airtel, Vi, BSNL — outreach live<br>↗ Click for GTM plan</div>
    </div>
  </div>`;
}

// ── TAB: EVENTS ───────────────────────────────────────────────────
function buildRptEvents() {
  // Count leads per event from real data
  const novWebsite = RPT_NOV_WEBSITE_LEADS.length;
  const thaiTotal = RPT_THAILAND_LEADS.length;
  const londonTotal = RPT_LONDON_LEADS.length;
  const cannesTotal = RPT_CANNES_LEADS.length;
  const luxembourgHot = 2;

  // Geo breakdown
  const novIndia = RPT_NOV_WEBSITE_LEADS.filter(l=>!l.geo||l.geo.toLowerCase().includes('india')||l.geo==='India').length;
  const novIntl  = RPT_NOV_WEBSITE_LEADS.filter(l=>(l.geo||'').toLowerCase().includes('int')).length;
  // Thailand + London + Cannes + Luxembourg = international events
  const eventIntl = thaiTotal + londonTotal + cannesTotal + luxembourgHot;
  const totalIndia = novIndia;
  const totalIntl  = novIntl + eventIntl;
  const grandTotal = totalIndia + totalIntl;

  return `
  <div class="rpt-slide-title">
    <div class="rpt-eyebrow">Slide 3</div>
    <div class="rpt-h1">Events & leads</div>
  </div>

  <!-- PIE CHARTS ROW -->
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin-bottom:20px">

    <!-- Geo Split Pie -->
    <div class="rpt-card" style="text-align:center">
      <div class="rpt-card-label">India vs International</div>
      <div style="position:relative;height:180px"><canvas id="rptGeoChart"></canvas></div>
      <div style="display:flex;justify-content:center;gap:16px;margin-top:8px">
        <div style="cursor:pointer" onclick="rptOpenModal('all_leads_india')">
          <div style="font-size:18px;font-weight:800;color:#10B981">\${totalIndia}</div>
          <div style="font-size:11px;color:var(--muted)">India ↗</div>
        </div>
        <div style="cursor:pointer" onclick="rptOpenModal('all_leads_intl')">
          <div style="font-size:18px;font-weight:800;color:#3B82F6">\${totalIntl}</div>
          <div style="font-size:11px;color:var(--muted)">International ↗</div>
        </div>
      </div>
    </div>

    <!-- Temperature Pie -->
    <div class="rpt-card" style="text-align:center">
      <div class="rpt-card-label">Lead Temperature (Nov)</div>
      <div style="position:relative;height:180px"><canvas id="rptTempChart"></canvas></div>
      <div style="display:flex;justify-content:center;gap:12px;flex-wrap:wrap;margin-top:8px">
        <div style="cursor:pointer" onclick="rptOpenModal('temp_detail')">
          <div style="font-size:16px;font-weight:800;color:#EF4444">15 ↗</div>
          <div style="font-size:10px;color:var(--muted)">Hot</div>
        </div>
        <div style="cursor:pointer" onclick="rptOpenModal('temp_detail')">
          <div style="font-size:16px;font-weight:800;color:#F59E0B">4 ↗</div>
          <div style="font-size:10px;color:var(--muted)">Warm</div>
        </div>
        <div>
          <div style="font-size:16px;font-weight:800;color:#9CA3AF">2</div>
          <div style="font-size:10px;color:var(--muted)">Cold</div>
        </div>
        <div>
          <div style="font-size:16px;font-weight:800;color:#D1D5DB">59</div>
          <div style="font-size:10px;color:var(--muted)">Uncl.</div>
        </div>
      </div>
    </div>

    <!-- Leads by Event Bar (horizontal) -->
    <div class="rpt-card">
      <div class="rpt-card-label">Leads by Event</div>
      <div style="position:relative;height:180px"><canvas id="rptEventChart"></canvas></div>
    </div>
  </div>

  <!-- EVENTS + LEAD COUNTS -->
  <div class="rpt-two-col">
    <div>
      <div class="rpt-section-label">NOVEMBER EVENTS</div>

      <div class="rpt-event-row" onclick="rptOpenModal('cannes')">
        <div class="rpt-event-left">
          <div class="rpt-event-title">World Quantum Cannes Festival</div>
          <div class="rpt-event-meta">17–18 Nov · Schneider Electric, TotalEnergies, Jefferies, Intesa Sanpaolo, UBS</div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">
          <span class="rpt-event-badge">₹35 Cr ↗</span>
          <span style="font-size:11px;color:var(--muted)">7 hot leads</span>
        </div>
      </div>

      <div class="rpt-event-row" onclick="rptOpenModal('luxembourg')">
        <div class="rpt-event-left">
          <div class="rpt-event-title">Luxembourg 1:1 Meetings</div>
          <div class="rpt-event-meta">6–7 Nov · 8 business cards · 2 hot leads · Owner: Sudiptaa Paul</div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">
          <span class="rpt-event-badge">₹4 Cr ↗</span>
          <span style="font-size:11px;color:var(--muted)">\${luxembourgHot} hot leads</span>
        </div>
      </div>

      <div class="rpt-event-row" onclick="rptOpenModal('london')">
        <div class="rpt-event-left">
          <div class="rpt-event-title">Quantum + AI Tech Show London</div>
          <div class="rpt-event-meta">4 Nov · JETRO (Japan entry), Innovate UK, Q-CTRL</div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">
          <span class="rpt-event-badge rpt-event-badge-blue">Brand + PR ↗</span>
          <span style="font-size:11px;color:var(--muted)">\${londonTotal} leads</span>
        </div>
      </div>

      <div class="rpt-event-row" onclick="rptOpenModal('thailand')">
        <div class="rpt-event-left">
          <div class="rpt-event-title">Thailand Enterprise Roundtable</div>
          <div class="rpt-event-meta">1 Nov · KBank, Bangkok Bank, Bank of Thailand, NECTEC</div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">
          <span class="rpt-event-badge rpt-event-badge-green">SEA entry ↗</span>
          <span style="font-size:11px;color:var(--muted)">\${thaiTotal} leads</span>
        </div>
      </div>

      <div class="rpt-event-row" onclick="rptOpenModal('ciso6')" style="background:#F9FAFB">
        <div class="rpt-event-left">
          <div class="rpt-event-title">CISO6 Mumbai (October)</div>
          <div class="rpt-event-meta">15 Oct · India BFSI + Tech Enterprise CISOs</div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">
          <span class="rpt-event-badge rpt-event-badge-green">India pipeline ↗</span>
          <span style="font-size:11px;color:var(--muted)">239 leads</span>
        </div>
      </div>
    </div>

    <div>
      <!-- Lead count grid — every number clickable -->
      <div class="rpt-section-label">CRM LEAD COUNTS — CLICK ANY NUMBER</div>
      <div class="rpt-mini-kpi-grid" style="margin-bottom:12px">
        <div class="rpt-mini-kpi" onclick="rptOpenModal('all_leads_oct')">
          <div class="rpt-mini-num">345</div>
          <div class="rpt-mini-label">October leads ↗</div>
          <div class="rpt-mini-sub">CISO6: 239 · Other: 106</div>
        </div>
        <div class="rpt-mini-kpi rpt-mini-fill" onclick="rptOpenModal('all_leads_nov')">
          <div class="rpt-mini-num">80</div>
          <div class="rpt-mini-label">November leads ↗</div>
          <div class="rpt-mini-sub">Events + organic</div>
        </div>
        <div class="rpt-mini-kpi" onclick="rptOpenModal('all_leads_india')" style="border-color:#10B981">
          <div class="rpt-mini-num" style="color:#10B981">\${totalIndia}</div>
          <div class="rpt-mini-label">India leads ↗</div>
          <div class="rpt-mini-sub">Nov organic</div>
        </div>
        <div class="rpt-mini-kpi" onclick="rptOpenModal('all_leads_intl')" style="border-color:#3B82F6">
          <div class="rpt-mini-num" style="color:#3B82F6">\${totalIntl}</div>
          <div class="rpt-mini-label">International leads ↗</div>
          <div class="rpt-mini-sub">Cannes + Luxembourg + Thailand + London</div>
        </div>
        <div class="rpt-mini-kpi" onclick="rptOpenModal('temp_detail')" style="border-color:#EF4444">
          <div class="rpt-mini-num rpt-red">15</div>
          <div class="rpt-mini-label">Hot leads ↗</div>
        </div>
        <div class="rpt-mini-kpi" onclick="rptOpenModal('temp_detail')" style="border-color:#F59E0B">
          <div class="rpt-mini-num rpt-orange">4</div>
          <div class="rpt-mini-label">Warm leads ↗</div>
        </div>
        <div class="rpt-mini-kpi" onclick="rptOpenModal('cannes')">
          <div class="rpt-mini-num">7</div>
          <div class="rpt-mini-label">Cannes hot leads ↗</div>
        </div>
        <div class="rpt-mini-kpi" onclick="rptOpenModal('thailand')">
          <div class="rpt-mini-num">\${thaiTotal}</div>
          <div class="rpt-mini-label">Thailand leads ↗</div>
        </div>
        <div class="rpt-mini-kpi" onclick="rptOpenModal('london')">
          <div class="rpt-mini-num">\${londonTotal}</div>
          <div class="rpt-mini-label">London leads ↗</div>
        </div>
        <div class="rpt-mini-kpi" onclick="rptOpenModal('ciso6')">
          <div class="rpt-mini-num">239</div>
          <div class="rpt-mini-label">CISO6 leads ↗</div>
        </div>
      </div>
      <div class="rpt-so-what">
        <p style="font-weight:600">Nov shifted to international quality: Thailand, London, Luxembourg delivering high-value global accounts.</p>
      </div>
    </div>
  </div>

  <div class="rpt-event-row rpt-event-row-cta" onclick="rptOpenModal('all_leads_nov')">
    <div class="rpt-event-left">
      <div class="rpt-event-title">Full CRM database — all November leads</div>
      <div class="rpt-event-meta">Search · Filter by temp / geo · Export</div>
    </div>
    <div class="rpt-event-right"><span class="rpt-event-badge">Open CRM ↗</span></div>
  </div>`;
}
// ── TAB: DIGITAL ──────────────────────────────────────────────────
function buildRptDigital() {
  return `
  <div class="rpt-slide-title">
    <div class="rpt-eyebrow">Slide 4</div>
    <div class="rpt-h1">Engagement and AI visibility <span class="rpt-accent">up</span></div>
  </div>

  <div class="rpt-two-col">
    <div class="rpt-card">
      <div class="rpt-card-label">DIGITAL MARKETING AND PARTNERS</div>
      <div style="display:flex;align-items:baseline;gap:12px;margin-bottom:14px">
        <span style="font-size:40px;font-weight:800;color:var(--accent);line-height:1">22</span>
        <span style="font-size:14px;font-weight:600;color:var(--navy)">companies clicked through to Contact Us</span>
      </div>
      <ul class="rpt-bullets">
        <li>Partner outreach: 9 companies, 39 clicks (Netpoleon, Westcon-Comstor, True Corporation)</li>
        <li>29 partner CXOs named for 1:1 CMO outreach</li>
        <li>October newsletter: 8 enterprises (BNP Paribas, ABN AMRO, OCBC, Optus…)</li>
        <li>Academy UAE: 5 companies (Quadcode, TAQA…)</li>
        <li>India Telecom GTM approved: Jio, Airtel, Vi, BSNL</li>
      </ul>
      <button onclick="rptOpenModal('digital_detail')" class="btn btn-primary btn-sm" style="margin-top:14px">↗ Full campaign breakdown</button>
    </div>

    <div class="rpt-card rpt-card-dark">
      <div class="rpt-card-label" style="color:rgba(255,255,255,0.65)">AEO / SEO / GEO</div>
      <div style="display:flex;align-items:baseline;gap:12px;margin-bottom:14px">
        <span style="font-size:40px;font-weight:800;color:#fff;line-height:1">+17%</span>
        <span style="font-size:14px;font-weight:600;color:#fff">AI impressions, 24K → 28K</span>
      </div>
      <ul class="rpt-bullets" style="color:rgba(255,255,255,0.88)">
        <li>AI visibility score: 27/100</li>
        <li>ChatGPT drives 72.8% of AI-referred sessions (177 of 243)</li>
        <li>QNu in US Google AI Overview alongside AWS, Thales, NXP, IDQ</li>
        <li>17 blogs published (Oct–Nov); 15 keyword briefs delivered</li>
        <li>144 toxic domains disavowed</li>
      </ul>
      <button onclick="rptOpenModal('seo_detail')" class="btn btn-sm" style="margin-top:14px;background:rgba(255,255,255,0.15);color:#fff;border:1px solid rgba(255,255,255,0.3);font-family:inherit">↗ Full SEO & AI data</button>
    </div>
  </div>`;
}

// ── TAB: CONTENT ──────────────────────────────────────────────────
function buildRptContent() {
  return `
  <div class="rpt-slide-title">
    <div class="rpt-eyebrow">Slide 5</div>
    <div class="rpt-h1">Content and product delivered <span class="rpt-accent">on time</span></div>
  </div>

  <div class="rpt-kpi-grid">
    <div class="rpt-kpi rpt-kpi-fill" onclick="rptOpenModal('linkedin_metrics')">
      <div class="rpt-kpi-num">96,813</div>
      <div class="rpt-kpi-label">LinkedIn impressions (+26.8%)</div>
      <div class="rpt-kpi-hint">↗ All content metrics</div>
    </div>
    <div class="rpt-kpi" onclick="rptOpenModal('linkedin_metrics')">
      <div class="rpt-kpi-num">+194.8%</div>
      <div class="rpt-kpi-label">Reactions, zero paid</div>
      <div class="rpt-kpi-hint">↗ CEO positioning detail</div>
    </div>
    <div class="rpt-kpi" onclick="rptOpenModal('linkedin_metrics')">
      <div class="rpt-kpi-num">+355.6%</div>
      <div class="rpt-kpi-label">Comments</div>
      <div class="rpt-kpi-hint">↗ Blog pipeline</div>
    </div>
    <div class="rpt-kpi" onclick="rptOpenModal('design_detail')">
      <div class="rpt-kpi-num">12 pages</div>
      <div class="rpt-kpi-label">Enterprise website pages live</div>
      <div class="rpt-kpi-hint">↗ All 17 design items</div>
    </div>
  </div>

  <div class="rpt-seg-grid">
    <div class="rpt-seg-card" onclick="rptOpenModal('ceo_positioning')">
      <div class="rpt-seg-label">CEO POSITIONING</div>
      <ul class="rpt-bullets" style="margin-top:6px">
        <li>2 CEO carousels ready to publish</li>
        <li>Dark October 6-slide carousel (CERT-In, Verizon, IBM verified)</li>
        <li>17 blogs published</li>
        <li>Moving toward 20K organic followers</li>
      </ul>
      <div class="rpt-kpi-hint" style="margin-top:8px">↗ Full detail</div>
    </div>
    <div class="rpt-seg-card" onclick="rptOpenModal('design_detail')">
      <div class="rpt-seg-label">PRODUCT & DESIGN</div>
      <ul class="rpt-bullets" style="margin-top:6px">
        <li>12 website pages, Cannes + 3 event collaterals</li>
        <li>Datasheets and Academy brochure</li>
        <li>Claude → Framer + Webflow MCP cut design turnaround &gt;50%</li>
      </ul>
      <div class="rpt-kpi-hint" style="margin-top:8px">↗ All 17 deliverables</div>
    </div>
    <div class="rpt-seg-card" onclick="rptOpenModal('automation_detail')">
      <div class="rpt-seg-label">AUTOMATION & STRATEGY</div>
      <ul class="rpt-bullets" style="margin-top:6px">
        <li>One View Module 1 live</li>
        <li>₹200 Cr demand gen roadmap (Gartner)</li>
        <li>Modules 2 & 3 in progress</li>
      </ul>
      <div class="rpt-kpi-hint" style="margin-top:8px">↗ Full detail</div>
    </div>
  </div>`;
}

// ── TAB: NEXT STEPS ───────────────────────────────────────────────
function buildRptNextSteps() {
  return `
  <div class="rpt-slide-title">
    <div class="rpt-eyebrow">Slide 6</div>
    <div class="rpt-h1">Next: <span class="rpt-accent">routing the Cannes leads</span></div>
  </div>

  <div class="rpt-key-ask">
    <div class="rpt-key-ask-label">KEY ASK</div>
    <div class="rpt-key-ask-text">Route Cannes 7 hot leads to BU International immediately. Telecom GTM approved: coordinate with BU India on Jio, Airtel, Vi, BSNL outreach.</div>
  </div>

  <div class="rpt-seg-grid">
    <div class="rpt-seg-card">
      <div class="rpt-seg-label">EVENTS</div>
      <ul class="rpt-bullets" style="margin-top:8px">
        <li>Telecom MSME Conclave, 24 Nov</li>
        <li>Maharashtra Higher Ed Summit, 2–3 Dec</li>
        <li>EQTC Dublin, PKI Consortium Amsterdam, Black Hat MEA Riyadh (Dec)</li>
      </ul>
    </div>
    <div class="rpt-seg-card">
      <div class="rpt-seg-label">MARKETING</div>
      <ul class="rpt-bullets" style="margin-top:8px">
        <li>1:1 CMO outreach to 29 partner CXOs this week</li>
        <li>Newsletter Vol 2 (Dec); Japan outreach live via JETRO</li>
        <li>Publish 2 CEO carousels; 4 video scripts to production</li>
      </ul>
    </div>
    <div class="rpt-seg-card">
      <div class="rpt-seg-label">PRODUCT & AUTOMATION</div>
      <ul class="rpt-bullets" style="margin-top:8px">
        <li>Partners Portal and Design Taxonomy</li>
        <li>One View Module 2 (HR + CRM); event card CRM go-live</li>
        <li>One View Module – Events CRM leads addition automation</li>
      </ul>
    </div>
  </div>

  <div style="text-align:center;margin-top:32px;padding:24px;background:var(--navy);border-radius:var(--r);color:#fff">
    <div style="font-size:28px;font-weight:800;margin-bottom:6px">Thank you</div>
    <div style="font-size:12px;color:rgba(255,255,255,0.5)">Monthly Marketing Report · November 2026 · Strictly Private & Confidential · qnulabs.com</div>
  </div>`;
}

// ── Tab switching ─────────────────────────────────────────────────
function rptShowTab(id, btn) {
  document.querySelectorAll('.rpt-nav-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  const c = document.getElementById('rptContent');
  if (!c) return;
  const builders = {
    summary:   buildRptSummary,
    events:    buildRptEvents,
    digital:   buildRptDigital,
    content:   buildRptContent,
    nextsteps: buildRptNextSteps,
  };
  c.innerHTML = (builders[id] || buildRptSummary)();
  setTimeout(() => renderRptCharts(id), 150);
}

// ── Chart rendering ───────────────────────────────────────────────
function renderRptCharts(tab) {
  if (typeof Chart === 'undefined') return;
  if (tab === 'events') {
    setTimeout(() => {
      _renderRptDoughnut('rptGeoChart',
        ['India', 'International'],
        [RPT_NOV_WEBSITE_LEADS.filter(l=>!l.geo||l.geo==='India').length,
         RPT_NOV_WEBSITE_LEADS.filter(l=>(l.geo||'').toLowerCase().includes('int')).length + RPT_THAILAND_LEADS.length + RPT_LONDON_LEADS.length + RPT_CANNES_LEADS.length + 2],
        ['#10B981','#3B82F6']
      );
      _renderRptDoughnut('rptTempChart',
        ['Hot','Warm','Cold','Unclassified'],
        [15,4,2,59],
        ['#EF4444','#F59E0B','#9CA3AF','#D1D5DB']
      );
      _renderRptBar('rptEventChart',
        ['Website/Organic','CISO6 Mumbai','Thailand R/T','Cannes','London','Luxembourg','Goa Conclave','Pragati'],
        [93,239,26,7,10,2,35,13]
      );
    }, 50);
  }
}

function _renderRptDoughnut(id, labels, data, colors) {
  const ctx = document.getElementById(id); if(!ctx) return;
  if(ctx._ch) ctx._ch.destroy();
  ctx._ch = new Chart(ctx, {
    type:'doughnut',
    data:{labels,datasets:[{data,backgroundColor:colors,borderWidth:2,borderColor:'#fff'}]},
    options:{plugins:{legend:{position:'bottom',labels:{font:{size:10},padding:8,boxWidth:10}}},cutout:'65%',maintainAspectRatio:false,
      onClick:(e,el) => {
        if(!el.length) return;
        const idx=el[0].index;
        if(id==='rptGeoChart') rptOpenModal(idx===0?'all_leads_india':'all_leads_intl');
        else if(id==='rptTempChart') rptOpenModal('temp_detail');
      }
    }
  });
}

function _renderRptBar(id, labels, data) {
  const ctx = document.getElementById(id); if(!ctx) return;
  if(ctx._ch) ctx._ch.destroy();
  ctx._ch = new Chart(ctx, {
    type:'bar',
    data:{labels,datasets:[{label:'Leads',data,backgroundColor:'#E8460A',borderRadius:3}]},
    options:{indexAxis:'y',plugins:{legend:{display:false}},scales:{x:{grid:{display:false},ticks:{font:{size:9}}},y:{ticks:{font:{size:9}}}},maintainAspectRatio:false,
      onClick:(e,el) => {
        if(!el.length) return;
        const idx=el[0].index;
        const map=['all_leads_nov','ciso6','thailand','cannes','london','luxembourg','all_leads_nov','all_leads_nov'];
        rptOpenModal(map[idx]||'all_leads_nov');
      }
    }
  });
}

// ── Modal system ──────────────────────────────────────────────────
function buildRptModal() {
  return `
  <div id="rptOverlay" style="position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:99999;display:none;align-items:flex-start;justify-content:center;padding:40px 16px;overflow-y:auto" onclick="if(event.target===this)rptCloseModal()">
    <div style="background:#fff;border-radius:10px;width:100%;max-width:980px;margin:auto;box-shadow:0 24px 64px rgba(0,0,0,0.3)">
      <div style="background:var(--navy);padding:16px 20px;display:flex;align-items:center;justify-content:space-between;border-radius:10px 10px 0 0;border-bottom:3px solid var(--accent)">
        <div>
          <div id="rptMTitle" style="font-size:15px;font-weight:700;color:#fff"></div>
          <div id="rptMSub" style="font-size:12px;color:rgba(255,255,255,0.55);margin-top:2px"></div>
        </div>
        <button onclick="rptCloseModal()" style="width:30px;height:30px;border-radius:50%;background:rgba(255,255,255,0.12);border:none;color:#fff;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center">✕</button>
      </div>
      <div id="rptMBody" style="padding:20px;max-height:72vh;overflow-y:auto"></div>
    </div>
  </div>`;
}

function rptOpenModal(type) {
  const overlay = document.getElementById('rptOverlay');
  const titleEl = document.getElementById('rptMTitle');
  const subEl   = document.getElementById('rptMSub');
  const bodyEl  = document.getElementById('rptMBody');
  if (!overlay) return;

  let title='', sub='', html='';

  if (type === 'pipeline') {
    title = '₹39 Cr International Pipeline — Full Breakdown';
    sub = 'Cannes ₹35 Cr + Luxembourg ₹4 Cr · November 2026 · Not yet in sales deck';
    html = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
      <div style="background:#FFF7F5;border:1.5px solid #FCD9CC;border-radius:8px;padding:16px">
        <div style="font-size:32px;font-weight:800;color:var(--accent)">₹35 Cr</div>
        <div style="font-size:13px;font-weight:600;color:var(--navy)">World Quantum Cannes Festival</div>
        <div style="font-size:11px;color:var(--muted);margin-top:4px">17–18 Nov · Bronze Sponsor · 7 hot leads<br>Owners: Vikas B, Prabhnoor, Sudiptaa Paul</div>
      </div>
      <div style="background:#FFF7F5;border:1.5px solid #FCD9CC;border-radius:8px;padding:16px">
        <div style="font-size:32px;font-weight:800;color:var(--accent)">₹4 Cr</div>
        <div style="font-size:13px;font-weight:600;color:var(--navy)">Luxembourg 1:1 Meetings</div>
        <div style="font-size:11px;color:var(--muted);margin-top:4px">6–7 Nov · 2 hot leads, 8 business cards<br>Owner: Sudiptaa Paul</div>
      </div>
    </div>
    <div style="background:#FFF3EE;border-left:3px solid var(--accent);padding:10px 14px;border-radius:0 6px 6px 0;margin-bottom:14px;font-size:13px">
      <strong>Action required:</strong> This ₹39 Cr pipeline is entirely new and not yet in the sales deck. Route Cannes 7 hot leads to BU International immediately.
    </div>
    <table class="rpt-tbl"><thead><tr><th>#</th><th>Company</th><th>Sector</th><th>Country</th><th>Est. Pipeline</th><th>Why Hot</th></tr></thead><tbody>
    ${RPT_CANNES_LEADS.map(c=>`<tr><td>${c.no}</td><td><strong>${rptEsc(c.company)}</strong></td><td>${rptEsc(c.sector)}</td><td>${rptBadge('intl',c.country)}</td><td style="color:var(--accent);font-weight:700">${c.pipeline}</td><td style="font-size:11px">${rptEsc(c.signal)}</td></tr>`).join('')}
    <tr style="font-weight:700;background:#FFF7F5"><td colspan="4">Luxembourg — 2 bilateral hot leads</td><td style="color:var(--accent)">₹4 Cr</td><td style="font-size:11px">High-value bilateral meeting contacts</td></tr>
    </tbody></table>`;
  }

  else if (type === 'hotaccs') {
    title = '9 Hot Enterprise Accounts — November 2026';
    sub = 'Cannes (7) + Luxembourg (2) · All International · Action: Route to BU International';
    html = `
    <div style="background:#FFF3EE;border-left:3px solid var(--accent);padding:10px 14px;border-radius:0 6px 6px 0;margin-bottom:16px;font-size:13px">
      All 9 accounts are <strong>international</strong>. Route to BU International immediately. ₹39 Cr pipeline not yet in sales deck.
    </div>
    <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--accent);margin-bottom:8px">Cannes — 7 hot leads</div>
    <table class="rpt-tbl"><thead><tr><th>#</th><th>Company</th><th>Sector</th><th>Country</th><th>Est. Pipeline</th><th>Signal</th></tr></thead><tbody>
    ${RPT_CANNES_LEADS.map(c=>`<tr><td>${c.no}</td><td><strong>${rptEsc(c.company)}</strong></td><td>${rptEsc(c.sector)}</td><td>${rptBadge('intl',c.country)}</td><td style="color:var(--accent);font-weight:700">${c.pipeline}</td><td style="font-size:11px">${rptEsc(c.signal)}</td></tr>`).join('')}
    </tbody></table>
    <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--accent);margin:16px 0 8px">Luxembourg — 2 hot leads</div>
    <table class="rpt-tbl"><thead><tr><th>#</th><th>Details</th><th>Est. Pipeline</th></tr></thead><tbody>
    <tr><td>8</td><td>Hot Lead 1 — high-value bilateral meeting (Luxembourg)</td><td style="color:var(--accent);font-weight:700">₹2 Cr</td></tr>
    <tr><td>9</td><td>Hot Lead 2 — high-value bilateral meeting (Luxembourg)</td><td style="color:var(--accent);font-weight:700">₹2 Cr</td></tr>
    </tbody></table>`;
  }

  else if (type === 'cannes') {
    title = 'World Quantum Cannes Festival — ₹35 Cr Pipeline';
    sub = '17–18 Nov 2026 · Bronze Sponsor · Owners: Vikas B, Prabhnoor, Sudiptaa Paul';
    html = `
    <div style="background:#FFF3EE;border-left:3px solid var(--accent);padding:10px 14px;border-radius:0 6px 6px 0;margin-bottom:14px;font-size:13px">
      All 7 leads are international. Must be routed to <strong>BU International immediately</strong>. These leads were NOT captured in CRM — recorded separately by Cannes team.
    </div>
    <table class="rpt-tbl"><thead><tr><th>#</th><th>Company</th><th>Sector</th><th>Country</th><th>Est. Pipeline</th><th>Why Hot</th></tr></thead><tbody>
    ${RPT_CANNES_LEADS.map(c=>`<tr><td>${c.no}</td><td><strong>${rptEsc(c.company)}</strong></td><td>${rptEsc(c.sector)}</td><td>${rptBadge('intl',c.country)}</td><td style="color:var(--accent);font-weight:700">${c.pipeline}</td><td style="font-size:11px">${rptEsc(c.signal)}</td></tr>`).join('')}
    </tbody></table>`;
  }

  else if (type === 'luxembourg') {
    title = 'Luxembourg 1:1 Meetings — ₹4 Cr Pipeline';
    sub = '6–7 Nov 2026 · High-value bilateral meetings · Owner: Sudiptaa Paul';
    html = `
    <div style="background:#FFF3EE;border-left:3px solid var(--accent);padding:10px 14px;border-radius:0 6px 6px 0;margin-bottom:14px;font-size:13px">
      2 direct hot leads generated from bilateral meetings. 8 business cards for follow-up. Pipeline estimate: ₹4 Cr (₹2 Cr per hot lead).
    </div>
    <table class="rpt-tbl"><thead><tr><th>#</th><th>Details</th><th>Est. Pipeline</th><th>Owner</th></tr></thead><tbody>
    <tr><td>1</td><td>Hot Lead 1 — bilateral meeting (Luxembourg)</td><td style="color:var(--accent);font-weight:700">₹2 Cr</td><td>Sudiptaa Paul Choudhury</td></tr>
    <tr><td>2</td><td>Hot Lead 2 — bilateral meeting (Luxembourg)</td><td style="color:var(--accent);font-weight:700">₹2 Cr</td><td>Sudiptaa Paul Choudhury</td></tr>
    </tbody></table>
    <div style="margin-top:12px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--accent);margin-bottom:8px">8 Business Cards for Follow-up</div>
    <p style="font-size:13px;color:var(--muted)">8 business cards were scanned at the Luxembourg event for follow-up qualification. These are not yet classified as hot/warm until a follow-up call is completed.</p>`;
  }

  else if (type === 'thailand') {
    title = 'Thailand Enterprise Roundtable — 26 Leads';
    sub = '1–5 Nov 2026 · Bangkok, Thailand · SEA Market Entry';
    html = `
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px">
      <div style="background:#FFF7F5;border:1.5px solid #FCD9CC;border-radius:8px;padding:12px;text-align:center"><div style="font-size:22px;font-weight:800;color:var(--accent)">26</div><div style="font-size:11px;color:var(--muted)">Total leads</div></div>
      <div style="background:#FEF3F2;border:1.5px solid #FECACA;border-radius:8px;padding:12px;text-align:center"><div style="font-size:22px;font-weight:800;color:#EF4444">4</div><div style="font-size:11px;color:var(--muted)">Hot</div></div>
      <div style="background:#FFFBEB;border:1.5px solid #FDE68A;border-radius:8px;padding:12px;text-align:center"><div style="font-size:22px;font-weight:800;color:#F59E0B">5</div><div style="font-size:11px;color:var(--muted)">Warm</div></div>
    </div>
    <table class="rpt-tbl"><thead><tr><th>#</th><th>Name</th><th>Company</th><th>Owner</th><th>Date</th><th>Status</th><th>Note</th></tr></thead><tbody>
    ${RPT_THAILAND_LEADS.map(l=>`<tr><td>${l.no}</td><td>${rptEsc(l.name)}</td><td><strong>${rptEsc(l.company)}</strong></td><td style="font-size:11px">${rptEsc(l.owner)}</td><td style="font-size:11px">${l.date}</td><td>${rptBadge(l.signal.toLowerCase(),l.signal)}</td><td style="font-size:11px;max-width:150px">${rptEsc(l.note)}</td></tr>`).join('')}
    </tbody></table>`;
  }

  else if (type === 'london') {
    title = 'Quantum + AI Tech Show London — 10 Leads';
    sub = '4 Nov 2026 · London, UK · Brand + PR · Japan market entry via JETRO';
    html = `
    <div style="background:#FFF3EE;border-left:3px solid var(--accent);padding:10px 14px;border-radius:0 6px 6px 0;margin-bottom:14px;font-size:13px">
      <strong>Key outcome:</strong> JETRO (Japan External Trade Organization) connection made — Japan market outreach now live via J-Bridge program.
    </div>
    <table class="rpt-tbl"><thead><tr><th>#</th><th>Name</th><th>Company</th><th>Phone</th><th>Country</th><th>Status</th><th>Note</th></tr></thead><tbody>
    ${RPT_LONDON_LEADS.map(l=>`<tr><td>${l.no}</td><td>${rptEsc(l.name)}</td><td><strong>${rptEsc(l.company)}</strong></td><td style="font-size:11px;white-space:nowrap">${rptEsc(l.phone)}</td><td>${rptBadge('intl',l.country)}</td><td>${rptBadge(l.signal.toLowerCase(),l.signal)}</td><td style="font-size:11px;max-width:200px">${rptEsc(l.note)}</td></tr>`).join('')}
    </tbody></table>`;
  }

  else if (type === 'ciso6') {
    title = 'CISO6 Mumbai — 239 India Enterprise Leads';
    sub = '15 Oct 2026 · India BFSI + Tech Enterprise CISOs · Owner: Marketing Team';
    html = `
    <div style="background:#F0FDF4;border:1.5px solid #BBF7D0;border-radius:8px;padding:12px;margin-bottom:14px;font-size:13px">
      239 leads from India's top enterprise CISOs. Volume-driven event — October's main pipeline source for India. All leads have Lead Source = "Event", Customer Segment = "Enterprise".
    </div>
    <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--accent);margin-bottom:10px">Key Companies (sample)</div>
    <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:16px">
    ${RPT_CISO6_COMPANIES.map(c=>`<span style="font-size:12px;padding:4px 11px;border-radius:20px;background:#F3F4F6;color:#374151;font-weight:500;border:1px solid #E5E7EB">${rptEsc(c)}</span>`).join('')}
    <span style="font-size:12px;padding:4px 11px;border-radius:20px;background:#FFF3EE;color:var(--accent);font-weight:500;border:1px solid #FCD9CC">+ 202 more India enterprise CISOs</span>
    </div>
    <p style="font-size:12px;color:var(--muted)">Full list of all 239 names available in Zoho CRM — filter by Lead Generator = "CISO6 Mumbai".</p>`;
  }

  else if (type === 'all_leads_india') {
    title = 'India Leads — November + Events';
    sub = 'All domestic leads from website/organic and India events';
    html = rptBuildCRMView('india');
  }

  else if (type === 'all_leads_intl') {
    title = 'International Leads — Cannes + Luxembourg + Thailand + London';
    sub = 'All international pipeline leads · November 2026';
    html = rptBuildCRMView('intl');
  }

  else if (type === 'all_leads_nov' || type === 'all_leads_oct') {
    const isNov = type === 'all_leads_nov';
    title = isNov ? 'November Leads — 80 Records (Website/Organic + Events)' : 'CRM Overview — Oct & Nov Leads';
    sub = isNov ? 'Source: FY_2027___LEADS__6_.csv · SP Source = blank · Nov 2026' : 'All events + organic leads Oct–Nov 2026';
    html = rptBuildCRMView(isNov);
  }

  else if (type === 'temp_detail') {
    title = 'Lead Temperature — Classification & Names';
    sub = 'Hot 15 · Warm 4 · Cold 2 · Unclassified 59 · November 2026';
    html = `
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px">
      <div style="background:#FEF2F2;border:1.5px solid #FECACA;border-radius:8px;padding:12px;text-align:center;cursor:pointer" onclick="document.getElementById('rpt-t-hot').scrollIntoView({behavior:'smooth'})">
        <div style="font-size:28px;font-weight:800;color:#EF4444">15</div><div style="font-size:11px;color:#EF4444;font-weight:600">Hot</div>
      </div>
      <div style="background:#FFFBEB;border:1.5px solid #FDE68A;border-radius:8px;padding:12px;text-align:center;cursor:pointer" onclick="document.getElementById('rpt-t-warm').scrollIntoView({behavior:'smooth'})">
        <div style="font-size:28px;font-weight:800;color:#F59E0B">4</div><div style="font-size:11px;color:#F59E0B;font-weight:600">Warm</div>
      </div>
      <div style="background:#F9FAFB;border:1.5px solid #E5E7EB;border-radius:8px;padding:12px;text-align:center">
        <div style="font-size:28px;font-weight:800;color:#6B7280">2</div><div style="font-size:11px;color:#6B7280;font-weight:600">Cold / spam</div>
      </div>
      <div style="background:#F9FAFB;border:1.5px solid #E5E7EB;border-radius:8px;padding:12px;text-align:center">
        <div style="font-size:28px;font-weight:800;color:#6B7280">59</div><div style="font-size:11px;color:#6B7280;font-weight:600">Unclassified</div>
      </div>
    </div>
    <div id="rpt-t-hot" style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--accent);margin:14px 0 8px">Hot (15) — Meeting done, demo/pricing requested, PQC evaluation underway</div>
    <table class="rpt-tbl"><thead><tr><th>#</th><th>Name</th><th>Company</th><th>Signal / Reason</th><th>Owner</th></tr></thead><tbody>
    ${RPT_NOV_WEBSITE_LEADS.filter(l=>l.temp==='Hot').map((l,i)=>`<tr><td>${i+1}</td><td>${rptEsc(l.name)}</td><td>${rptEsc(l.company)}</td><td style="font-size:11px;max-width:200px">${rptEsc(l.msg)}</td><td style="font-size:11px">${rptEsc(l.owner)}</td></tr>`).join('')}
    </tbody></table>
    <div id="rpt-t-warm" style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#F59E0B;margin:14px 0 8px">Warm (4) — FDP inquiry, lab setup, partnership explore</div>
    <table class="rpt-tbl"><thead><tr><th>#</th><th>Name</th><th>Company</th><th>Signal / Reason</th><th>Owner</th></tr></thead><tbody>
    ${RPT_NOV_WEBSITE_LEADS.filter(l=>l.temp==='Warm').map((l,i)=>`<tr><td>${i+1}</td><td>${rptEsc(l.name)}</td><td>${rptEsc(l.company)}</td><td style="font-size:11px;max-width:200px">${rptEsc(l.msg)}</td><td style="font-size:11px">${rptEsc(l.owner)}</td></tr>`).join('')}
    </tbody></table>`;
  }

  else if (type === 'linkedin_metrics') {
    title = 'LinkedIn Performance — Full Metrics';
    sub = 'Organic only · Zero paid amplification · 5 Sep – 4 Oct 2026 · Source: Monthly Content Report';
    html = `
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px">
    ${[['96,813','Total Impressions','▲ 26.8% QoQ'],['+ 194.8%','Reactions Growth','Zero paid'],['+ 355.6%','Comments Surge','Organic'],['+ 225.0%','Reposts Increase','Zero paid'],['~20K','Follower Target','Moving steadily'],['0','Paid Amplification','All organic']].map(([n,l,s])=>`<div style="background:var(--surface2);border:1.5px solid var(--border);border-radius:8px;padding:14px;text-align:center"><div style="font-size:22px;font-weight:800;color:var(--accent)">${n}</div><div style="font-size:12px;font-weight:600;color:var(--navy);margin:3px 0">${l}</div><div style="font-size:11px;color:var(--muted)">${s}</div></div>`).join('')}
    </div>
    <div style="background:#FFF7F5;border:1.5px solid #FCD9CC;border-radius:8px;padding:12px;font-size:13px">
      All growth is entirely organic. No paid promotion. 2 CEO carousels ready to publish. Moving toward 20K follower milestone.<br><br>
      <strong>Source:</strong> Monthly_Content___Thought_Leadership_Impact_Report-2.pdf, Section 3 "Organic LinkedIn Performance Metrics (5 Sep – 4 Oct 2026)"
    </div>`;
  }

  else if (type === 'seo_detail') {
    title = 'AEO / SEO / GEO — Full Data';
    sub = 'Source: QNU_labs___7_Eagles_-SEO_Report_-_October_2026.pdf';
    html = `
    <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--accent);margin-bottom:10px">Search & AI Impressions (Sep 22 – Oct 21, 2026 vs Aug 23 – Sep 21, 2026)</div>
    <table class="rpt-tbl"><thead><tr><th>Metric</th><th>Current</th><th>Prior</th><th>Change</th><th>Note</th></tr></thead><tbody>
    <tr><td>AI / Gen impressions</td><td style="font-weight:700">28,400</td><td>24,200</td><td style="color:green;font-weight:700">▲ +17%</td><td>Google AI Overview, ChatGPT, Gemini</td></tr>
    <tr><td>Total web clicks</td><td>3,760</td><td>3,930</td><td>Stable</td><td>Sep spike (funding announcement) now excluded</td></tr>
    <tr><td>Total impressions</td><td>143,000</td><td>164,000</td><td>Stable</td><td>Sep spike normalised</td></tr>
    <tr><td>Average CTR</td><td style="font-weight:700">2.6%</td><td>2.4%</td><td style="color:green">▲</td><td>Improving</td></tr>
    <tr><td>Average position</td><td style="font-weight:700">10.5</td><td>12.7</td><td style="color:green;font-weight:700">▲ Significant</td><td>Major ranking improvement</td></tr>
    <tr><td>AI visibility score</td><td>27/100</td><td>Stable</td><td>—</td><td>Mentions: 122 (+7%). Citations: 86 (-43.4%)</td></tr>
    </tbody></table>

    <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--accent);margin:16px 0 10px">AI Platform Traffic (Google Analytics)</div>
    <table class="rpt-tbl"><thead><tr><th>Platform</th><th>Sessions</th><th>Share</th><th>Engaged</th><th>Engagement Rate</th><th>Avg Duration</th></tr></thead><tbody>
    ${RPT_AI_PLATFORMS.map(p=>`<tr><td><strong>${rptEsc(p.platform)}</strong></td><td>${p.sessions}</td><td>${p.pct}</td><td>${p.engaged}</td><td>${p.rate}</td><td>${p.duration}</td></tr>`).join('')}
    <tr style="font-weight:700;background:var(--surface2)"><td>TOTAL</td><td>243</td><td>100%</td><td>130</td><td>53.5%</td><td>5m 42s avg</td></tr>
    </tbody></table>

    <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--accent);margin:16px 0 10px">Top Pages in AI Search Results</div>
    <table class="rpt-tbl"><thead><tr><th>Page URL</th><th style="text-align:right">AI Impressions</th></tr></thead><tbody>
    ${RPT_SEO_PAGES.map(p=>`<tr><td style="font-size:11px">${rptEsc(p.url)}</td><td style="text-align:right;font-weight:700">${p.impressions.toLocaleString()}</td></tr>`).join('')}
    </tbody></table>

    <div style="background:#F0F9FF;border:1.5px solid #BAE6FD;border-radius:8px;padding:12px;margin-top:14px;font-size:13px">
      <strong>QNu in US Google AI Overview</strong> — Appears alongside AWS, Thales, NXP, IDQ for queries like "post quantum cryptography companies" and "top cryptography companies".
    </div>`;
  }

  else if (type === 'digital_detail') {
    title = 'Digital Marketing — Full Campaign Breakdown';
    sub = 'Partner outreach · Newsletter · Academy UAE · LinkedIn · Telecom GTM · Nov 2026';
    html = `
    <table class="rpt-tbl"><thead><tr><th>Campaign</th><th>Impact</th><th>Key accounts engaged</th></tr></thead><tbody>
    <tr><td><strong>Partner & Reseller Outreach</strong></td><td>9 companies, 39 clicks<br>29 CXOs for 1:1 CMO outreach</td><td>Netpoleon, Westcon-Comstor, True Corporation</td></tr>
    <tr><td><strong>October Newsletter (Enterprise)</strong></td><td>8 enterprises engaged</td><td>BNP Paribas, ABN AMRO, OCBC, Optus, Axis Bank, Hexaware, Pfizer, MediaTek</td></tr>
    <tr><td><strong>QNu Academy UAE Campaign</strong></td><td>5 companies engaged</td><td>Quadcode, AAFAQ, TAQA, Arbeat, Nile (all UAE)</td></tr>
    <tr><td><strong>LinkedIn Organic</strong></td><td>96,813 impressions (+26.8%)<br>+194.8% reactions</td><td>+355.6% comments · +225% reposts · Zero paid</td></tr>
    <tr><td><strong>India Telecom GTM (Approved)</strong></td><td>GTM plan approved; outreach live</td><td>Jio, Airtel, Vi, BSNL</td></tr>
    </tbody></table>
    <div style="background:#FFF7F5;border:1.5px solid #FCD9CC;border-radius:8px;padding:12px;margin-top:14px;font-size:13px">
      <strong>Result:</strong> 22 companies clicked through to Contact Us. 29 CXOs are now in a named outreach list. Marketing is aligned to the same three segments as the sales pipeline: BFSI, Academy and Telecom.
    </div>`;
  }

  else if (type === 'ceo_positioning') {
    title = 'CEO Positioning & Content Deliverables';
    sub = 'Source: Monthly_Content___Thought_Leadership_Impact_Report-2.pdf';
    html = `
    <table class="rpt-tbl"><thead><tr><th>Deliverable</th><th>Format</th><th>Sources</th><th>Status</th></tr></thead><tbody>
    <tr><td><strong>"The Digital Economy Runs on Trust. Quantum Computers Will Test It."</strong></td><td>LinkedIn Carousel</td><td>DST, NPCI, NIST, GSMA Intelligence</td><td>${rptBadge('warm','Ready to Publish')}</td></tr>
    <tr><td><strong>"Quantum Security as a Service Gives Telcos Something New to Sell"</strong></td><td>LinkedIn Carousel</td><td>GSMA Intelligence</td><td>${rptBadge('warm','Ready to Publish')}</td></tr>
    <tr><td><strong>Dark October Security Campaign</strong></td><td>6-slide Carousel</td><td>CERT-In, Verizon DBIR, IBM X-Force, TRM Labs</td><td>${rptBadge('done','Done')}</td></tr>
    <tr><td><strong>Strategic PO Protection</strong></td><td>Repositioned POV article</td><td>Internal</td><td>${rptBadge('done','Done')}</td></tr>
    </tbody></table>
    <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--accent);margin:16px 0 8px">Blog Pipeline — 17 Published (Oct–Nov)</div>
    <div style="display:flex;flex-wrap:wrap;gap:6px">
    ${["Black October — Digital Trust & Quantum Threat","PQC Migration Roadmap for Banks","Quantum-Safe Migration Roadmap","Quantum-Safe Satellite Communication","Thailand Quantum-Ready 2030 for CISOs","How CISOs Prioritise PQC Migration","QShield vs QShield 2.0: What's New","Malaysia PQC Readiness for CISOs","Quantum for BFSI","Quantum in Telecom GTM","Homepage Rewrite — QShield 2.0 + Global Trust Platform","Event Coverage — Cannes (pre-event teaser + Day 1 recap)","+ 5 more SEO/AEO/GEO-treated blogs"].map(b=>`<span style="font-size:12px;padding:4px 11px;border-radius:20px;background:#FFF3EE;color:var(--accent);font-weight:500;border:1px solid #FCD9CC">${rptEsc(b)}</span>`).join('')}
    </div>`;
  }

  else if (type === 'design_detail') {
    title = 'Product & Design — All 17 Deliverables';
    sub = 'Source: PPT Slide 5 + CEO briefing notes · Claude MCP integrations cut turnaround >50%';
    const items = [
      {item:"Enterprise website — 12 pages",cat:"Website",status:"Done",detail:"Full redesign of 12 enterprise product/solution pages"},
      {item:"Claude → Framer MCP Integration",cat:"Technology",status:"Done",detail:"Cuts design turnaround by >50%"},
      {item:"Claude → Webflow MCP Integration",cat:"Technology",status:"Done",detail:"CMS connected to Claude AI via MCP"},
      {item:"Event Collaterals — Cannes Festival",cat:"Events",status:"Done",detail:"Banners, standees, brochures, digital assets"},
      {item:"Event Collaterals — Quantum+AI Tech Show UK",cat:"Events",status:"Done",detail:"Print + digital for London show, 4 Nov"},
      {item:"Event Collaterals — Malaysia Roundtable",cat:"Events",status:"Done",detail:"Tailored for SEA academy + enterprise audience"},
      {item:"Event Collaterals — Telecom Conclave",cat:"Events",status:"Done",detail:"Print materials, posters, standees"},
      {item:"Datasheets — QConnect",cat:"Product Marketing",status:"Done",detail:"Technical + commercial datasheet"},
      {item:"Datasheets — IP Encryptor",cat:"Product Marketing",status:"Done",detail:"Technical + commercial datasheet"},
      {item:"QNu Academy Brochure",cat:"Product Marketing",status:"Done",detail:"Full Academy programme brochure"},
      {item:"Claude PPT Deck",cat:"Templates",status:"Done",detail:"Master presentation deck for CEO / leadership"},
      {item:"enQase Word Template",cat:"Templates",status:"Done",detail:"Official Word template for enQase division"},
      {item:"HR Job Listing Page",cat:"Website",status:"Done",detail:"Careers page with live job listings"},
      {item:"Website Audit — Page Speed + Bandwidth",cat:"Technology",status:"Done",detail:"Speed issues and bandwidth errors fixed"},
      {item:"Partners Portal",cat:"Website",status:"Ongoing",detail:"Multi-vendor portal for channel partners"},
      {item:"Design Taxonomy",cat:"Brand System",status:"Ongoing",detail:"Standardising visual design system"},
      {item:"NCP Business Cards",cat:"Brand",status:"Ongoing",detail:"Business cards for NCP team — final review"},
    ];
    html = `<table class="rpt-tbl"><thead><tr><th>Deliverable</th><th>Category</th><th>Status</th><th>Detail</th></tr></thead><tbody>
    ${items.map(d=>`<tr><td><strong>${rptEsc(d.item)}</strong></td><td style="font-size:11px">${rptEsc(d.cat)}</td><td>${rptBadge(d.status.toLowerCase(),d.status)}</td><td style="font-size:11px">${rptEsc(d.detail)}</td></tr>`).join('')}
    </tbody></table>`;
  }

  else if (type === 'automation_detail') {
    title = 'Automation & Strategy — One View + ₹200 Cr Roadmap';
    sub = 'Source: PPT Slide 5 — Automation & Strategy section';
    html = `<table class="rpt-tbl"><thead><tr><th>Module</th><th>Status</th><th>What it does</th><th>Impact</th></tr></thead><tbody>
    <tr><td><strong>One View Module 1</strong><br><span style="font-size:11px;color:var(--muted)">Project tracker · Content approval · Marketing requisition</span></td><td>${rptBadge('live','LIVE')}</td><td style="font-size:12px">Real-time project tracking. Content approval workflows. Team requisition tool.</td><td style="font-size:12px">Integrates team, reduces frequent emails for updates.</td></tr>
    <tr><td><strong>One View Module 2</strong><br><span style="font-size:11px;color:var(--muted)">HR / CRM analytics / Monthly reports</span></td><td>${rptBadge('ongoing','In Progress')}</td><td style="font-size:12px">HR module + CRM analytics + monthly report automation</td><td style="font-size:12px">Unified view across HR, sales data and reports</td></tr>
    <tr><td><strong>One View Module 3 — Events CRM</strong><br><span style="font-size:11px;color:var(--muted)">Business card → CRM automation</span></td><td>${rptBadge('ongoing','Testing Phase')}</td><td style="font-size:12px">Automates business card → CRM entry from events</td><td style="font-size:12px">Instant CRM sync from every event, no manual entry</td></tr>
    <tr><td><strong>₹200 Cr Demand Gen Roadmap</strong><br><span style="font-size:11px;color:var(--muted)">Gartner-benchmarked analysis</span></td><td>${rptBadge('done','Done')}</td><td style="font-size:12px">Market sizing, competitive positioning, channel prioritisation, ABM playbooks for BFSI, Telecom, Govt, Academy</td><td style="font-size:12px">Clear strategy to reach ₹200 Cr pipeline. Ready to present to leadership.</td></tr>
    </tbody></table>`;
  }

  else if (type === 'bfsi') {
    title = 'BFSI — International Banks Engaged';
    sub = 'Cannes pipeline leads + October newsletter · November 2026';
    html = `
    <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--accent);margin-bottom:10px">Cannes Pipeline Leads — BFSI</div>
    <table class="rpt-tbl"><thead><tr><th>Company</th><th>Sector</th><th>Country</th><th>Est. Pipeline</th></tr></thead><tbody>
    ${RPT_CANNES_LEADS.filter(c=>['Banking','Investment Banking','Wealth'].some(s=>c.sector.includes(s))).map(c=>`<tr><td><strong>${rptEsc(c.company)}</strong></td><td>${rptEsc(c.sector)}</td><td>${rptBadge('intl',c.country)}</td><td style="color:var(--accent);font-weight:700">${c.pipeline}</td></tr>`).join('')}
    </tbody></table>
    <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--accent);margin:16px 0 8px">October Newsletter — 8 Enterprise Accounts Engaged</div>
    <div style="display:flex;flex-wrap:wrap;gap:6px">
    ${['BNP Paribas','ABN AMRO','OCBC','Optus','Axis Bank','Hexaware','Pfizer','MediaTek'].map(c=>`<span style="font-size:12px;padding:4px 11px;border-radius:20px;background:#FFF3EE;color:var(--accent);font-weight:500;border:1px solid #FCD9CC">${c}</span>`).join('')}
    </div>`;
  }

  else if (type === 'academy') {
    title = 'Academy — UAE Campaign + Maharashtra Summit';
    sub = 'QNu Academy UAE · Maharashtra Higher Ed Summit 2–3 Dec · Goa Conclave 34 leads';
    html = `
    <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--accent);margin-bottom:8px">UAE Campaign — 5 Companies Engaged</div>
    <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:16px">
    ${['Quadcode','AAFAQ','TAQA','Arbeat','Nile (UAE)'].map(c=>`<span style="font-size:12px;padding:4px 11px;border-radius:20px;background:#FFF3EE;color:var(--accent);font-weight:500;border:1px solid #FCD9CC">${c}</span>`).join('')}
    </div>
    <div style="background:#FFF7F5;border:1.5px solid #FCD9CC;border-radius:8px;padding:12px;margin-bottom:14px;font-size:13px">
      <strong>Upcoming:</strong> Maharashtra Higher Education Summit 2–3 Dec 2026. Academy pipeline event. Universities and higher education institutions across Maharashtra. Owner: Hermaan Kohli.
    </div>
    <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--accent);margin-bottom:8px">Goa Conclave (Oct) — 34 Education Leads</div>
    <div style="display:flex;flex-wrap:wrap;gap:6px">
    ${['BITS Pilani (Goa)','VIT (MoU exists)','Sharda University','JAIN University','KL University','SOA University','NIT Calicut','Ramdeobaba University','Pimpri Chinchwad University','Atria University','Alliance University','+ 24 more universities'].map(c=>`<span style="font-size:12px;padding:4px 11px;border-radius:20px;background:#F3F4F6;color:#374151;font-weight:500;border:1px solid #E5E7EB">${c}</span>`).join('')}
    </div>`;
  }

  else if (type === 'telecom') {
    title = 'Telecom — India GTM Approved';
    sub = 'Jio, Airtel, Vi, BSNL · Telecom MSME Conclave 24 Nov · Coordinator: BU India';
    html = `
    <div style="background:#FFF3EE;border-left:3px solid var(--accent);padding:10px 14px;border-radius:0 6px 6px 0;margin-bottom:14px;font-size:13px">
      <strong>India Telecom GTM approved.</strong> Key ask: Coordinate with BU India on outreach to Jio, Airtel, Vi, BSNL.
    </div>
    <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--accent);margin-bottom:8px">India Telecom GTM Targets</div>
    <div style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:16px">
    ${['Jio','Airtel','Vi','BSNL'].map(c=>`<div style="background:var(--navy);color:#fff;padding:12px 20px;border-radius:8px;font-size:14px;font-weight:700">${c}</div>`).join('')}
    </div>
    <div style="background:#FFF7F5;border:1.5px solid #FCD9CC;border-radius:8px;padding:12px;font-size:13px">
      <strong>Upcoming — Telecom Startups & MSME Conclave</strong><br>Date: 24 Nov 2026 · At Minister's invitation · Conclave targets telecom startups and MSMEs for QKD + PQC deployment.
    </div>`;
  }

  titleEl.textContent = title;
  subEl.textContent   = sub;
  bodyEl.innerHTML    = html;
  overlay.style.display = 'flex';
  document.body.style.overflow = 'hidden';

  if (['all_leads_nov','all_leads_oct','all_leads_india','all_leads_intl'].includes(type)) {
    setTimeout(() => rptInitCRM(type), 50);
  }
}

function rptCloseModal() {
  const o = document.getElementById('rptOverlay');
  if (o) o.style.display = 'none';
  document.body.style.overflow = '';
}

// ── CRM View inside modal ─────────────────────────────────────────
function rptBuildCRMView(mode) {
  const isNov = mode === true || mode === 'nov';
  window._rptFilters = {temp:'All',geo:'All',q:''};
  window._rptLeadSrc = isNov ? 'nov' : 'all';
  return `
  <div id="rpt-crm-stats" style="display:flex;gap:16px;padding:12px 14px;background:#FFF7F5;border-radius:8px;margin-bottom:14px;flex-wrap:wrap">
    <div style="text-align:center"><div style="font-size:20px;font-weight:800;color:var(--navy)" id="rptCrmTotal">—</div><div style="font-size:10px;color:var(--muted)">Total</div></div>
    <div style="text-align:center"><div style="font-size:20px;font-weight:800;color:#EF4444" id="rptCrmHot">—</div><div style="font-size:10px;color:var(--muted)">Hot</div></div>
    <div style="text-align:center"><div style="font-size:20px;font-weight:800;color:#F59E0B" id="rptCrmWarm">—</div><div style="font-size:10px;color:var(--muted)">Warm</div></div>
    <div style="text-align:center"><div style="font-size:20px;font-weight:800;color:#3B82F6" id="rptCrmIntl">—</div><div style="font-size:10px;color:var(--muted)">International</div></div>
    <div style="text-align:center"><div style="font-size:20px;font-weight:800;color:var(--accent)" id="rptCrmShowing">—</div><div style="font-size:10px;color:var(--muted)">Showing</div></div>
  </div>
  <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;align-items:center">
    <span style="font-size:11px;font-weight:600;color:var(--muted)">Status:</span>
    ${['All','Hot','Warm','Unclassified','Cold'].map(t=>`<button class="rpt-filter-btn ${t==='All'?'active':''}" onclick="rptCRMFilter('temp','${t}',this)">${t}</button>`).join('')}
  </div>
  <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;align-items:center">
    <span style="font-size:11px;font-weight:600;color:var(--muted)">Geo:</span>
    ${['All','India','Intl'].map(g=>`<button class="rpt-filter-btn ${g==='All'?'active':''}" onclick="rptCRMFilter('geo','${g}',this)">${g}</button>`).join('')}
  </div>
  <div style="margin-bottom:12px">
    <input type="text" placeholder="Search by name, company or owner..." oninput="rptCRMSearch(this.value)"
      style="padding:7px 12px;border:1.5px solid var(--border);border-radius:8px;font-size:12px;width:280px;outline:none;font-family:inherit"/>
  </div>
  <div style="overflow-x:auto">
  <table class="rpt-tbl">
    <thead><tr><th>#</th><th>Name</th><th>Company</th><th>Phone</th><th>Geo</th><th>Event / Source</th><th>Status</th><th>Owner</th><th>Reason / Message</th></tr></thead>
    <tbody id="rptCrmTbody"></tbody>
  </table></div>`;
}

function rptInitCRM(mode) {
  const allIntl = [
    ...RPT_CANNES_LEADS.map(c=>({name:c.company,company:c.company,phone:'—',owner:'Vikas B / Sudiptaa Paul',temp:'Hot',date:'17-18 Nov',msg:c.signal+' · Est. '+c.pipeline,event:'Cannes Festival',geo:'International'})),
    ...RPT_THAILAND_LEADS.map(l=>({name:l.name,company:l.company,phone:'—',owner:l.owner,temp:l.signal,date:l.date,msg:l.note,event:'Thailand Roundtable 2026',geo:'International'})),
    ...RPT_LONDON_LEADS.map(l=>({name:l.name,company:l.company,phone:l.phone,owner:'Sudiptaa Paul Choudhury',temp:l.signal,date:'4 Nov',msg:l.note,event:'Quantum + AI Tech Show London',geo:'International'})),
    {name:'Hot Lead 1',company:'Luxembourg bilateral meeting',phone:'—',owner:'Sudiptaa Paul Choudhury',temp:'Hot',date:'6-7 Nov',msg:'High-value bilateral meeting',event:'Luxembourg 1:1 Meetings',geo:'International'},
    {name:'Hot Lead 2',company:'Luxembourg bilateral meeting',phone:'—',owner:'Sudiptaa Paul Choudhury',temp:'Hot',date:'6-7 Nov',msg:'High-value bilateral meeting',event:'Luxembourg 1:1 Meetings',geo:'International'},
  ];
  const allIndia = RPT_NOV_WEBSITE_LEADS.filter(l=>!l.geo||l.geo==='India'||l.geo.toLowerCase()==='india');
  const allNov   = [...RPT_NOV_WEBSITE_LEADS,...allIntl];
  const src = mode==='india' ? allIndia : mode==='intl' ? allIntl : mode==='all_leads_nov' ? allNov : allNov;
  window._rptCrmSrc = src;
  window._rptFilters = {temp:'All',geo:'All',q:''};
  const tot=src.length, hot=src.filter(l=>l.temp==='Hot').length, warm=src.filter(l=>l.temp==='Warm').length;
  const intl=src.filter(l=>(l.geo||'').toLowerCase().includes('int')).length;
  const s=id=>document.getElementById(id);
  if(s('rptCrmTotal')) s('rptCrmTotal').textContent=tot;
  if(s('rptCrmHot'))   s('rptCrmHot').textContent=hot;
  if(s('rptCrmWarm'))  s('rptCrmWarm').textContent=warm;
  if(s('rptCrmIntl'))  s('rptCrmIntl').textContent=intl;
  rptCRMRender();
}

function rptCRMFilter(key,val,btn) {
  window._rptFilters[key]=val;
  btn.closest('div').querySelectorAll('.rpt-filter-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  rptCRMRender();
}
function rptCRMSearch(q) { window._rptFilters.q=q; rptCRMRender(); }

function rptCRMRender() {
  const f=window._rptFilters||{};
  const src=window._rptCrmSrc||RPT_NOV_WEBSITE_LEADS;
  const filtered=src.filter(l=>{
    if(f.temp&&f.temp!=='All'&&l.temp!==f.temp) return false;
    if(f.geo&&f.geo==='India'&&(l.geo||'').toLowerCase().includes('int')) return false;
    if(f.geo&&f.geo==='Intl'&&!(l.geo||'').toLowerCase().includes('int')) return false;
    if(f.q){const q=f.q.toLowerCase();if(!(l.name||'').toLowerCase().includes(q)&&!(l.company||'').toLowerCase().includes(q)&&!(l.owner||'').toLowerCase().includes(q)) return false;}
    return true;
  });
  const s=id=>document.getElementById(id);
  if(s('rptCrmShowing')) s('rptCrmShowing').textContent=filtered.length;
  const tbody=s('rptCrmTbody');
  if(!tbody) return;
  tbody.innerHTML=filtered.map((l,i)=>`<tr>
    <td>${i+1}</td>
    <td><strong>${rptEsc(l.name||'-')}</strong></td>
    <td>${rptEsc(l.company||'-')}</td>
    <td style="white-space:nowrap;font-size:11px">${rptEsc(l.phone||'—')}</td>
    <td>${(l.geo||'').toLowerCase().includes('int')?rptBadge('intl','Intl'):rptBadge('india','India')}</td>
    <td style="font-size:11px;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${rptEsc(l.event||l.date||'-')}</td>
    <td>${rptBadge((l.temp||'').toLowerCase(),l.temp||'—')}</td>
    <td style="font-size:11px">${rptEsc(l.owner||'-')}</td>
    <td style="font-size:11px;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${rptEsc(l.msg||'')}">${rptEsc(l.msg||'—')}</td>
  </tr>`).join('');
}

// ── Download ──────────────────────────────────────────────────────
function rptDownload() {
  const content = document.querySelector('.rpt-wrap');
  if (!content) return;
  const style = Array.from(document.styleSheets).map(ss => {
    try { return Array.from(ss.cssRules).map(r=>r.cssText).join('\n'); } catch(e) { return ''; }
  }).join('\n');
  const blob = new Blob([`<!DOCTYPE html><html><head><meta charset="UTF-8"/><style>${style}</style></head><body style="background:#f3f4f6">${content.outerHTML}</body></html>`], {type:'text/html'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'QNu_Marketing_Report_Nov2026.html';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(a.href), 1500);
  toast('Report downloaded.');
}
