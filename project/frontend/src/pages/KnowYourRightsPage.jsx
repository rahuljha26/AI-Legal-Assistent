import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { adviceAPI } from '../api';

// ─── All Indian Laws & Acts Dataset ──────────────────────────────────────────
const LAW_CATEGORIES = [
  {
    id: 'constitution',
    label: '🏛️ Constitutional Rights',
    color: '#60a5fa',
    bg: 'rgba(59, 130, 246, 0.15)',
    laws: [
      { name: 'Article 12–35: Fundamental Rights', summary: 'Right to Equality, Freedom, against Exploitation, to Freedom of Religion, Cultural & Educational Rights, Right to Constitutional Remedies.', tags: ['Fundamental Rights', 'Article 14', 'Article 19', 'Article 21', 'Article 32'] },
      { name: 'Article 14: Right to Equality', summary: 'Equality before law and equal protection. No discrimination on the basis of religion, race, caste, sex, or place of birth.', tags: ['Equality', 'Anti-discrimination'] },
      { name: 'Article 19: Right to Freedom', summary: 'Freedom of speech, assembly, movement, residence, and profession. Subject to reasonable restrictions by the State.', tags: ['Free Speech', 'Assembly', 'Profession'] },
      { name: 'Article 21: Right to Life', summary: 'No person shall be deprived of life or personal liberty except by procedure established by law. Includes right to livelihood, health, privacy, education.', tags: ['Life', 'Liberty', 'Privacy', 'Health'] },
      { name: 'Article 21A: Right to Education', summary: 'Free and compulsory education for all children aged 6–14 years. Implemented by the RTE Act 2009.', tags: ['Education', 'Children', 'RTE'] },
      { name: 'Article 22: Protection from Arrest', summary: 'Right to be informed of grounds of arrest, right to consult a lawyer, right not to be detained beyond 24 hours without magistrate authority.', tags: ['Arrest', 'Detention', 'Police'] },
      { name: 'Article 23–24: Against Exploitation', summary: 'Prohibition of trafficking, forced labour, and child labour in factories and hazardous employment.', tags: ['Child Labour', 'Trafficking', 'Forced Labour'] },
      { name: 'Article 25–28: Freedom of Religion', summary: 'Freedom of conscience, freely profess, practise and propagate religion. Manage religious affairs. No religious instruction in State-funded schools.', tags: ['Religion', 'Minority Rights', 'Secularism'] },
      { name: 'Article 32: Right to Constitutional Remedies', summary: 'Right to move Supreme Court for enforcement of Fundamental Rights. Dr Ambedkar called it the "Heart and Soul" of the Constitution.', tags: ['Supreme Court', 'Writ', 'Enforcement'] },
      { name: 'Articles 36–51: Directive Principles', summary: 'Guidelines for the State to ensure social and economic justice — living wage, free legal aid, equal pay for equal work, environmental protection.', tags: ['DPSP', 'Social Justice', 'Economic Policy'] },
      { name: 'Article 51A: Fundamental Duties', summary: '11 duties of every citizen — respect the Constitution, protect sovereignty, promote harmony, protect environment, develop scientific temper.', tags: ['Duties', 'Citizen Obligations'] },
    ],
  },
  {
    id: 'criminal',
    label: '⚖️ Criminal Law',
    color: 'var(--danger)',
    bg: 'var(--danger-bg)',
    laws: [
      { name: 'Bharatiya Nyaya Sanhita (BNS) 2023', summary: 'Replaced IPC 1860. Covers offences against body (murder, grievous hurt), property (theft, robbery), public order, marriage, defamation, and more.', tags: ['BNS', 'IPC', 'Criminal Offences', 'Murder', 'Theft'] },
      { name: 'IPC Section 302: Murder', summary: 'Punishment for murder is death or life imprisonment and also fine. Killing with intention or knowledge of causing death.', tags: ['Murder', 'Death Penalty', 'IPC'] },
      { name: 'IPC Section 307: Attempt to Murder', summary: 'Attempt to commit murder — imprisonment up to 10 years + fine; life imprisonment if person is hurt.', tags: ['Attempt to Murder', 'IPC'] },
      { name: 'IPC Section 376: Rape', summary: 'Rape is punishable by minimum 7 years rigorous imprisonment, extendable to life or death. POCSO governs cases involving minors.', tags: ['Rape', 'Sexual Assault', 'POCSO', 'Women Rights'] },
      { name: 'IPC Section 420: Cheating', summary: 'Cheating and inducing delivery of property — imprisonment up to 7 years + fine. Commonly applied in fraud and financial scam cases.', tags: ['Cheating', 'Fraud', 'Financial Crime'] },
      { name: 'IPC Section 498A: Domestic Violence', summary: 'Cruelty by husband or relatives — imprisonment up to 3 years + fine. Includes physical, mental cruelty and harassment for dowry.', tags: ['Domestic Violence', 'Dowry', 'Women Rights', 'Cruelty'] },
      { name: 'IPC Section 354: Outraging Modesty', summary: 'Assault or use of force against a woman with intent to outrage modesty — minimum 1 year, up to 5 years imprisonment.', tags: ['Women Safety', 'Sexual Harassment', 'Modesty'] },
      { name: 'Bharatiya Nagarik Suraksha Sanhita (BNSS) 2023', summary: 'Replaced CrPC 1973. Governs arrest, bail, trial procedure, FIR, chargesheet, and criminal court process.', tags: ['CrPC', 'FIR', 'Arrest', 'Bail', 'Trial'] },
      { name: 'Bharatiya Sakshya Adhiniyam (BSA) 2023', summary: 'Replaced Indian Evidence Act 1872. Governs admissibility, burden of proof, electronic records as evidence, confessions, and expert opinions.', tags: ['Evidence', 'Proof', 'Electronic Evidence', 'Court'] },
    ],
  },
  {
    id: 'civil',
    label: '📋 Civil & Property Law',
    color: '#a78bfa',
    bg: 'rgba(139, 92, 246, 0.15)',
    laws: [
      { name: 'Transfer of Property Act 1882', summary: 'Governs transfer of immovable property — sale, mortgage, lease, exchange, gift. Requires registration under the Registration Act.', tags: ['Property', 'Sale', 'Mortgage', 'Lease', 'Gift Deed'] },
      { name: 'Registration Act 1908', summary: 'Compulsory registration of property documents. Sale deeds, gift deeds, and leases over 1 year must be registered at Sub-Registrar office.', tags: ['Registration', 'Property', 'Sale Deed', 'Gift Deed'] },
      { name: 'The Rent Control Acts (State-wise)', summary: 'Protect tenants from arbitrary eviction and regulate rents. Vary by state — Maharashtra, Delhi, Karnataka each have separate Rent Acts.', tags: ['Tenant Rights', 'Eviction', 'Rent', 'Landlord'] },
      { name: 'Code of Civil Procedure (CPC) 1908', summary: 'Governs procedure in civil suits — filing, summons, pleadings, discovery, trial, decree, and execution.', tags: ['Civil Suit', 'Court', 'Decree', 'Execution', 'Appeal'] },
      { name: 'Specific Relief Act 1963', summary: 'Provides for specific performance of contracts. A buyer can compel a seller to honour a sale agreement instead of just claiming damages.', tags: ['Contract', 'Specific Performance', 'Property'] },
      { name: 'Limitation Act 1963', summary: 'Time limits for filing cases — 3 years for civil suits, 12 years for property claims, 30 days to challenge court orders. Filing after limitation is barred.', tags: ['Limitation', 'Time Limit', 'Filing Deadline'] },
      { name: 'Indian Contract Act 1872', summary: 'Governs agreement, offer, acceptance, consideration, capacity, free consent, void and voidable contracts, breach, and remedies.', tags: ['Contract', 'Agreement', 'Breach', 'Offer', 'Acceptance'] },
      { name: 'RERA 2016: Real Estate Act', summary: 'Protects homebuyers. Builders must register projects, disclose carpet area, deliver on time. File complaint with State RERA authority.', tags: ['Real Estate', 'Builder', 'Homebuyer', 'RERA', 'Flat'] },
    ],
  },
  {
    id: 'family',
    label: '👨‍👩‍👧 Family & Personal Law',
    color: '#f472b6',
    bg: 'rgba(236, 72, 153, 0.15)',
    laws: [
      { name: 'Hindu Marriage Act 1955', summary: 'Governs marriage, divorce (Section 13), judicial separation, maintenance, restitution of conjugal rights for Hindus, Sikhs, Jains, Buddhists.', tags: ['Marriage', 'Divorce', 'Hindu Law', 'Maintenance', 'Mutual Consent'] },
      { name: 'Muslim Personal Law (Shariat) Act 1937', summary: 'Governs Muslim marriage (Nikah), Triple Talaq (now abolished), divorce, dower (Mehr), maintenance, and inheritance.', tags: ['Muslim Law', 'Nikah', 'Triple Talaq', 'Mehr', 'Divorce'] },
      { name: 'Special Marriage Act 1954', summary: 'Allows inter-religion and civil marriages. Also enables civil divorce and court marriage without religious rituals.', tags: ['Inter-religion', 'Court Marriage', 'Civil Marriage'] },
      { name: 'Hindu Succession Act 1956 (amended 2005)', summary: '2005 amendment gave daughters equal coparcenary rights in ancestral property. Sons and daughters have equal shares.',  tags: ['Inheritance', 'Succession', 'Daughters Rights', 'Will'] },
      { name: 'Domestic Violence Act (PWDVA) 2005', summary: 'Protection from physical, sexual, emotional, verbal, and economic abuse by husband or relatives. Civil remedies = protection orders, residence orders, monetary relief.', tags: ['Domestic Violence', 'Women Rights', 'Protection Order', 'Shelter'] },
      { name: 'Dowry Prohibition Act 1961', summary: 'Giving or taking dowry is a criminal offence (5 years imprisonment + fine). IPC 498A complements this Act.', tags: ['Dowry', 'Women Rights', 'Marriage', 'Criminal'] },
      { name: 'Guardianship & Wards Act 1890', summary: 'Governs guardianship of minor children — court decides based on welfare of the child, not gender of parent.', tags: ['Child Custody', 'Guardianship', 'Divorce', 'Minor'] },
      { name: 'Child Marriage Restraint Act / PCMA 2006', summary: 'Child marriage for boys under 21 or girls under 18 is voidable. Involved adults face criminal penalties.', tags: ['Child Marriage', 'Minor', 'Age of Marriage'] },
    ],
  },
  {
    id: 'labour',
    label: '👷 Labour & Employment Law',
    color: 'var(--warning)',
    bg: 'var(--warning-bg)',
    laws: [
      { name: 'Labour Codes 2020 (4 Codes)', summary: 'Consolidated 44+ labour laws into 4 codes: Wages, Industrial Relations, Social Security, Occupational Safety. Govern minimum wage, working hours, ESI, PF.', tags: ['Labour Law', 'Wages', 'ESI', 'PF', 'Working Hours'] },
      { name: 'Payment of Wages Act 1936', summary: 'Employers must pay wages on time (7th/10th of month). Deductions only as prescribed — fines, PF, ESI, advances. No arbitrary deductions.', tags: ['Wages', 'Salary', 'Employer', 'Deductions'] },
      { name: 'Minimum Wages Act 1948', summary: 'Every employer must pay minimum wages notified by State/Central government. Unskilled, semi-skilled, skilled, highly skilled categories.', tags: ['Minimum Wage', 'Labour Rights', 'Employer'] },
      { name: 'Employees Provident Fund (EPF) Act 1952', summary: '12% employer + 12% employee contribution. PF withdrawal on retirement, 2 months unemployment, or medical emergency. Governed by EPFO.', tags: ['PF', 'EPFO', 'Retirement', 'Savings'] },
      { name: 'Employees State Insurance (ESI) Act 1948', summary: 'Medical and cash benefits for employees earning ≤ ₹21,000/month. Covers sickness, maternity, disablement, death benefits.', tags: ['ESI', 'Medical', 'Insurance', 'Employees'] },
      { name: 'Sexual Harassment at Workplace (POSH) 2013', summary: 'Every workplace with 10+ employees must have Internal Complaints Committee (ICC). Complaints to be resolved within 90 days.', tags: ['Sexual Harassment', 'Workplace', 'POSH', 'Women Rights', 'ICC'] },
      { name: 'Maternity Benefit Act 1961 (amended 2017)', summary: '26 weeks paid maternity leave (for first 2 children), 12 weeks for subsequent children. Crèche facility mandatory for 50+ employees.', tags: ['Maternity Leave', 'Women Rights', 'Pregnancy', 'Crèche'] },
      { name: 'Industrial Disputes Act 1947', summary: 'Governs retrenchment, lay-off, closure, and collective bargaining. Workers can file grievances before Labour Commissioner or Industrial Tribunal.', tags: ['Retrenchment', 'Lay-off', 'Strike', 'Union', 'Dismissal'] },
      { name: 'Gratuity Act 1972', summary: '5+ years of continuous service entitles employee to gratuity = 15 days salary × years of service. Payable on retirement, resignation, or death.', tags: ['Gratuity', 'Retirement Benefit', 'Employee Rights'] },
    ],
  },
  {
    id: 'consumer',
    label: '🛒 Consumer Protection',
    color: 'var(--success)',
    bg: 'var(--success-bg)',
    laws: [
      { name: 'Consumer Protection Act 2019', summary: 'Defines consumer rights, unfair trade practices, product liability. Central Consumer Protection Authority (CCPA). E-filing complaints online.', tags: ['Consumer Rights', 'Defective Product', 'Unfair Trade', 'Forum'] },
      { name: 'Consumer Forum (District/State/National)', summary: 'Claim up to ₹1 crore → District Forum; ₹1–10 crore → State Commission; above ₹10 crore → National Commission (NCDRC).', tags: ['Consumer Forum', 'Complaint', 'Relief', 'Compensation'] },
      { name: 'E-Commerce Consumer Rights 2020', summary: 'E-commerce platforms must display all charges, provide grievance officer, allow return/refund, no bundling of unnecessary services.', tags: ['Online Shopping', 'E-commerce', 'Amazon', 'Flipkart', 'Refund'] },
      { name: 'Food Safety and Standards Act (FSSAI) 2006', summary: 'Regulates food quality and safety. File complaint with FSSAI for adulterated food, false labelling, or expiry violations.', tags: ['Food Safety', 'FSSAI', 'Adulteration', 'Restaurant'] },
      { name: 'BIS (Bureau of Indian Standards) Act 2016', summary: 'Mandatory ISI/BIS certification for many products. File complaint for substandard electronics, toys, steel, or cement products.', tags: ['Product Quality', 'ISI', 'Standards', 'Certification'] },
    ],
  },
  {
    id: 'cyber',
    label: '💻 Cyber & Digital Law',
    color: '#22d3ee',
    bg: 'rgba(6, 182, 212, 0.15)',
    laws: [
      { name: 'Information Technology Act 2000 (IT Act)', summary: 'Governs electronic records, digital signatures, cyber crimes. Section 66 (hacking), 66C (identity theft), 66D (cheating by impersonation), 67 (obscene content).', tags: ['IT Act', 'Hacking', 'Cybercrime', 'Digital Signature'] },
      { name: 'IT Act Section 66: Hacking / Data Theft', summary: 'Hacking into a computer system — 3 years imprisonment + ₹5 lakh fine. Includes unauthorized access and data tampering.', tags: ['Hacking', 'Data Theft', 'Cybercrime', '66C'] },
      { name: 'IT Act Section 67: Obscene Content', summary: 'Publishing or transmitting obscene material electronically — 3–5 years imprisonment + ₹5–10 lakh fine.', tags: ['Cybercrime', 'Obscenity', 'Online Content'] },
      { name: 'Digital Personal Data Protection Act 2023', summary: 'Citizens have right to access, correct, and erase their personal data. Data Fiduciaries must get consent. Penalties up to ₹250 crore for breach.', tags: ['Data Privacy', 'DPDP', 'Personal Data', 'Consent', 'Aadhaar'] },
      { name: 'IT (Intermediary Guidelines) Rules 2021', summary: 'Social media platforms (Twitter, Facebook) must appoint Grievance Officer, act on complaints within 72 hours, provide monthly compliance reports.', tags: ['Social Media', 'Content Takedown', 'Grievance Officer', 'Platform'] },
      { name: 'Cyber Stalking / Harassment (IPC 354D)', summary: 'Stalking a woman online or offline is a criminal offence — 1st offence: 3 years; repeat: 5 years imprisonment.', tags: ['Cyber Stalking', 'Online Harassment', 'Women Safety'] },
    ],
  },
  {
    id: 'rtirti',
    label: '📄 RTI & Government Rights',
    color: '#c084fc',
    bg: 'rgba(139, 92, 246, 0.15)',
    laws: [
      { name: 'Right to Information Act (RTI) 2005', summary: 'Any citizen can request information from any public authority. PIO must respond within 30 days (48 hrs for life/liberty matters). Fee: ₹10 per request.', tags: ['RTI', 'Government Information', 'Transparency', 'PIO'] },
      { name: 'Legal Services Authorities Act 1987', summary: 'Free legal aid from NALSA/DLSA for SC/ST, women, disabled, prisoners, accident victims, income < ₹3 lakh. File application at District Legal Services Authority.', tags: ['Free Legal Aid', 'NALSA', 'DLSA', 'Poor', 'Lok Adalat'] },
      { name: 'Whistle Blowers Protection Act 2014', summary: 'Protection for persons who disclose corruption or wilful misuse of power by public servants. Complaint to Competent Authority.', tags: ['Whistleblower', 'Corruption', 'Public Servant', 'Disclosure'] },
      { name: 'Prevention of Corruption Act 1988 (PC Act)', summary: 'Taking or giving bribe to a public official is a criminal offence — 3–7 years imprisonment. FIR with CBI / Anti-Corruption Bureau.', tags: ['Bribery', 'Corruption', 'CBI', 'Public Servant'] },
      { name: 'Aadhaar Act 2016', summary: 'Governs collection, use, and security of Aadhaar biometric data. UIDAI must be informed of any breach. Misuse of Aadhaar data is penalised.', tags: ['Aadhaar', 'Privacy', 'Biometric', 'UIDAI'] },
    ],
  },
  {
    id: 'women',
    label: '👩 Women & Child Rights',
    color: '#fb7185',
    bg: 'rgba(236, 72, 153, 0.15)',
    laws: [
      { name: 'POCSO Act 2012', summary: 'Protection of Children from Sexual Offences. Penetrative assault → 10 years to life. Mandatory reporting by any adult. Child-friendly trial procedures.', tags: ['POCSO', 'Child Protection', 'Sexual Abuse', 'Minor'] },
      { name: 'Protection of Women from DV Act 2005', summary: 'Broad protection against domestic violence — physical, sexual, verbal, emotional, economic. Civil remedies within 60 days.', tags: ['Domestic Violence', 'DV Act', 'Women Safety', 'Protection Order'] },
      { name: 'Equal Remuneration Act 1976', summary: 'Equal pay for equal work for men and women. Employers cannot pay women less for same work. File complaint with Labour Commissioner.', tags: ['Equal Pay', 'Gender Discrimination', 'Salary', 'Women Rights'] },
      { name: 'Pre-Conception and Pre-Natal Diagnostics Act (PC-PNDT)', summary: 'Using sex determination to abort female foetus is illegal. Clinics must be registered. Penalty up to 3–5 years.', tags: ['Female Foeticide', 'Sex Determination', 'Abortion', 'PCPNDT'] },
      { name: 'Juvenile Justice (JJ) Act 2015', summary: 'Governs care and protection of children in conflict with law and children in need. Children under 18 tried by Juvenile Justice Board.', tags: ['Juvenile', 'Child Rights', 'JJB', 'Reform School'] },
      { name: 'Right to Education (RTE) Act 2009', summary: 'Free compulsory education 6–14 years. 25% seats reserved in private schools for economically weaker sections. No child can be expelled or failed till Grade 8.', tags: ['Education', 'Free Schooling', 'Private School', 'EWS'] },
    ],
  },
];

