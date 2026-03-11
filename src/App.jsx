import { useState } from "react";
import { Play, Sun, Moon, Copy, Check, Loader2, AlertCircle, ChevronDown, HelpCircle, X, Sparkles, BookOpen, FlaskConical, BarChart2, Zap, Target } from "lucide-react";

const dk = {
  bg:"bg-slate-950", nav:"bg-slate-900 border-slate-800",
  card:"bg-slate-900 border border-slate-800",
  hi:"bg-slate-800 border border-slate-700",
  inp:"bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500 focus:border-indigo-500",
  tx:"text-slate-100", txM:"text-slate-300", txS:"text-slate-400", txX:"text-slate-500",
  div:"divide-slate-800", bdr:"border-slate-800",
  seg:"bg-slate-800", segA:"bg-slate-700 text-white", segI:"text-slate-500 hover:text-slate-300",
  tog:"bg-slate-800 hover:bg-slate-700 text-slate-400",
  exBtn:"bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700",
  modal:"bg-slate-900 border border-slate-700",
  overlay:"bg-slate-950/80",
};
const lk = {
  bg:"bg-slate-50", nav:"bg-white border-slate-200",
  card:"bg-white border border-slate-200 shadow-sm",
  hi:"bg-slate-50 border border-slate-200",
  inp:"bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-indigo-500",
  tx:"text-slate-900", txM:"text-slate-700", txS:"text-slate-500", txX:"text-slate-400",
  div:"divide-slate-200", bdr:"border-slate-200",
  seg:"bg-slate-100", segA:"bg-white text-slate-900 shadow-sm", segI:"text-slate-500 hover:text-slate-700",
  tog:"bg-slate-100 hover:bg-slate-200 text-slate-500",
  exBtn:"bg-white hover:bg-slate-50 text-slate-600 border border-slate-300",
  modal:"bg-white border border-slate-200 shadow-xl",
  overlay:"bg-slate-900/60",
};

const EXAMPLES = [
  { label:"Market opportunity brief",     emoji:"🎯", prompt:"Write a concise strategic narrative for why a mid-market business in ANZ should invest in AI-powered automation for accounts payable. Include the problem, the opportunity, and the business case. Audience is a CFO of a 300-person manufacturing company in Victoria." },
  { label:"Vendor comparison",            emoji:"⚖️", prompt:"Compare the ERP capabilities of NetSuite, MYOB Acumatica, and Epicor for an ANZ mid-market wholesale distribution company with 150 staff, 3 warehouses, and AUD $80M revenue. Structure as a decision framework with a clear recommendation." },
  { label:"Customer user stories",        emoji:"👤", prompt:"Write 5 user stories for a mid-market ANZ business owner who needs better visibility into cash flow, outstanding invoices, and upcoming payroll obligations — all from a single dashboard. Focus on reducing manual reconciliation work." },
  { label:"Digital transformation pitch", emoji:"🚀", prompt:"Write a 3-paragraph executive summary pitching a cloud ERP migration to a mid-market ANZ retailer currently running on-premise systems. Include the operational risks of staying on legacy infrastructure, the benefits of migration, and the expected ROI over 3 years." },
  { label:"Risk assessment",              emoji:"⚠️", prompt:"Identify the top 6 risks of moving a 200-person ANZ professional services firm from spreadsheet-based project management to a fully integrated cloud ERP. Include likelihood, business impact, and a practical mitigation strategy for each risk." },
  { label:"AI feature roadmap",           emoji:"🗺️", prompt:"Outline a 12-month AI feature roadmap for a mid-market ANZ ERP platform targeting the construction and trades sector. Focus on features that reduce admin burden, improve job costing accuracy, and help owners make faster financial decisions. Include quick wins in the first 90 days." },
];

const PERSONAS = [
  { id:"claude", name:"Claude Sonnet 4.6", provider:"Anthropic", emoji:"🟣", styleNote:"Precise · Direct · Nuanced",               style:`You are Claude by Anthropic. Be precise, direct and opinionated. Use clear structure. Prioritise accuracy and nuance. Avoid padding. Lead with the most important insight.` },
  { id:"gpt",    name:"GPT-4o",            provider:"OpenAI",    emoji:"🟢", styleNote:"Comprehensive · User-friendly · Contextual", style:`You are GPT-4o by OpenAI. Be comprehensive and accessible. Use a friendly professional tone. Include context and examples. Structure output for readability.` },
  { id:"gemini", name:"Gemini 1.5 Pro",    provider:"Google",    emoji:"🔵", styleNote:"Analytical · Metric-forward · Structured",   style:`You are Gemini 1.5 Pro by Google. Lead with measurable outcomes and data. Be analytically rigorous. Use specific numbers and KPIs. Favour structured frameworks.` },
];

const SCORE_DIMS = ["Accuracy & relevance","Clarity & structure","Depth of insight","Tone & style fit","Usability — editing needed?"];

const SYSTEM_PROMPT = (style) => `${style}

You are responding to a prompt from a senior product manager. Respond thoughtfully and specifically.

Return ONLY a valid JSON object. No markdown, no backticks, no text before or after. Raw JSON only.

{
  "response": "string — your full answer. Use \\n for line breaks. Numbered lists as 1. 2. 3. Bullets as •",
  "approach": "string — 1-2 sentences on how you approached this task",
  "strengths": ["string","string","string"],
  "watchPoints": ["string","string"],
  "styleSignature": "string — one sentence on what makes your response style distinct"
}

Rules: response minimum 200 words, everything specific to the actual prompt, no generic placeholder text`;

// ── API — proxied through Netlify Function ────────────────────────────────────
async function callModel(persona, prompt) {
  const res = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514", max_tokens: 4000,
      system: SYSTEM_PROMPT(persona.style),
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const data = await res.json();
  const text = data.content?.find(b => b.type === "text")?.text || "";
  return JSON.parse(text.replace(/```json\n?|```\n?/g, "").trim());
}

async function autoScore(responses, prompt) {
  const res = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514", max_tokens: 2000,
      system: `You are an expert evaluator. Score three AI responses to the same prompt across 5 dimensions. Be rigorous and differentiated — avoid giving all models the same scores.

Return ONLY valid JSON, no markdown, no backticks:
{
  "scores": {
    "claude": { "Accuracy & relevance":1,"Clarity & structure":1,"Depth of insight":1,"Tone & style fit":1,"Usability — editing needed?":1 },
    "gpt":    { "Accuracy & relevance":1,"Clarity & structure":1,"Depth of insight":1,"Tone & style fit":1,"Usability — editing needed?":1 },
    "gemini": { "Accuracy & relevance":1,"Clarity & structure":1,"Depth of insight":1,"Tone & style fit":1,"Usability — editing needed?":1 }
  },
  "comparison": "3-4 sentence comparative summary: what each model did distinctively well or poorly, and which you recommend for this prompt type and why",
  "winner": "claude|gpt|gemini"
}
Replace the 1 values with actual integer scores 1-5.`,
      messages: [{ role: "user", content: `Prompt:\n${prompt}\n\nClaude:\n${responses.claude}\n\nGPT-4o:\n${responses.gpt}\n\nGemini:\n${responses.gemini}` }],
    }),
  });
  if (!res.ok) throw new Error(`Scoring error ${res.status}`);
  const data = await res.json();
  return JSON.parse(data.content?.find(b => b.type === "text")?.text.replace(/```json\n?|```\n?/g, "").trim() || "{}");
}