const ALL_TAGS = [...new Set(LAW_CATEGORIES.flatMap(c => c.laws.flatMap(l => l.tags)))].sort();

// ─── Quick Questions per category ────────────────────────────────────────────
const QUICK_QUESTIONS = {
  constitution: ['What are my fundamental rights if police arrest me?', 'Can I be fired for practicing my religion?', 'What is Article 21 and how does it protect me?'],
  criminal: ['How do I file an FIR?', 'What should I do if I am a victim of domestic violence?', 'Can police arrest without a warrant?'],
  civil: ['My landlord is not returning my security deposit, what can I do?', 'How do I register a property in India?', 'What is RERA and how does it protect homebuyers?'],
  family: ['How can I get a divorce in India?', 'What is my share in ancestral property as a daughter?', 'My husband is harassing me for dowry, what should I do?'],
  labour: ['My employer is not paying salary, what are my rights?', 'Can my employer fire me without notice?', 'How do I file a POSH complaint?'],
  consumer: ['How do I file a consumer court complaint?', 'Amazon is not giving me a refund, what can I do?', 'What is the time limit to file a consumer complaint?'],
  cyber: ['Someone hacked my account, what should I do?', 'My personal data was leaked online, can I take legal action?', 'How do I report cybercrime in India?'],
  rtirti: ['How do I file an RTI application?', 'How do I get free legal aid in India?', 'How do I report a bribe?'],
  women: ['How do I report sexual harassment at workplace?', 'What are my rights as a domestic violence victim?', 'What is POCSO and how does it protect children?'],
};