// ── Help Modal ────────────────────────────────────────────────────────────────
function HelpModal({ onClose, t, isDark }) {
  const steps = [
    { icon:<BookOpen size={16}/>,    color:"text-indigo-400",  title:"1 · Write or pick a prompt",          body:"Type any question, task, or brief — or click ANZ Examples to load a pre-built prompt. The same prompt is sent to all three models." },
    { icon:<Play size={16}/>,        color:"text-emerald-400", title:"2 · Run the models",                   body:"Hit Run All Three to fire all models simultaneously and get auto-scoring. Or use the individual model buttons to test one at a time." },
    { icon:<FlaskConical size={16}/>,color:"text-amber-400",   title:"3 · Compare responses",                body:"Use the Response tab to read each answer side by side. Switch to Analysis to see each model's approach, strengths, and watch points." },
    { icon:<Sparkles size={16}/>,    color:"text-purple-400",  title:"4 · Auto-score (Run All Three only)",  body:"When all three complete, a fourth AI call evaluates the responses comparatively and scores each across 5 dimensions. You can override any score manually." },
    { icon:<BarChart2 size={16}/>,   color:"text-sky-400",     title:"5 · Read the leaderboard",             body:"The leaderboard ranks models by composite score. 4+ means close to ready. Below 3 means significant editing needed." },
    { icon:<Target size={16}/>,      color:"text-rose-400",    title:"6 · Approve & copy",                   body:"Click Approve on any response you're happy with. Approved cards get a green ring and appear in a summary panel above the results. Remove approvals with ×." },
  ];
  const dims = [
    { d:"Accuracy & relevance",        desc:"Is the content factually sound and directly on-topic?" },
    { d:"Clarity & structure",         desc:"Is it easy to read and logically organised?" },
    { d:"Depth of insight",            desc:"Does it go beyond the obvious?" },
    { d:"Tone & style fit",            desc:"Would you send this with minimal rewording?" },
    { d:"Usability — editing needed?", desc:"5 = use as-is. 1 = needs a full rewrite." },
  ];
  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${t.overlay}`} onClick={onClose}>
      <div className={`relative w-full max-w-lg flex flex-col rounded-2xl ${t.modal}`} style={{maxHeight:"85vh"}} onClick={e=>e.stopPropagation()}>
        <div className={`flex items-center justify-between px-5 py-4 border-b flex-shrink-0 ${t.bdr} ${isDark?"bg-slate-900":"bg-white"} rounded-t-2xl`}>
          <div>
            <div className={`text-sm font-bold ${t.tx}`}>How to use Model Test Lab</div>
            <div className={`text-xs ${t.txX}`}>ANZ Mid-Market Edition</div>
          </div>
          <button onClick={onClose} className={`p-1.5 rounded-lg ${t.tog}`}><X size={15}/></button>
        </div>
        <div className="overflow-y-auto flex-1 p-5 space-y-5">
          <div className="space-y-3">
            {steps.map(s=>(
              <div key={s.title} className={`flex gap-3 p-3.5 rounded-xl ${t.hi}`}>
                <div className={`flex-shrink-0 mt-0.5 ${s.color}`}>{s.icon}</div>
                <div>
                  <div className={`text-xs font-bold mb-1 ${t.tx}`}>{s.title}</div>
                  <div className={`text-xs leading-relaxed ${t.txS}`}>{s.body}</div>
                </div>
              </div>
            ))}
          </div>
          <div className={`border-t ${t.bdr} pt-4`}>
            <div className={`text-xs font-bold uppercase tracking-widest mb-3 ${t.txX}`}>Scoring Dimensions</div>
            <div className="space-y-2">
              {dims.map(({d,desc})=>(
                <div key={d} className="flex gap-2 items-start">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0 mt-1.5"/>
                  <div><span className={`text-xs font-semibold ${t.txM}`}>{d} — </span><span className={`text-xs ${t.txS}`}>{desc}</span></div>
                </div>
              ))}
            </div>
          </div>
          <div className={`border-t ${t.bdr} pt-4`}>
            <div className={`text-xs font-bold uppercase tracking-widest mb-2 ${t.txX}`}>About the models</div>
            {PERSONAS.map(p=>(
              <div key={p.id} className="flex gap-2 items-start mb-2">
                <span>{p.emoji}</span>
                <div><span className={`text-xs font-semibold ${t.txM}`}>{p.name} — </span><span className={`text-xs ${t.txS}`}>{p.styleNote.replace(/·/g,",")}</span></div>
              </div>
            ))}
            <p className={`text-xs mt-2 ${t.txX}`}>All three run via the same API with distinct system prompts that replicate each provider's characteristic reasoning style.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Panels ────────────────────────────────────────────────────────────────────
function ResponsePanel({ parsed, t, isDark }) {
  return (
    <div className={`rounded-xl p-4 border ${t.bdr} ${isDark?"bg-slate-950":"bg-slate-50"}`}>
      <div className="space-y-2">
        {(parsed.response||"").split("\n").map((line,i)=>{
          if(!line.trim()) return <div key={i} className="h-1.5"/>;
          if(/^\d+\./.test(line.trim())) return (
            <div key={i} className={`flex gap-2 items-start text-sm leading-relaxed ${t.txM}`}>
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{line.trim().match(/^(\d+)/)[1]}</span>
              <span>{line.trim().replace(/^\d+\.\s*/,"")}</span>
            </div>
          );
          if(line.trim().startsWith("•")||line.trim().startsWith("-")) return (
            <div key={i} className={`flex gap-2 items-start text-sm leading-relaxed ${t.txM}`}>
              <span className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 bg-indigo-500"/>
              <span>{line.trim().replace(/^[•\-]\s*/,"")}</span>
            </div>
          );
          if(/^#{1,3}\s/.test(line.trim())) return <div key={i} className={`text-sm font-bold mt-2 ${t.tx}`}>{line.trim().replace(/^#{1,3}\s/,"")}</div>;
          return <p key={i} className={`text-sm leading-relaxed ${t.txM}`}>{line}</p>;
        })}
      </div>
    </div>
  );
}

function AnalysisPanel({ parsed, t, isDark }) {
  return (
    <div className="space-y-3">
      <div className={`rounded-xl p-4 border ${t.bdr} ${isDark?"bg-slate-950":"bg-slate-50"}`}>
        <div className="text-xs font-bold uppercase tracking-widest mb-2 text-indigo-400">Approach</div>
        <p className={`text-sm leading-relaxed ${t.txM}`}>{parsed.approach}</p>
      </div>
      <div className={`rounded-xl p-4 border ${t.bdr} ${isDark?"bg-slate-950":"bg-slate-50"}`}>
        <div className="text-xs font-bold uppercase tracking-widest mb-3 text-emerald-400">Strengths</div>
        {parsed.strengths?.map((s,i)=>(
          <div key={i} className={`flex gap-2 items-start mb-2 text-sm ${t.txM}`}>
            <Check size={13} className="text-emerald-400 flex-shrink-0 mt-0.5"/><span>{s}</span>
          </div>
        ))}
      </div>
      <div className={`rounded-xl p-4 border ${t.bdr} ${isDark?"bg-slate-950":"bg-slate-50"}`}>
        <div className="text-xs font-bold uppercase tracking-widest mb-3 text-amber-400">Watch Points</div>
        {parsed.watchPoints?.map((w,i)=>(
          <div key={i} className={`flex gap-2 items-start mb-2 text-sm ${t.txM}`}>
            <AlertCircle size={13} className="text-amber-400 flex-shrink-0 mt-0.5"/><span>{w}</span>
          </div>
        ))}
      </div>
      <div className={`rounded-xl p-3 border ${isDark?"bg-indigo-900/20 border-indigo-800/50":"bg-indigo-50 border-indigo-200"}`}>
        <div className="text-xs font-bold uppercase tracking-widest mb-1 text-indigo-400">Style Signature</div>
        <p className={`text-xs italic ${t.txS}`}>"{parsed.styleSignature}"</p>
      </div>
    </div>
  );
}

function ScorePanel({ persona, scores, setScores, aiScored, t, isDark }) {
  const my = scores[persona.id]||{};
  const allDone = SCORE_DIMS.every(d=>my[d]);
  const composite = allDone ? Object.values(my).reduce((a,b)=>a+b,0)/SCORE_DIMS.length : null;
  return (
    <div className="space-y-4">
      {aiScored&&(
        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs ${isDark?"bg-purple-900/30 border border-purple-800/50":"bg-purple-50 border border-purple-200"}`}>
          <Sparkles size={12} className="text-purple-400 flex-shrink-0"/>
          <span className={t.txS}>AI-evaluated · You can override any score below</span>
        </div>
      )}
      {SCORE_DIMS.map(d=>{
        const v=my[d]||0;
        return (
          <div key={d}>
            <div className="flex items-center justify-between mb-1.5">
              <div className={`text-xs font-semibold ${t.txM}`}>{d}</div>
              {v>0&&<div className={`text-xs font-bold ${v>=4?"text-emerald-400":v===3?"text-amber-400":"text-red-400"}`}>{["","Poor","Weak","Okay","Good","Excellent"][v]}</div>}
            </div>
            <div className="flex gap-1.5">
              {[1,2,3,4,5].map(n=>(
                <button key={n} onClick={()=>setScores(s=>({...s,[persona.id]:{...(s[persona.id]||{}),[d]:n}}))}
                  className={`flex-1 h-9 rounded-xl text-sm font-bold transition-all active:scale-95 ${
                    v===n?n<=2?"bg-red-500 text-white":n===3?"bg-amber-400 text-slate-900":n===4?"bg-lime-500 text-slate-900":"bg-emerald-500 text-white"
                    :isDark?"bg-slate-800 text-slate-400 hover:bg-slate-700":"bg-slate-100 text-slate-400 hover:bg-slate-200"
                  }`}>{n}</button>
              ))}
            </div>
          </div>
        );
      })}
      {composite&&(
        <div className={`p-4 rounded-2xl text-center ${isDark?"bg-indigo-900/30 border border-indigo-800":"bg-indigo-50 border border-indigo-200"}`}>
          <div className={`text-xs font-semibold mb-1 ${t.txS}`}>Composite score</div>
          <div className="text-4xl font-bold text-indigo-400">{composite.toFixed(1)}<span className={`text-sm font-normal ${t.txX}`}>/5</span></div>
        </div>
      )}
    </div>
  );
}

function ModelPanel({ persona, parsed, error, loading, scores, setScores, aiScored, tab, t, isDark, timing, approved, setApproved }) {
  const [copied,setCopied]=useState(false);
  const copy=()=>{ if(!parsed)return; navigator.clipboard.writeText(parsed.response||""); setCopied(true); setTimeout(()=>setCopied(false),2000); };
  const isApproved=approved[persona.id];
  const toggleApprove=()=>setApproved(s=>({...s,[persona.id]:!s[persona.id]}));
  return (
    <div className={`rounded-2xl overflow-hidden flex flex-col ${t.card} ${isApproved?isDark?"ring-2 ring-emerald-500":"ring-2 ring-emerald-400":""}`}>
      <div className={`flex items-center gap-2 px-4 py-3 border-b ${t.bdr}`}>
        <span className="text-lg">{persona.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-bold ${t.tx}`}>{persona.name}</div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className={`text-xs ${t.txX}`}>{persona.styleNote}</div>
            {timing&&<span className={`text-xs font-semibold px-1.5 py-0.5 rounded-md ${isDark?"bg-slate-700 text-slate-300":"bg-slate-100 text-slate-500"}`}>⏱ {timing}s</span>}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {parsed&&<button onClick={copy} className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg ${isDark?"bg-slate-800 text-slate-400":"bg-slate-100 text-slate-500"}`}>{copied?<><Check size={11}/>Copied</>:<><Copy size={11}/>Copy</>}</button>}
          {parsed&&(
            <button onClick={toggleApprove}
              className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg font-semibold transition-all ${
                isApproved?"bg-emerald-500 text-white":"border text-emerald-500 "+(isDark?"border-emerald-700 hover:bg-emerald-900/30":"border-emerald-300 hover:bg-emerald-50")
              }`}>
              <Check size={11}/>{isApproved?"Approved":"Approve"}
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-auto p-4">
        {loading&&<div className="flex flex-col items-center justify-center py-16 gap-3"><Loader2 className="animate-spin text-indigo-500" size={24}/><div className={`text-sm ${t.txS}`}>Generating…</div></div>}
        {error&&<div className={`flex items-start gap-2 p-3 rounded-xl ${isDark?"bg-red-900/20 border border-red-800":"bg-red-50 border border-red-200"}`}><AlertCircle size={14} className="text-red-400 flex-shrink-0 mt-0.5"/><div className="text-xs text-red-400">{error}</div></div>}
        {!loading&&!error&&!parsed&&<div className={`flex flex-col items-center justify-center py-16 gap-2 ${t.txX}`}><div className="text-3xl">⏳</div><div className="text-xs">Press Run to generate</div></div>}
        {parsed&&!loading&&(
          <>
            {tab==="response" &&<ResponsePanel parsed={parsed} t={t} isDark={isDark}/>}
            {tab==="analysis" &&<AnalysisPanel parsed={parsed} t={t} isDark={isDark}/>}
            {tab==="score"    &&<ScorePanel persona={persona} scores={scores} setScores={setScores} aiScored={aiScored} t={t} isDark={isDark}/>}
          </>
        )}
      </div>
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [isDark,    setIsDark]    = useState(false);
  const [prompt,    setPrompt]    = useState("");
  const [showEx,    setShowEx]    = useState(false);
  const [showHelp,  setShowHelp]  = useState(false);
  const [tab,       setTab]       = useState("response");
  const [results,   setResults]   = useState({});
  const [errors,    setErrors]    = useState({});
  const [loading,   setLoading]   = useState({});
  const [scores,    setScores]    = useState({});
  const [timing,    setTiming]    = useState({});
  const [approved,  setApproved]  = useState({});
  const [aiScored,  setAiScored]  = useState(false);
  const [scoring,   setScoring]   = useState(false);
  const [autoResult,setAutoResult]= useState(null);
  const [ran,       setRan]       = useState(false);

  const t = isDark ? dk : lk;

  const run = (ids) => {
    if (!prompt.trim()) return;
    setRan(true); setAutoResult(null); setAiScored(false);
    setApproved(s=>{ const n={...s}; ids.forEach(id=>delete n[id]); return n; });
    const nl={}, startTimes={};
    ids.forEach(id=>{
      nl[id]=true; startTimes[id]=Date.now();
      setResults(s=>{const n={...s};delete n[id];return n;});
      setErrors(s=>{const n={...s};delete n[id];return n;});
      setTiming(s=>{const n={...s};delete n[id];return n;});
    });
    setLoading(s=>({...s,...nl}));
    const promises = ids.map(id=>{
      const persona = PERSONAS.find(p=>p.id===id);
      return callModel(persona, prompt)
        .then(r=>{
          setTiming(s=>({...s,[id]:((Date.now()-startTimes[id])/1000).toFixed(1)}));
          setResults(s=>({...s,[id]:r}));
          setLoading(s=>({...s,[id]:false}));
          return {id,r};
        })
        .catch(e=>{ setErrors(s=>({...s,[id]:e.message})); setLoading(s=>({...s,[id]:false})); return {id,error:e}; });
    });
    if (ids.length===3) {
      Promise.all(promises).then(res=>{
        const ok=res.filter(r=>r.r);
        if (ok.length===3) {
          setScoring(true);
          const rm={}; ok.forEach(({id,r})=>rm[id]=r.response);
          autoScore(rm, prompt)
            .then(result=>{ setAutoResult(result); setScores(result.scores); setAiScored(true); setScoring(false); setTab("score"); })
            .catch(()=>setScoring(false));
        }
      });
    }
  };

  const leaderboard = PERSONAS
    .filter(p=>scores[p.id]&&SCORE_DIMS.every(d=>scores[p.id][d]))
    .map(p=>({...p, avg:SCORE_DIMS.reduce((a,d)=>a+(scores[p.id][d]||0),0)/SCORE_DIMS.length}))
    .sort((a,b)=>b.avg-a.avg);

  const TABS = [{id:"response",l:"Response"},{id:"analysis",l:"Analysis"},{id:"score",l:"Score & Compare"}];

  return (
    <div className={`min-h-screen ${t.bg} ${t.tx}`}>
      {showHelp && <HelpModal onClose={()=>setShowHelp(false)} t={t} isDark={isDark}/>}

      <div className={`${t.nav} border-b sticky top-0 z-10`}>
        <div className="max-w-screen-2xl mx-auto px-4 flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <FlaskConical size={18} className="text-indigo-400"/>
            <div>
              <div className="text-sm font-bold">Model Test Lab</div>
              <div className={`text-xs ${t.txX}`}>ANZ Mid-Market · Compare AI models on any prompt</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={()=>setShowHelp(true)} className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl transition-all ${t.tog}`}>
              <HelpCircle size={13}/>How to use
            </button>
            <button onClick={()=>setIsDark(!isDark)} className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl transition-all ${t.tog}`}>
              {isDark?<><Sun size={12}/>Light</>:<><Moon size={12}/>Dark</>}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto px-4 py-5 space-y-4">

        <div className={`rounded-2xl p-4 ${t.card}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">1</div>
              <div className={`text-sm font-semibold ${t.tx}`}>Enter your prompt</div>
            </div>
            <button onClick={()=>setShowEx(!showEx)} className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition-all ${t.tog}`}>
              ANZ examples <ChevronDown size={11} className={`transition-transform ${showEx?"rotate-180":""}`}/>
            </button>
          </div>
          {showEx&&(
            <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5 mb-3">
              {EXAMPLES.map(ex=>(
                <button key={ex.label} onClick={()=>{setPrompt(ex.prompt);setShowEx(false);}}
                  className={`text-left text-xs px-3 py-2.5 rounded-xl transition-all ${t.exBtn}`}>
                  <span className="mr-1.5">{ex.emoji}</span><span className="font-semibold">{ex.label}</span>
                </button>
              ))}
            </div>
          )}
          <textarea value={prompt} onChange={e=>setPrompt(e.target.value)} rows={4}
            placeholder="Type any question, task, or brief. The exact same prompt is sent to all three models so you can compare responses fairly."
            className={`w-full border rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none ${t.inp}`}/>
          <div className={`flex items-center justify-between mt-2 text-xs ${t.txX}`}>
            <span>{prompt.length} characters</span>
            <span>Same prompt → all 3 models</span>
          </div>
        </div>

        <div className={`rounded-2xl p-4 ${t.card}`}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">2</div>
            <div className={`text-sm font-semibold ${t.tx}`}>Run the models</div>
            <span className={`text-xs ml-auto ${t.txX}`}>Run all for auto-scoring · Run one at a time to compare carefully</span>
          </div>
          <button onClick={()=>run(["claude","gpt","gemini"])} disabled={!prompt.trim()}
            className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-all mb-2 ${
              prompt.trim()?"bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] text-white shadow-lg shadow-indigo-500/20"
              :isDark?"bg-slate-800 text-slate-600 cursor-not-allowed":"bg-slate-200 text-slate-400 cursor-not-allowed"
            }`}>
            <Zap size={15}/> Run All Three · Auto-score included
          </button>
          <div className="grid grid-cols-3 gap-2">
            {PERSONAS.map(p=>(
              <button key={p.id} onClick={()=>run([p.id])} disabled={!prompt.trim()||!!loading[p.id]}
                className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all border ${
                  !prompt.trim()||loading[p.id]
                    ?"opacity-40 cursor-not-allowed "+(isDark?"bg-slate-800 border-slate-700 text-slate-500":"bg-slate-100 border-slate-200 text-slate-400")
                    :isDark?"bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200 active:scale-95":"bg-white hover:bg-slate-50 border-slate-300 text-slate-700 active:scale-95"
                }`}>
                {loading[p.id]?<Loader2 size={12} className="animate-spin"/>:<Play size={12}/>}
                {p.emoji} {p.provider}
              </button>
            ))}
          </div>
        </div>

        {scoring&&(
          <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl ${isDark?"bg-purple-900/20 border border-purple-800/50":"bg-purple-50 border border-purple-200"}`}>
            <Loader2 size={14} className="animate-spin text-purple-400 flex-shrink-0"/>
            <div>
              <div className={`text-xs font-semibold ${isDark?"text-purple-300":"text-purple-700"}`}>Evaluating all three responses…</div>
              <div className={`text-xs ${t.txX}`}>Generating comparative scores and recommendation</div>
            </div>
          </div>
        )}

        {autoResult&&(
          <div className={`rounded-2xl p-4 ${t.card}`}>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={14} className="text-purple-400"/>
              <div className={`text-xs font-bold uppercase tracking-widest ${t.txX}`}>AI Evaluation · Step 3 results</div>
            </div>
            <div className={`flex items-center gap-3 mb-3 p-3 rounded-xl ${isDark?"bg-indigo-900/30 border border-indigo-800":"bg-indigo-50 border border-indigo-200"}`}>
              <span className="text-2xl">{PERSONAS.find(p=>p.id===autoResult.winner)?.emoji}</span>
              <div>
                <div className={`text-xs ${t.txS}`}>Recommended for this prompt</div>
                <div className="text-sm font-bold text-indigo-400">{PERSONAS.find(p=>p.id===autoResult.winner)?.name}</div>
              </div>
            </div>
            <p className={`text-sm leading-relaxed ${t.txM}`}>{autoResult.comparison}</p>
          </div>
        )}

        {leaderboard.length>0&&(
          <div className={`rounded-2xl p-4 ${t.card}`}>
            <div className={`text-xs font-bold uppercase tracking-widest mb-3 ${t.txX}`}>Leaderboard — this prompt</div>
            <div className="space-y-2">
              {leaderboard.map((p,i)=>(
                <div key={p.id} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${i===0?isDark?"bg-indigo-900/30 border border-indigo-800":"bg-indigo-50 border border-indigo-200":t.hi}`}>
                  <span className="text-lg">{["🥇","🥈","🥉"][i]}</span>
                  <span className="text-base">{p.emoji}</span>
                  <div className="flex-1">
                    <div className={`text-sm font-semibold ${t.txM}`}>{p.name}</div>
                    <div className={`text-xs ${t.txX}`}>{p.provider}</div>
                  </div>
                  {timing[p.id]&&<span className={`text-xs px-2 py-0.5 rounded-lg font-semibold ${isDark?"bg-slate-800 text-slate-400":"bg-slate-100 text-slate-500"}`}>⏱ {timing[p.id]}s</span>}
                  <div className={`text-xl font-bold ${i===0?"text-indigo-400":t.txS}`}>{p.avg.toFixed(1)}<span className={`text-xs font-normal ${t.txX}`}>/5</span></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {ran&&(
          <>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">3</div>
              <div className={`text-sm font-semibold ${t.tx}`}>Read, analyse & score</div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold whitespace-nowrap flex-shrink-0 ${t.txX}`}>All models:</span>
              <div className={`flex gap-1 p-1 rounded-xl flex-1 ${t.seg}`}>
                {TABS.map(({id,l})=>(
                  <button key={id} onClick={()=>setTab(id)}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${tab===id?t.segA:t.segI}`}>{l}</button>
                ))}
              </div>
            </div>

            {Object.values(approved).some(Boolean)&&(
              <div className={`rounded-2xl p-4 ${t.card}`}>
                <div className={`text-xs font-bold uppercase tracking-widest mb-3 ${t.txX}`}>Approved Outputs</div>
                <div className="space-y-2">
                  {PERSONAS.filter(p=>approved[p.id]).map(p=>(
                    <div key={p.id} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${isDark?"bg-emerald-900/20 border border-emerald-800/50":"bg-emerald-50 border border-emerald-200"}`}>
                      <Check size={14} className="text-emerald-400 flex-shrink-0"/>
                      <span className="text-base">{p.emoji}</span>
                      <div className="flex-1">
                        <div className={`text-sm font-semibold ${t.txM}`}>{p.name}</div>
                        <div className={`text-xs ${t.txX}`}>Response approved for use</div>
                      </div>
                      {timing[p.id]&&<span className={`text-xs px-2 py-0.5 rounded-lg font-semibold ${isDark?"bg-slate-800 text-slate-400":"bg-slate-100 text-slate-500"}`}>⏱ {timing[p.id]}s</span>}
                      <button onClick={()=>setApproved(s=>({...s,[p.id]:false}))} className={`text-xs ${t.txX} hover:text-red-400`}><X size={13}/></button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {PERSONAS.map(p=>(
                <ModelPanel key={p.id} persona={p}
                  parsed={results[p.id]} error={errors[p.id]} loading={!!loading[p.id]}
                  scores={scores} setScores={setScores} aiScored={aiScored}
                  tab={tab} t={t} isDark={isDark}
                  timing={timing[p.id]}
                  approved={approved} setApproved={setApproved}/>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}