export default function KnowYourRightsPage() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('constitution');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLaw, setSelectedLaw] = useState(null);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnswer, setAiAnswer] = useState(null);
  const [aiError, setAiError] = useState('');
  const answerRef = useRef(null);

  useEffect(() => {
    if (aiAnswer) answerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [aiAnswer]);

  const activeCat = LAW_CATEGORIES.find(c => c.id === activeCategory);

  // Filter laws by search
  const filteredLaws = searchTerm.trim()
    ? LAW_CATEGORIES.flatMap(c => c.laws
        .filter(l =>
          l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          l.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
          l.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
        )
        .map(l => ({ ...l, categoryId: c.id, categoryLabel: c.label, color: c.color, bg: c.bg }))
      )
    : activeCat.laws.map(l => ({ ...l, categoryId: activeCategory, color: activeCat.color, bg: activeCat.bg }));

  const handleAskAI = async (question) => {
    const q = (question || aiQuestion).trim();
    if (!q) return;
    setAiQuestion(q);
    setAiLoading(true);
    setAiAnswer(null);
    setAiError('');
    try {
      const res = await adviceAPI.ask({ query: q });
      const aiResponse = res.data?.data?.advice?.ai_response ?? res.data?.data ?? res.data;
      const advice = typeof aiResponse === 'string' ? JSON.parse(aiResponse) : aiResponse;
      setAiAnswer(advice);
    } catch (err) {
      setAiError(err?.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const goToFullChat = () => navigate('/dashboard/chat', { state: { prefilledQuery: aiQuestion } });

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        {/* Header */}
        <header className="topbar">
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>⚖️ Know Your Rights</h2>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
              All major Indian Laws, Acts & Constitutional Rights — ask AI for personalised guidance
            </div>
          </div>
        </header>

        <div className="page-body" style={{ maxWidth: 1200, margin: '0 auto' }}>

          {/* ── Search Bar ────────────────────────────────────────────────── */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
            <input
              className="form-control"
              placeholder="Search any law, act, section, or keyword…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ flex: 1, borderRadius: 8 }}
            />
            {searchTerm && (
              <button className="btn btn-ghost" onClick={() => setSearchTerm('')}>✕ Clear</button>
            )}
          </div>

          {/* ── AI Question Box ───────────────────────────────────────────── */}
          <div style={{
            background: 'linear-gradient(135deg, #451a03 0%, var(--primary) 100%)',
            borderRadius: 16, padding: '24px 28px', marginBottom: 28, color: '#fff',
            boxShadow: '0 4px 24px rgba(234, 88, 12, 0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <span style={{ fontSize: 24 }}>🤖</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>Ask AI Legal Advisor</div>
                <div style={{ fontSize: 13, opacity: 0.85 }}>Ask any question about your rights — get instant, article-specific legal guidance</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                value={aiQuestion}
                onChange={e => setAiQuestion(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleAskAI()}
                placeholder="e.g. My employer is not paying my salary for 3 months. What can I do?"
                style={{
                  flex: 1, background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.3)',
                  borderRadius: 8, padding: '12px 16px', color: '#fff', fontSize: 14, outline: 'none',
                  fontFamily: 'Inter, sans-serif'
                }}
              />
              <button
                onClick={() => handleAskAI()}
                disabled={!aiQuestion.trim() || aiLoading}
                style={{
                  background: aiQuestion.trim() ? '#fff' : 'rgba(255,255,255,0.3)',
                  color: '#60a5fa', border: 'none', borderRadius: 8,
                  padding: '12px 20px', fontWeight: 700, cursor: aiQuestion.trim() ? 'pointer' : 'default',
                  fontSize: 14, whiteSpace: 'nowrap',
                }}
              >
                {aiLoading ? '⏳ Thinking…' : '⚡ Ask AI'}
              </button>
            </div>

            {/* Quick question chips from active category */}
            {!aiLoading && !aiAnswer && (
              <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                {(QUICK_QUESTIONS[activeCategory] || []).map(q => (
                  <span
                    key={q}
                    onClick={() => handleAskAI(q)}
                    style={{
                      background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)',
                      borderRadius: 50, padding: '5px 14px', fontSize: 12, cursor: 'pointer',
                      color: '#fff', transition: 'background 0.2s',
                    }}
                  >
                    {q}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* ── AI Answer Panel ──────────────────────────────────────────── */}
          {(aiLoading || aiAnswer || aiError) && (
            <div ref={answerRef} style={{
              background: 'rgba(59, 130, 246, 0.15)', border: '1.5px solid #BFDBFE', borderRadius: 12,
              padding: '20px 24px', marginBottom: 24
            }}>
              {aiLoading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#60a5fa' }}>
                  <span style={{ fontSize: 20 }}>⚖️</span>
                  <span style={{ fontSize: 14 }}>AI Legal Advisor is researching your rights…</span>
                </div>
              )}
              {aiError && !aiLoading && (
                <div style={{ color: 'var(--danger)', fontSize: 14 }}>⚠️ {aiError}</div>
              )}
              {aiAnswer && !aiLoading && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#60a5fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', border: '2px solid #fff' }} />
                    </div>
                    <strong style={{ color: '#60a5fa', fontSize: 15 }}>AI Legal Advisor</strong>
                    {aiAnswer.constitution_reference && (
                      <span style={{ background: 'var(--primary)', color: '#60a5fa', padding: '2px 10px', borderRadius: 50, fontSize: 12 }}>
                        {aiAnswer.constitution_reference}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'grid', gap: 14 }}>
                    {aiAnswer.applicable_law && (
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.5px', marginBottom: 4 }}>APPLICABLE LAW</div>
                        <div style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.6 }}>{aiAnswer.applicable_law}</div>
                      </div>
                    )}
                    {aiAnswer.steps_to_take?.length > 0 && (
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.5px', marginBottom: 4 }}>STEPS TO TAKE</div>
                        <ol style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.7 }}>
                          {aiAnswer.steps_to_take.map((s, i) => <li key={i} style={{ paddingBottom: 4 }}>{s}</li>)}
                        </ol>
                      </div>
                    )}
                    {aiAnswer.documents_required?.length > 0 && (
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.5px', marginBottom: 4 }}>DOCUMENTS NEEDED</div>
                        <div style={{ fontSize: 14, color: 'var(--text-primary)' }}>{aiAnswer.documents_required.join(' · ')}</div>
                      </div>
                    )}
                    {aiAnswer.where_to_file && (
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.5px', marginBottom: 4 }}>WHERE TO FILE</div>
                        <div style={{ fontSize: 14, color: 'var(--text-primary)' }}>{aiAnswer.where_to_file}</div>
                      </div>
                    )}
                    {aiAnswer.possible_outcomes?.length > 0 && (
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.5px', marginBottom: 4 }}>POSSIBLE OUTCOMES</div>
                        <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.7 }}>
                          {aiAnswer.possible_outcomes.map((o, i) => <li key={i} style={{ paddingBottom: 4 }}>{o}</li>)}
                        </ul>
                      </div>
                    )}
                    {aiAnswer.disclaimer && (
                      <div style={{ borderTop: '1px solid #BFDBFE', paddingTop: 12, fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        {aiAnswer.disclaimer}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={goToFullChat}
                    style={{ marginTop: 16, background: '#60a5fa', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                  >
                    💬 Continue in Full Chat
                  </button>
                </>
              )}
            </div>
          )}

          {/* ── Category Tabs + Law Cards ────────────────────────────────── */}
          {!searchTerm && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
              {LAW_CATEGORIES.map(c => (
                <button
                  key={c.id}
                  onClick={() => { setActiveCategory(c.id); setSelectedLaw(null); setAiAnswer(null); setAiError(''); }}
                  style={{
                    padding: '8px 16px', borderRadius: 50, border: '1.5px solid',
                    borderColor: activeCategory === c.id ? activeCat.color : 'var(--border)',
                    background: activeCategory === c.id ? activeCat.bg : 'var(--bg-card)',
                    color: activeCategory === c.id ? activeCat.color : 'var(--text-muted)',
                    fontSize: 13, fontWeight: activeCategory === c.id ? 700 : 500,
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>
          )}

          {searchTerm && (
            <div style={{ marginBottom: 16, fontSize: 14, color: 'var(--text-muted)' }}>
              {filteredLaws.length} result{filteredLaws.length !== 1 ? 's' : ''} for "{searchTerm}"
            </div>
          )}

          {/* Law Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
            {filteredLaws.map((law, i) => (
              <div
                key={i}
                onClick={() => setSelectedLaw(selectedLaw?.name === law.name ? null : law)}
                style={{
                  background: selectedLaw?.name === law.name ? law.bg : 'var(--bg-card)',
                  border: `1.5px solid ${selectedLaw?.name === law.name ? law.color : 'var(--border)'}`,
                  borderRadius: 12, padding: 20, cursor: 'pointer',
                  transition: 'all 0.15s', boxShadow: selectedLaw?.name === law.name ? `0 0 0 3px ${law.color}22` : 'none',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-heading)', lineHeight: 1.4 }}>{law.name}</div>
                  <span style={{ color: law.color, fontSize: 12, flexShrink: 0, fontWeight: 600 }}>
                    {selectedLaw?.name === law.name ? '▲ Less' : '▼ More'}
                  </span>
                </div>

                {law.categoryLabel && searchTerm && (
                  <div style={{ marginTop: 4, fontSize: 11, color: law.color, fontWeight: 600 }}>{law.categoryLabel}</div>
                )}

                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8, marginBottom: 10, lineHeight: 1.6 }}>
                  {selectedLaw?.name === law.name ? law.summary : `${law.summary.slice(0, 100)}…`}
                </p>

                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  {law.tags.slice(0, 4).map(t => (
                    <span key={t} style={{
                      background: `${law.color}15`, color: law.color, border: `1px solid ${law.color}33`,
                      borderRadius: 50, padding: '2px 8px', fontSize: 11, fontWeight: 500
                    }}>{t}</span>
                  ))}
                </div>

                {/* Expanded: Ask AI about this law */}
                {selectedLaw?.name === law.name && (
                  <div style={{ marginTop: 14, borderTop: `1px solid ${law.color}33`, paddingTop: 14 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>
                      Ask about this law:
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                      {(QUICK_QUESTIONS[activeCategory] || QUICK_QUESTIONS.constitution).slice(0, 2).map(q => (
                        <span
                          key={q}
                          onClick={e => { e.stopPropagation(); setAiQuestion(q); handleAskAI(q); }}
                          style={{
                            background: `${law.color}15`, color: law.color, border: `1px solid ${law.color}33`,
                            borderRadius: 50, padding: '4px 12px', fontSize: 12, cursor: 'pointer'
                          }}
                        >
                          🤖 {q}
                        </span>
                      ))}
                      <span
                        onClick={e => { e.stopPropagation(); handleAskAI(`Explain ${law.name} and my rights under it`); }}
                        style={{
                          background: `${law.color}15`, color: law.color, border: `1px solid ${law.color}33`,
                          borderRadius: 50, padding: '4px 12px', fontSize: 12, cursor: 'pointer'
                        }}
                      >
                        🤖 Explain {law.name.split(':')[0]}
                      </span>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); navigate('/dashboard/chat', { state: { prefilledQuery: `Explain ${law.name} and my rights` } }); }}
                      style={{
                        background: law.color, color: '#fff', border: 'none', borderRadius: 8,
                        padding: '8px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer', width: '100%'
                      }}
                    >
                      💬 Discuss in Full AI Chat
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {filteredLaws.length === 0 && (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔎</div>
              <h3>No laws found for "{searchTerm}"</h3>
              <p>Try different keywords like "property", "divorce", "arrest", or "salary"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
