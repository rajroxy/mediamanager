/* ═══════════════════════════════════════════════════════════
   ScriptForge — State
   20 modes · per-mode data isolation · 16+ pages per mode
   ═══════════════════════════════════════════════════════════ */

// ═══════════════════════════════════════════════════════════
//   MODES — each with its own page set
// ═══════════════════════════════════════════════════════════

const BASE_PAGES = ['write','read','draft','notes','plan','board','timeline','cast','research','dictionary','canvas','inspire','stats','notebook','format','import'];

const MODES = [
  {
    id: 'media',
    name: 'Media',
    icon: 'play-circle-fill',
    desc: 'Music and video library',
    categories: [
      { id: 'library', name: 'Library', icon: 'collection-play', desc: 'Your media' },
    ],
    editorViews: [],
  }
];


// ═══════════════════════════════════════════════════════════
//   PAGE META — every page that appears anywhere
// ═══════════════════════════════════════════════════════════

const PAGE_META = {
  // Top-level
  editor:        { name:'Editor',        icon:'pencil-fill' },

  // Editor FAB subpages
  draft:         { name:'Draft',         icon:'lightbulb' },
  outline:       { name:'Outline',       icon:'list-nested' },
  manuscript:    { name:'Manuscript',    icon:'file-earmark-text' },
  kanban:        { name:'Kanban',        icon:'kanban' },
  bible:         { name:'Bible',         icon:'journal-bookmark' },

    // Universal
  home:          { name:'Dashboard',     icon:'house-door-fill' },
  overview:      { name:'Manager',       icon:'info-circle' },
  stats:         { name:'Statistics',    icon:'graph-up-arrow' },
  reader:        { name:'Reader',        icon:'book-half' }
};


// ═══════════════════════════════════════════════════════════
//   INTERFACE LANGUAGE — page and menu names (Settings → Language)
//   Real translations for the app's own navigation. Writing tools,
//   panels and prompts stay in English; the interface (and the text
//   direction) follows the language you pick.
// ═══════════════════════════════════════════════════════════

const I18N = {
    en: { home:'Dashboard', overview:'Manager', stats:'Statistics', reader:'Reader', editor:'Editor', draft:'Draft', outline:'Outline', manuscript:'Manuscript', kanban:'Kanban', bible:'Bible' },
  hinglish: { home:'Dashboard', overview:'Manager', stats:'Statistics', reader:'Reader', editor:'Editor', draft:'Draft', outline:'Outline', manuscript:'Manuscript', kanban:'Kanban', bible:'Bible' },
  hi:       { home:'डैशबोर्ड', overview:'अवलोकन', stats:'आंकड़े', reader:'पाठक', editor:'संपादक', draft:'ड्राफ़्ट', outline:'रूपरेखा', manuscript:'पांडुलिपि', kanban:'कानबान', bible:'बाइबल' },
  bn:       { home:'ড্যাশবোর্ড', overview:'সারসংক্ষেপ', stats:'পরিসংখ্যান', reader:'পাঠক', editor:'সম্পাদক', draft:'খসড়া', outline:'রূপরেখা', manuscript:'পাণ্ডুলিপি', kanban:'কানবান', bible:'বাইবেল' },
  mr:       { home:'डॅशबोर्ड', overview:'आढावा', stats:'आकडेवारी', reader:'वाचक', editor:'संपादक', draft:'मसुदा', outline:'रूपरेषा', manuscript:'हस्तलिखित', kanban:'कानबान', bible:'बायबल' },
  ta:       { home:'டாஷ்போர்டு', overview:'மேலோட்டம்', stats:'புள்ளிவிவரங்கள்', reader:'வாசிப்பான்', editor:'தொகுப்பான்', draft:'வரைவு', outline:'வரைபடம்', manuscript:'கையெழுத்துப்படி', kanban:'கான்பான்', bible:'பைபிள்' },
  ne:       { home:'ड्यासबोर्ड', overview:'अवलोकन', stats:'तथ्याङ्क', reader:'पाठक', editor:'सम्पादक', draft:'मस्यौदा', outline:'रूपरेखा', manuscript:'पाण्डुलिपि', kanban:'कानबान', bible:'बाइबल' },
  ur:       { home:'ڈیش بورڈ', overview:'جائزہ', stats:'اعداد و شمار', reader:'قاری', editor:'ایڈیٹر', draft:'مسودہ', outline:'خاکہ', manuscript:'مخطوطہ', kanban:'کانبان', bible:'بائبل' },
  es:       { home:'Panel', overview:'Resumen', stats:'Estadísticas', reader:'Lector', editor:'Editor', draft:'Borrador', outline:'Esquema', manuscript:'Manuscrito', kanban:'Kanban', bible:'Biblia' },
  fr:       { home:'Tableau de bord', overview:'Aperçu', stats:'Statistiques', reader:'Lecteur', editor:'Éditeur', draft:'Brouillon', outline:'Plan', manuscript:'Manuscrit', kanban:'Kanban', bible:'Bible' },
  de:       { home:'Übersicht', overview:'Überblick', stats:'Statistik', reader:'Leser', editor:'Editor', draft:'Entwurf', outline:'Gliederung', manuscript:'Manuskript', kanban:'Kanban', bible:'Bibel' },
  it:       { home:'Pannello', overview:'Panoramica', stats:'Statistiche', reader:'Lettore', editor:'Editor', draft:'Bozza', outline:'Scaletta', manuscript:'Manoscritto', kanban:'Kanban', bible:'Bibbia' },
  pt:       { home:'Painel', overview:'Visão geral', stats:'Estatísticas', reader:'Leitor', editor:'Editor', draft:'Rascunho', outline:'Esboço', manuscript:'Manuscrito', kanban:'Kanban', bible:'Bíblia' },
  ru:       { home:'Панель', overview:'Обзор', stats:'Статистика', reader:'Читалка', editor:'Редактор', draft:'Черновик', outline:'План', manuscript:'Рукопись', kanban:'Канбан', bible:'Библия' },
  ar:       { home:'لوحة التحكم', overview:'نظرة عامة', stats:'الإحصاءات', reader:'القارئ', editor:'المحرر', draft:'المسودة', outline:'المخطط', manuscript:'المخطوطة', kanban:'كانبان', bible:'الدليل' },
  tr:       { home:'Panel', overview:'Genel bakış', stats:'İstatistikler', reader:'Okuyucu', editor:'Düzenleyici', draft:'Taslak', outline:'Ana hat', manuscript:'El yazması', kanban:'Kanban', bible:'Kitap' },
  ja:       { home:'ダッシュボード', overview:'概要', stats:'統計', reader:'リーダー', editor:'エディタ', draft:'下書き', outline:'構成', manuscript:'原稿', kanban:'カンバン', bible:'バイブル' },
  zh:       { home:'仪表盘', overview:'概览', stats:'统计', reader:'阅读器', editor:'编辑器', draft:'草稿', outline:'大纲', manuscript:'手稿', kanban:'看板', bible:'设定集' },
  ko:       { home:'대시보드', overview:'개요', stats:'통계', reader:'리더', editor:'편집기', draft:'초안', outline:'구성', manuscript:'원고', kanban:'칸반', bible:'바이블' },
  vi:       { home:'Bảng điều khiển', overview:'Tổng quan', stats:'Thống kê', reader:'Trình đọc', editor:'Trình soạn thảo', draft:'Bản nháp', outline:'Dàn ý', manuscript:'Bản thảo', kanban:'Kanban', bible:'Kinh thánh' },
  id:       { home:'Dasbor', overview:'Ringkasan', stats:'Statistik', reader:'Pembaca', editor:'Editor', draft:'Draf', outline:'Kerangka', manuscript:'Naskah', kanban:'Kanban', bible:'Bibel' }
};

/* the languages offered for the INTERFACE, in their own script */
const UI_LANGS = [
  { code:'en', name:'English', native:'English' }
];


/* t('home') → 'डैशबोर्ड' when the interface language is Hindi.
   Missing keys and English both fall through to the English string. */
function t(key){
  const lang = (S.config && S.config.uiLang) || 'en';
  const dict = I18N[lang];
  if(dict && dict[key]) return dict[key];
  return I18N.en[key] || key;
}
/* the translated name of a page id, with the plain PAGE_META name as backup */
function pname(id){
  return t(id) || (PAGE_META[id] ? PAGE_META[id].name : id);
}
function uiLangCode(){
  const l = (S.config && S.config.uiLang) || 'en';
  return (l === 'hinglish') ? 'hi-Latn' : l;
}
function isRtlLang(){
  const l = (S.config && S.config.uiLang) || 'en';
  return l === 'ar' || l === 'ur' || l === 'fa' || l === 'he';
}
/* applied on boot and whenever the language changes */
function applyLang(){
  const code = uiLangCode();
  const rtl  = isRtlLang();
  try{ document.documentElement.lang = code; }catch(e){}
  try{ document.documentElement.dir = rtl ? 'rtl' : 'ltr'; }catch(e){}
  document.querySelectorAll('[contenteditable="true"], textarea, input[type="text"]').forEach(function(el){
    el.setAttribute('lang', S.config.defaultLang || 'en');
  });
  if(typeof renderNav === 'function') renderNav();
  if(typeof renderModePills === 'function') renderModePills();
  if(typeof updateBreadcrumb === 'function') updateBreadcrumb();
}
window.t = t;
window.pname = pname;
window.applyLang = applyLang;
window.UI_LANGS = UI_LANGS;
window.I18N = I18N;

// ═══════════════════════════════════════════════════════════
//   THEMES · FONTS · LANGUAGES
// ═══════════════════════════════════════════════════════════

//   Dark-only writing themes — each one is a full token set applied inline on
//   <html> + <body>, so a theme never has to fight the cascade.
//   Eye comfort is deliberately NOT a theme: it's a warm light filter that
//   toggles over whichever theme you're using (Settings → Appearance).
const THEMES = [
  {
    id:'night', name:'Night', c1:'#1b1a19', c2:'#fab387', dark:true,
    note:'Warm dark — the original',
    palette:{
      bg:'#1b1a19', s1:'#222120', s2:'#292725', s3:'#312e2c', s4:'#3a3734', s5:'#454140',
      ov:'rgba(255,255,255,.05)', ovs:'rgba(255,255,255,.09)',
      ink:'#d9d3cb', ink2:'#b0aaa1', ink3:'#8b857c', ink4:'#6a655e',
      line:'#332f2c', line2:'#3e3a36', line3:'#4c4741',
      acc:'#e6dfd5', acc2:'#cfc7bb', accInk:'#1b1a19', accSoft:'rgba(230,223,213,.08)', accLine:'rgba(230,223,213,.22)',
      grad:'linear-gradient(135deg,#e6dfd5 0%,#b8b0a4 100%)',
      docBg:'#211f1d', docInk:'#d3cdc4', caret:'#fab387', sel:'#fab387', selInk:'#211f1d'
    }
  },
  {
    id:'lamp', name:'Desk Lamp', c1:'#16130f', c2:'#f0c07a', dark:true,
    note:'Amber dark — easy on the eyes at 2am',
    palette:{
      bg:'#16130f', s1:'#1d1913', s2:'#241f18', s3:'#2c261d', s4:'#352e23', s5:'#41382b',
      ov:'rgba(240,192,122,.05)', ovs:'rgba(240,192,122,.09)',
      ink:'#e8ddc8', ink2:'#c3b59b', ink3:'#9b8e77', ink4:'#7a6e58',
      line:'#2e2820', line2:'#3a3327', line3:'#4a402f',
      acc:'#f0c07a', acc2:'#d8a75f', accInk:'#1b1610', accSoft:'rgba(240,192,122,.10)', accLine:'rgba(240,192,122,.28)',
      grad:'linear-gradient(135deg,#f0c07a 0%,#c98f3f 100%)',
      docBg:'#1e1913', docInk:'#ded1b8', caret:'#f0c07a', sel:'#f0c07a', selInk:'#1b1610'
    }
  },
  {
    id:'ink', name:'Ink', c1:'#101214', c2:'#e9edf1', dark:true,
    note:'Cool monochrome, high contrast',
    palette:{
      bg:'#101214', s1:'#16191c', s2:'#1c2024', s3:'#24282d', s4:'#2d3238', s5:'#3a4047',
      ov:'rgba(255,255,255,.05)', ovs:'rgba(255,255,255,.09)',
      ink:'#e9edf1', ink2:'#b9c2cb', ink3:'#8c959e', ink4:'#666e76',
      line:'#23272b', line2:'#2c3136', line3:'#3b4249',
      acc:'#e9edf1', acc2:'#cdd5dc', accInk:'#101214', accSoft:'rgba(233,237,241,.08)', accLine:'rgba(233,237,241,.22)',
      grad:'linear-gradient(135deg,#e9edf1 0%,#9aa4ad 100%)',
      docBg:'#15181b', docInk:'#dfe5ea', caret:'#7cc7ff', sel:'#7cc7ff', selInk:'#0d1013'
    }
  },
  {
    id:'noir', name:'Noir', c1:'#000000', c2:'#ffffff', dark:true,
    note:'True black — OLED and focus friendly',
    palette:{
      bg:'#000000', s1:'#0a0a0a', s2:'#111111', s3:'#181818', s4:'#212121', s5:'#2b2b2b',
      ov:'rgba(255,255,255,.05)', ovs:'rgba(255,255,255,.09)',
      ink:'#ededed', ink2:'#bdbdbd', ink3:'#8a8a8a', ink4:'#636363',
      line:'#1c1c1c', line2:'#252525', line3:'#333333',
      acc:'#ffffff', acc2:'#d4d4d4', accInk:'#000000', accSoft:'rgba(255,255,255,.08)', accLine:'rgba(255,255,255,.20)',
      grad:'linear-gradient(135deg,#ffffff 0%,#9e9e9e 100%)',
      docBg:'#0d0d0d', docInk:'#e3e3e3', caret:'#ffd479', sel:'#ffd479', selInk:'#0d0d0d'
    }
  },
  {
    id:'midnight', name:'Midnight', c1:'#0d1420', c2:'#7cc7ff', dark:true,
    note:'Deep navy dark with a cool blue accent',
    palette:{
      bg:'#0d1420', s1:'#131b28', s2:'#19222f', s3:'#202a38', s4:'#283343', s5:'#334051',
      ov:'rgba(124,199,255,.05)', ovs:'rgba(124,199,255,.09)',
      ink:'#dbe4f0', ink2:'#adb9c9', ink3:'#8391a3', ink4:'#5f6b7c',
      line:'#1a2331', line2:'#222d3d', line3:'#2e3b4d',
      acc:'#7cc7ff', acc2:'#5aa9e6', accInk:'#0a1017', accSoft:'rgba(124,199,255,.10)', accLine:'rgba(124,199,255,.28)',
      grad:'linear-gradient(135deg,#7cc7ff 0%,#3b82c4 100%)',
      docBg:'#101825', docInk:'#d3dfee', caret:'#7cc7ff', sel:'#7cc7ff', selInk:'#0a1017'
    }
  },
  {
    id:'ember', name:'Ember', c1:'#1a1310', c2:'#ff8a5c', dark:true,
    note:'Warm ember dark — a fireside glow at night',
    palette:{
      bg:'#1a1310', s1:'#211814', s2:'#281d18', s3:'#30241e', s4:'#3a2c25', s5:'#46362d',
      ov:'rgba(255,138,92,.05)', ovs:'rgba(255,138,92,.09)',
      ink:'#ecdfd6', ink2:'#c6b3a6', ink3:'#9b8578', ink4:'#77655a',
      line:'#2a1e19', line2:'#362821', line3:'#453329',
      acc:'#ff8a5c', acc2:'#e56f3e', accInk:'#1a1310', accSoft:'rgba(255,138,92,.12)', accLine:'rgba(255,138,92,.30)',
      grad:'linear-gradient(135deg,#ff8a5c 0%,#c2502a 100%)',
      docBg:'#211713', docInk:'#e6d6cb', caret:'#ff8a5c', sel:'#ff8a5c', selInk:'#1a1310'
    }
  },
  {
    id:'forest', name:'Forest', c1:'#0e1512', c2:'#8fd6a8', dark:true,
    note:'Deep green dark — calm, low glare',
    palette:{
      bg:'#0e1512', s1:'#141d19', s2:'#1a251f', s3:'#212e27', s4:'#293930', s5:'#34463c',
      ov:'rgba(143,214,168,.05)', ovs:'rgba(143,214,168,.09)',
      ink:'#dce8e1', ink2:'#aebdb4', ink3:'#84948b', ink4:'#61706a',
      line:'#1a2620', line2:'#22302a', line3:'#2f4136',
      acc:'#8fd6a8', acc2:'#68b184', accInk:'#0b1210', accSoft:'rgba(143,214,168,.10)', accLine:'rgba(143,214,168,.28)',
      grad:'linear-gradient(135deg,#8fd6a8 0%,#3f8a5d 100%)',
      docBg:'#111a16', docInk:'#d3e2d9', caret:'#8fd6a8', sel:'#8fd6a8', selInk:'#0b1210'
    }
  },
  {
    id:'graphite', name:'Graphite', c1:'#141517', c2:'#c8cdd6', dark:true,
    note:'Neutral graphite — quiet, no colour cast',
    palette:{
      bg:'#141517', s1:'#1b1c1f', s2:'#212327', s3:'#292b30', s4:'#32353b', s5:'#3e424a',
      ov:'rgba(255,255,255,.05)', ovs:'rgba(255,255,255,.09)',
      ink:'#e2e4e8', ink2:'#b4b8bf', ink3:'#8b9099', ink4:'#666b74',
      line:'#222428', line2:'#2b2e33', line3:'#393d44',
      acc:'#c8cdd6', acc2:'#a9b0bb', accInk:'#141517', accSoft:'rgba(200,205,214,.08)', accLine:'rgba(200,205,214,.22)',
      grad:'linear-gradient(135deg,#c8cdd6 0%,#7d8590 100%)',
      docBg:'#17191c', docInk:'#dde0e5', caret:'#9ecbff', sel:'#9ecbff', selInk:'#0f1114'
    }
  }
];

// Compact palette → the full CSS custom-property set every theme must define
function themeTokens(t){
  const p = t.palette, dark = !!t.dark;
  return {
    '--bg':p.bg, '--surface-1':p.s1, '--surface-2':p.s2, '--surface-3':p.s3,
    '--surface-4':p.s4, '--surface-5':p.s5,
    '--overlay':p.ov, '--overlay-strong':p.ovs,
    '--ink':p.ink, '--ink-2':p.ink2, '--ink-3':p.ink3, '--ink-4':p.ink4,
    '--line':p.line, '--line-2':p.line2, '--line-3':p.line3,
    '--accent':p.acc, '--accent-2':p.acc2, '--accent-soft':p.accSoft,
    '--accent-line':p.accLine, '--accent-ink':p.accInk, '--grad':p.grad,
    '--doc-bg':p.docBg, '--doc-ink':p.docInk,
    '--caret':p.caret, '--sel':p.sel, '--sel-ink':p.selInk,
    '--e-1': dark ? '0 1px 2px rgba(0,0,0,.40)'    : '0 1px 2px rgba(0,0,0,.06)',
    '--e-2': dark ? '0 4px 12px rgba(0,0,0,.45)'   : '0 4px 12px rgba(0,0,0,.08)',
    '--e-3': dark ? '0 8px 24px rgba(0,0,0,.50)'   : '0 8px 24px rgba(0,0,0,.10)',
    '--e-4': dark ? '0 16px 40px rgba(0,0,0,.55)'  : '0 16px 40px rgba(0,0,0,.14)'
  };
}

function themeById(id){
  return THEMES.find(t => t.id === id) || THEMES.find(t => t.id === 'night') || THEMES[0];
}

// Every theme is dark, so this only has to normalise ids (old saved values
// like 'auto' / 'paper' / 'eye' fall back to Night instead of breaking boot)
function resolveThemeId(id){
  return THEMES.some(t => t.id === id) ? id : 'night';
}

// Write a theme's tokens onto <html> and <body> (inline beats any stylesheet)
function applyThemeVars(id){
  const tid = resolveThemeId(id);
  const t = themeById(tid);
  const toks = themeTokens(t);
  const html = document.documentElement, body = document.body;
  Object.keys(toks).forEach(k => {
    html.style.setProperty(k, toks[k]);
    body.style.setProperty(k, toks[k]);
  });
  const scheme = t.dark ? 'dark' : 'light';
  html.style.colorScheme = scheme;
  body.style.colorScheme = scheme;
  body.setAttribute('data-theme', id || 'night');
  body.setAttribute('data-theme-resolved', tid);
  // cache the resolved tokens so the next boot can paint before JS loads
  try{
    localStorage.setItem('sf6_theme', JSON.stringify({ id:id || 'night', resolved:tid, dark:!!t.dark, scheme, tokens:toks }));
  }catch(e){}
  return t;
}

//   AI PROVIDERS — only providers you can use for free (a standing free tier /
//   free API quota, no card and no credit purchase), then models running on
//   your own machine, then bring-your-own-key for anything you already pay for.
//   `base` is an OpenAI-compatible endpoint unless `gemini` is set.
const AI_PROVIDERS = [
  { id:'groq', name:'Groq — fast, free', group:'Free API tiers', base:'https://api.groq.com/openai/v1',
    keyLabel:'Groq API key', keyHint:'Free at console.groq.com', keyPh:'gsk_…',
    about:'Free tier, very fast. Good default for drafting.',
    models:[{id:'llama-3.3-70b-versatile',n:'Llama 3.3 70B'},{id:'llama-3.1-8b-instant',n:'Llama 3.1 8B'},{id:'openai/gpt-oss-120b',n:'GPT-OSS 120B'},{id:'qwen/qwen3-32b',n:'Qwen3 32B'}] },
  { id:'gemini', name:'Google Gemini — free tier', group:'Free API tiers', base:'https://generativelanguage.googleapis.com/v1beta', gemini:true,
    keyLabel:'Gemini API key', keyHint:'Free at aistudio.google.com/apikey', keyPh:'AIza…',
    about:'Free tier with a large context window.',
    models:[{id:'gemini-2.5-flash',n:'Gemini 2.5 Flash'},{id:'gemini-2.5-pro',n:'Gemini 2.5 Pro'},{id:'gemini-2.0-flash',n:'Gemini 2.0 Flash'}] },
  { id:'openrouter', name:'OpenRouter — free models', group:'Free API tiers', base:'https://openrouter.ai/api/v1', freeOnly:true,
    keyLabel:'OpenRouter key', keyHint:'Free at openrouter.ai/keys', keyPh:'sk-or-…',
    about:'One key, many models — the :free ones cost nothing.',
    models:[{id:'meta-llama/llama-3.3-70b-instruct:free',n:'Llama 3.3 70B (free)'},{id:'google/gemini-2.0-flash-exp:free',n:'Gemini 2.0 Flash (free)'},{id:'deepseek/deepseek-r1:free',n:'DeepSeek R1 (free)'},{id:'qwen/qwen3-235b-a22b:free',n:'Qwen3 235B (free)'}] },
  { id:'cerebras', name:'Cerebras — free tier', group:'Free API tiers', base:'https://api.cerebras.ai/v1',
    keyLabel:'Cerebras API key', keyHint:'Free at cloud.cerebras.ai', keyPh:'csk-…',
    about:'Free tier, extremely fast inference.',
    models:[{id:'llama3.1-8b',n:'Llama 3.1 8B'},{id:'llama-3.3-70b',n:'Llama 3.3 70B'},{id:'qwen-3-32b',n:'Qwen3 32B'}] },
  { id:'mistral', name:'Mistral — free tier', group:'Free API tiers', base:'https://api.mistral.ai/v1',
    keyLabel:'Mistral API key', keyHint:'Free at console.mistral.ai', keyPh:'…',
    about:'Free “experiment” tier on La Plateforme.',
    models:[{id:'mistral-small-latest',n:'Mistral Small'},{id:'open-mistral-nemo',n:'Mistral Nemo'},{id:'mistral-large-latest',n:'Mistral Large'}] },
  { id:'sambanova', name:'SambaNova — free tier', group:'Free API tiers', base:'https://api.sambanova.ai/v1',
    keyLabel:'SambaNova API key', keyHint:'Free at cloud.sambanova.ai', keyPh:'…',
    about:'Generous free tier on fast open models.',
    models:[{id:'Meta-Llama-3.3-70B-Instruct',n:'Llama 3.3 70B'},{id:'Meta-Llama-3.1-8B-Instruct',n:'Llama 3.1 8B'},{id:'DeepSeek-R1',n:'DeepSeek R1'}] },
  { id:'together', name:'Together AI — free models', group:'Free API tiers', base:'https://api.together.xyz/v1',
    keyLabel:'Together API key', keyHint:'Free at api.together.ai', keyPh:'…',
    about:'Several models are free forever (look for -Free).',
    models:[{id:'meta-llama/Llama-3.3-70B-Instruct-Turbo-Free',n:'Llama 3.3 70B (free)'},{id:'meta-llama/Llama-Vision-Free',n:'Llama Vision (free)'}] },
  { id:'github', name:'GitHub Models — free with a GitHub token', group:'Free API tiers', base:'https://models.inference.ai.azure.com',
    keyLabel:'GitHub personal token', keyHint:'Free at github.com/settings/tokens (needs models:read)', keyPh:'ghp_…',
    about:'Free with any GitHub account — no billing needed.',
    models:[{id:'gpt-4o-mini',n:'GPT-4o mini'},{id:'Llama-3.3-70B-Instruct',n:'Llama 3.3 70B'},{id:'Phi-3.5-MoE-instruct',n:'Phi-3.5 MoE'}] },
  { id:'glm', name:'Zhipu GLM — free tier', group:'Free API tiers', base:'https://open.bigmodel.cn/api/paas/v4',
    keyLabel:'Zhipu API key', keyHint:'Free at open.bigmodel.cn', keyPh:'…',
    about:'GLM-4 Flash is free and strong at long-form text.',
    models:[{id:'glm-4-flash',n:'GLM-4 Flash (free)'},{id:'glm-4-air',n:'GLM-4 Air'}] },
  { id:'qwen', name:'Qwen (DashScope) — free quota', group:'Free API tiers', base:'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',
    keyLabel:'DashScope API key', keyHint:'Free at modelstudio.console.alibabacloud.com', keyPh:'sk-…',
    about:'Free monthly quota, OpenAI-compatible endpoint.',
    models:[{id:'qwen-plus',n:'Qwen Plus'},{id:'qwen-turbo',n:'Qwen Turbo'},{id:'qwen-max',n:'Qwen Max'}] },
  { id:'ovh', name:'OVH AI Endpoints — free', group:'Free API tiers', base:'https://oai.endpoints.kepler.ai.cloud.ovh.net/v1',
    keyLabel:'OVH API key', keyHint:'Free at endpoints.ai.cloud.ovh.net', keyPh:'…',
    about:'Free EU-hosted endpoints, no billing required.',
    models:[{id:'Meta-Llama-3_3-70B-Instruct',n:'Llama 3.3 70B'},{id:'Qwen2.5-72B-Instruct',n:'Qwen2.5 72B'}] },
  { id:'scaleway', name:'Scaleway — free beta', group:'Free API tiers', base:'https://api.scaleway.ai/v1',
    keyLabel:'Scaleway API key', keyHint:'Free public beta at console.scaleway.com', keyPh:'…',
    about:'Free public beta on European-hosted models.',
    models:[{id:'llama-3.3-70b-instruct',n:'Llama 3.3 70B'},{id:'qwen2.5-coder-32b-instruct',n:'Qwen2.5 Coder 32B'}] },
  { id:'cloudflare', name:'Cloudflare Workers AI — free daily allowance', group:'Free API tiers', base:'https://api.cloudflare.com/client/v4/accounts/YOUR_ACCOUNT_ID/ai/v1', custom:true,
    keyLabel:'Cloudflare API token', keyHint:'Free daily neurons at dash.cloudflare.com — put your account id in the endpoint', keyPh:'…',
    about:'Free daily allowance. Swap YOUR_ACCOUNT_ID for your Cloudflare account id.',
    models:[{id:'@cf/meta/llama-3.3-70b-instruct-fp8-fast',n:'Llama 3.3 70B'},{id:'@cf/qwen/qwen2.5-coder-32b-instruct',n:'Qwen2.5 Coder 32B'}] },
  { id:'ollama', name:'Ollama — local, no key', group:'Local (your machine)', base:'http://localhost:11434/v1', keyless:true,
    keyLabel:'API key', keyHint:'Not needed — Ollama runs on your machine', keyPh:'(none)',
    about:'Completely free and private. Needs Ollama running locally.',
    models:[{id:'llama3.1',n:'Llama 3.1'},{id:'qwen2.5',n:'Qwen 2.5'},{id:'mistral',n:'Mistral'}] },
  { id:'lmstudio', name:'LM Studio — local, no key', group:'Local (your machine)', base:'http://localhost:1234/v1', keyless:true,
    keyLabel:'API key', keyHint:'Not needed — LM Studio runs on your machine', keyPh:'(none)',
    about:'Completely free and private. Needs LM Studio’s local server.',
    models:[{id:'local-model',n:'Currently loaded model'}] },
  { id:'openai', name:'OpenAI — your own key', group:'Bring your own key', base:'https://api.openai.com/v1',
    keyLabel:'OpenAI API key', keyHint:'platform.openai.com/api-keys', keyPh:'sk-…',
    about:'Point ScriptForge at your own paid OpenAI key.',
    models:[{id:'gpt-4o-mini',n:'GPT-4o mini'},{id:'gpt-4o',n:'GPT-4o'},{id:'gpt-4.1-mini',n:'GPT-4.1 mini'}] },
  { id:'deepseek', name:'DeepSeek — your own key', group:'Bring your own key', base:'https://api.deepseek.com/v1',
    keyLabel:'DeepSeek API key', keyHint:'platform.deepseek.com/api_keys', keyPh:'sk-…',
    about:'Cheap keys and strong long-form writing.',
    models:[{id:'deepseek-chat',n:'DeepSeek Chat'},{id:'deepseek-reasoner',n:'DeepSeek Reasoner'}] },
  { id:'xai', name:'xAI Grok — your own key', group:'Bring your own key', base:'https://api.x.ai/v1',
    keyLabel:'xAI API key', keyHint:'console.x.ai', keyPh:'xai-…',
    about:'Grok models with your own key.',
    models:[{id:'grok-3-mini',n:'Grok 3 mini'},{id:'grok-2-1212',n:'Grok 2'}] },
  { id:'moonshot', name:'Moonshot Kimi — your own key', group:'Bring your own key', base:'https://api.moonshot.ai/v1',
    keyLabel:'Moonshot API key', keyHint:'platform.moonshot.ai', keyPh:'sk-…',
    about:'Kimi models — very long context.',
    models:[{id:'kimi-k2-0711-preview',n:'Kimi K2'},{id:'moonshot-v1-128k',n:'Moonshot 128k'}] },
  { id:'perplexity', name:'Perplexity Sonar — your own key', group:'Bring your own key', base:'https://api.perplexity.ai',
    keyLabel:'Perplexity API key', keyHint:'perplexity.ai/settings/api', keyPh:'pplx-…',
    about:'Search-grounded answers with your own key.',
    models:[{id:'sonar',n:'Sonar'},{id:'sonar-pro',n:'Sonar Pro'}] },
  { id:'custom', name:'Custom — any OpenAI-compatible endpoint (BYOK)', group:'Bring your own key', base:'', custom:true,
    keyLabel:'API key', keyHint:'Your own key — stored only in this browser', keyPh:'sk-…',
    about:'Point at any OpenAI-compatible API — a proxy, a self-hosted model, your own gateway.',
    models:[] }
];

function aiProvider(id){ return AI_PROVIDERS.find(p => p.id === (id || S.config.provider)) || AI_PROVIDERS[0]; }

// Key for a provider: new per-provider map first, then the legacy fields
function aiKeyFor(id){
  const p = id || S.config.provider;
  const keys = S.config.aiKeys || {};
  if(keys[p]) return keys[p];
  if(p === 'groq') return S.config.groqKey || '';
  if(p === 'gemini') return S.config.geminiKey || '';
  if(p === 'openrouter') return S.config.openrouterKey || '';
  return '';
}
function aiSetKey(id, val){
  if(!S.config.aiKeys) S.config.aiKeys = {};
  S.config.aiKeys[id] = val;
}
// Endpoint for a provider: per-provider override first, then its default
function aiBaseFor(id){
  const p = id || S.config.provider;
  const bases = S.config.aiBases || {};
  if(bases[p]) return bases[p];
  return aiProvider(p).base || '';
}
// Model: per-provider choice first, then the legacy single model field,
// then the provider's first built-in model
function aiModelFor(id){
  const p = id || S.config.provider;
  const m = S.config.modelByProvider || {};
  if(m[p]) return m[p];
  if(p === S.config.provider && S.config.model) return S.config.model;
  const def = aiProvider(p).models || [];
  return def[0] ? def[0].id : '';
}
function aiSetModel(id, model){
  if(!S.config.modelByProvider) S.config.modelByProvider = {};
  S.config.modelByProvider[id] = model;
  S.config.model = model;
}

const FONTS = [
  {name:'Merriweather',f:"'Merriweather',serif",g:'Serif'},
  {name:'Playfair Display',f:"'Playfair Display',serif",g:'Serif'},
  {name:'Lora',f:"'Lora',serif",g:'Serif'},
  {name:'Crimson Text',f:"'Crimson Text',serif",g:'Serif'},
  {name:'EB Garamond',f:"'EB Garamond',serif",g:'Serif'},
  {name:'Cormorant Garamond',f:"'Cormorant Garamond',serif",g:'Serif'},
  {name:'Source Serif 4',f:"'Source Serif 4',serif",g:'Serif'},
  {name:'IBM Plex Serif',f:"'IBM Plex Serif',serif",g:'Serif'},
  {name:'Libre Baskerville',f:"'Libre Baskerville',serif",g:'Serif'},
  {name:'Inter',f:"'Inter',sans-serif",g:'Sans'},
  {name:'JetBrains Mono',f:"'JetBrains Mono',monospace",g:'Mono'},
  {name:'Courier Prime',f:"'Courier Prime',monospace",g:'Mono'},
  {name:'Caveat',f:"'Caveat',cursive",g:'Hand'},
  {name:'Dancing Script',f:"'Dancing Script',cursive",g:'Hand'},
  {name:'Noto Serif Devanagari',f:"'Noto Serif Devanagari',serif",g:'Indic'},
  {name:'Noto Serif Tamil',f:"'Noto Serif Tamil',serif",g:'Indic'},
  {name:'Noto Serif Bengali',f:"'Noto Serif Bengali',serif",g:'Indic'},
  {name:'Noto Serif Telugu',f:"'Noto Serif Telugu',serif",g:'Indic'}
];

// ═══ Languages — International ═══
const LANGS_INTL = [
  {code:'en',name:'English',flag:'🇬🇧'},
  {code:'es',name:'Spanish',flag:'🇪🇸'},
  {code:'fr',name:'French',flag:'🇫🇷'},
  {code:'de',name:'German',flag:'🇩🇪'},
  {code:'it',name:'Italian',flag:'🇮🇹'},
  {code:'pt',name:'Portuguese',flag:'🇵🇹'},
  {code:'nl',name:'Dutch',flag:'🇳🇱'},
  {code:'sv',name:'Swedish',flag:'🇸🇪'},
  {code:'pl',name:'Polish',flag:'🇵🇱'},
  {code:'tr',name:'Turkish',flag:'🇹🇷'},
  {code:'el',name:'Greek',flag:'🇬🇷'},
  {code:'cs',name:'Czech',flag:'🇨🇿'},
  {code:'ro',name:'Romanian',flag:'🇷🇴'},
  {code:'hu',name:'Hungarian',flag:'🇭🇺'},
  {code:'uk',name:'Ukrainian',flag:'🇺🇦'},
  {code:'ja',name:'Japanese',flag:'🇯🇵'},
  {code:'ko',name:'Korean',flag:'🇰🇷'},
  {code:'zh',name:'Chinese',flag:'🇨🇳'},
  {code:'th',name:'Thai',flag:'🇹🇭'},
  {code:'vi',name:'Vietnamese',flag:'🇻🇳'},
  {code:'id',name:'Indonesian',flag:'🇮🇩'},
  {code:'ms',name:'Malay',flag:'🇲🇾'},
  {code:'fil',name:'Filipino',flag:'🇵🇭'},
  {code:'ar',name:'Arabic',flag:'🇸🇦'},
  {code:'he',name:'Hebrew',flag:'🇮🇱'},
  {code:'fa',name:'Persian',flag:'🇮🇷'},
  {code:'ru',name:'Russian',flag:'🇷🇺'},
  {code:'sw',name:'Swahili',flag:'🇰🇪'}
];

// ═══ Languages — Indian regional ═══
const LANGS_INDIA = [
  { code:'hi', name:'Hindi', flag:'🇮🇳', native:'हिन्दी' }
];

// ═══════════════════════════════════════════════════════════
//   PER-MODE DATA MODEL
// ═══════════════════════════════════════════════════════════

function freshModeData(){
  return {
    currentCategory: null,
    currentProject: null,
    currentChapter: null,
    _expandedProject: null,
    projects: [],
    chapters: [],
    drafts: [],
    notes: [],
    bible: {
      characters: [],
      locations: [],
      items: [],
      scenes: [],
      events: [],
      organizations: []
    },
    references: [],
    beats: [],
    timeline: [],
    kanban: {
      columns: [
        {id:'k1', title:'Ideas',     cards:[]},
        {id:'k2', title:'Drafting',  cards:[]},
        {id:'k3', title:'Editing',   cards:[]},
        {id:'k4', title:'Done',      cards:[]}
      ]
    },
    canvasElements: [],
    versions: [],
    published: [],   // published book records for Notebook shelf
    collections: []  // notebook collections: {id,name,books:[projectIds]}
  };
}

// ═══════════════════════════════════════════════════════════
//   STATE
// ═══════════════════════════════════════════════════════════

const S = {
  config:{
    provider:'groq', model:'llama-3.3-70b-versatile',
    aiKeys:{}, aiBases:{}, modelByProvider:{},
    groqKey:'', geminiKey:'', openrouterKey:'', baseUrl:'',
    wolframAppId:'', merriamKey:'',
    temperature:0.75, maxTokens:4096, availableModels:{},
    color:'minimal',          // color preset: minimal, retro, noir, horror, animated, synthwave, cyberpunk, zen, paper, cinematic, painting
    visualizerAlign:'flex-end',   // 'center' | 'flex-end'   ← bars grow bottom-to-top
    musicProxy:false,           // route catbox URLs through CORS proxy
    style:'vercel',           // style preset: vercel, netflix, linear, flutter, apple, notion, arc, discord, material, windows, macos, figma
    theme:'night',            // color theme id from THEMES (every theme is dark)
    eyeComfort:false,         // warm light filter over any theme — night writing
    eyeComfortLevel:40,       // 0–100 → overlay strength
    // ── experimental (Settings → Experimental) ──
    expOverlay:false,         // floating overlay screen instead of the docked split screen
    expMixedFonts:false,      // rotate three fonts while typing
    mixedFonts:['','',''],    // the three fonts ('' = the editor's own font)
    mixedFontScope:'word',    // 'word' | 'sentence' | 'random'
    mixedFontPick:0,          // click a Font chip, then type: that font is applied
    expOrganize:false,        // "Organize my words" action in the AI panel + right-click menu
    expHinglish:false,        // Hinglish -> Hindi / English entries inside the Translate option
    overlay:{ open:false, page:'stats', x:null, y:null, w:640, h:420 },
    split:{ w:420 },          // docked split screen: how wide the side column is
    font:'', fontSize:17, lineHeight:1.75,
    letterSpacing:0, wordSpacing:0, paraSpacing:14,
    fontWeight:'400', textAlign:'left',
    editorWidth:'760px', canvasPad:48,
    autoSave:true, autoVersion:true, spellCheck:false, smartQuotes:false,
    ghostText:true, suggestionChips:true, autocomplete:true,
    focusMode:false,
    uiLang:'en', uiRtl:false,      // interface language (Settings → Language)
    defaultLang:'en', outputLang:'en',
    liveBarTarget:'devanagari', liveBarActive:false,
    dailyGoal:500, writingLog:{}, openLog:{},
    plugins:{
      hinglish:true, voice:true, wordGoal:true, readingTime:true,
      dictionary:true, thesaurus:true, wikipedia:true,
      websearch:true, imagesearch:true, tts:true,
      wolfram:false, merriam:false, idioms:false, quotes:false, etymology:false
    },
    uiScale:1, layout:'classic',
    pickerSources:['editor','chapters','notes','ideas','bible','drafts','references'],
    defaultExport:'md', includeMetadata:true, pageSize:'A4', pageMargins:25,
    authorName:'', authorEmail:''
  },
      modes:{},
      mode:'novel',
      category:null,
      page:'draft',
  // FAB menu state
      fabMenuOpen: false
};

// ═══════════════════════════════════════════════════════════
//   DATA ACCESS — current mode's data
// ═══════════════════════════════════════════════════════════

function D(){
  if(!S.modes) S.modes = {};
  if(!S.modes[S.mode]) S.modes[S.mode] = freshModeData();
  return S.modes[S.mode];
}


// Aliases so old code keeps working
Object.defineProperty(window, 'chapters',        {get:()=>D().chapters,          set:v=>D().chapters=v});
Object.defineProperty(window, 'currentChapter',  {get:()=>D().currentChapter,    set:v=>D().currentChapter=v});
Object.defineProperty(window, 'drafts',          {get:()=>D().drafts,            set:v=>D().drafts=v});
Object.defineProperty(window, 'notes',           {get:()=>D().notes,             set:v=>D().notes=v});
Object.defineProperty(window, 'ideas',           {get:()=>D().ideas,             set:v=>D().ideas=v});
Object.defineProperty(window, 'bible',           {get:()=>D().bible,             set:v=>D().bible=v});
Object.defineProperty(window, 'references',      {get:()=>D().references,        set:v=>D().references=v});
Object.defineProperty(window, 'beats',           {get:()=>D().beats,             set:v=>D().beats=v});
Object.defineProperty(window, 'timeline',        {get:()=>D().timeline,          set:v=>D().timeline=v});
Object.defineProperty(window, 'kanban',          {get:()=>D().kanban,            set:v=>D().kanban=v});
Object.defineProperty(window, 'canvasElements',  {get:()=>D().canvasElements,    set:v=>D().canvasElements=v});
Object.defineProperty(window, 'versions',        {get:()=>D().versions,          set:v=>D().versions=v});
Object.defineProperty(window, 'projects',        {get:()=>D().projects,          set:v=>D().projects=v});
Object.defineProperty(window, 'projectId',       {get:()=>D().currentProject,    set:v=>D().currentProject=v});

// ═══════════════════════════════════════════════════════════
//   UTILITIES
// ═══════════════════════════════════════════════════════════

const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid = () => 'i' + Math.random().toString(36).slice(2,10);
const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

function toast(msg, kind = 'ok'){
  const el = $('toast');
  if(!el) return;
  $('toastMsg').textContent = msg;
  el.className = 'toast show' + (kind === 'err' ? ' err' : kind === 'warn' ? ' warn' : '');
  const icon = el.querySelector('i');
  if(icon) icon.className = kind === 'err' ? 'bi bi-exclamation-triangle-fill' : kind === 'warn' ? 'bi bi-exclamation-circle-fill' : 'bi bi-check-circle-fill';
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 2600);
}

function toastLeft(msg, kind){
  kind = kind || 'info';
  const el = document.getElementById('toastLeft');
  if(!el) return;
  const msgEl = document.getElementById('toastLeftMsg');
  if(msgEl) msgEl.textContent = msg;
  el.className = 'toast-left show' + (kind === 'err' ? ' err' : kind === 'warn' ? ' warn' : '');
  const icon = el.querySelector('i');
  if(icon) icon.className = kind === 'err'
    ? 'bi bi-exclamation-triangle-fill'
    : kind === 'warn' ? 'bi bi-exclamation-circle-fill' : 'bi bi-info-circle-fill';
  clearTimeout(el._t);
  el._t = setTimeout(function(){ el.classList.remove('show'); }, 3000);
}
window.toastLeft = toastLeft;

// Chapter tree
function findCh(id, list = D().chapters){
  for(const c of list){
    if(c.id === id) return {ch:c, list};
    if(c.children){ const f = findChIn(id, c); if(f) return f; }
  }
  return null;
}
function findChIn(id, parent){
  if(!parent.children) return null;
  for(const c of parent.children){
    if(c.id === id) return {ch:c, list:parent.children};
    if(c.children){ const f = findChIn(id, c); if(f) return f; }
  }
  return null;
}
function curCh(){
  const f = findCh(D().currentChapter);
  return f ? f.ch : D().chapters[0];
}
function flatChs(list = D().chapters, depth = 0, out = []){
  for(const c of list){
    out.push({ch:c, depth});
    if(c.children && !c.collapsed) flatChs(c.children, depth + 1, out);
  }
  return out;
}
function ensureIds(){
  D().chapters.forEach(c => {
    if(!c.id) c.id = uid();
    if(!c.children) c.children = [];
    if(c.collapsed === undefined) c.collapsed = false;
  });
  if(!D().currentChapter && D().chapters[0]) D().currentChapter = D().chapters[0].id;
}

// Counts
function wordCount(html){
  if(!html) return 0;
  const d = document.createElement('div');
  d.innerHTML = html;
  const t = d.innerText.trim();
  return t ? t.split(/\s+/).length : 0;
}
function totalWords(){
  let n = 0;
  flatChs().forEach(({ch}) => {
    if(ch.id === D().currentChapter) return;
    n += wordCount(ch.content);
  });
  const ed = $('editor');
  if(ed) n += wordCount(ed.innerText);
  return n;
}

function modePages(){
  const m = currentMode();
  if(!m) return BASE_PAGES;
  return ['editor', 'write', 'read', 'draft', 'notes', 'plan', 'board',
          'timeline', 'cast', 'research', 'dictionary', 'canvas', 'inspire', 'stats',
          'notebook', 'format', 'import']
    .concat(m.editorViews || []);
}
// Mode/page helpers
function currentMode(){
  return MODES.find(m => m.id === S.mode) || MODES[0];
}
function currentPageDef(){
  const def = PAGE_META[S.page] || {name:'Page', icon:'file'};
  return { name: (typeof pname === 'function') ? pname(S.page) : def.name, icon: def.icon };
}

function allLangs(){ return LANGS_INTL.concat(LANGS_INDIA); }
function findLang(code){ return allLangs().find(l => l.code === code); }

// ═══════════════════════════════════════════════════════════
//   PERSISTENCE
// ═══════════════════════════════════════════════════════════

const STORE = {CFG:'sf7_config', DATA:'sf7_data', OLD6:'sf6_data', OLD5:'sfp5_doc'};

// ═══════════════════════════════════════════════════════════
//   SECTION NAMES — Scene / Subscene in screenplay, Chapter /
//   Subchapter everywhere else. A new project seeds its first section
//   as "Chapter 1" whatever the mode is, so the untouched default names
//   are renamed to match the mode. Only the exact defaults are touched —
//   anything the writer named themselves is left alone.
// ═══════════════════════════════════════════════════════════
function renameDefaultSection(title){
  return String(title == null ? '' : title)
    .replace(/^Chapter(\s+\d+)?$/, 'Scene$1')
    .replace(/^Subchapter(\s+\d+)?$/, 'Subscene$1');
}

function normalizeSectionTitles(list){
  const ls = list || (D() && D().chapters) || [];
  const screenplay = S.mode === 'screenplay';
  ls.forEach(c => {
    if(screenplay && typeof c.title === 'string' && c.title){
      const renamed = renameDefaultSection(c.title);
      if(renamed !== c.title) c.title = renamed;
    }
    if(c.children && c.children.length) normalizeSectionTitles(c.children);
  });
}
window.normalizeSectionTitles = normalizeSectionTitles;

// ═══════════════════════════════════════════════════════════
//   DAYS OPENED — one entry per calendar day the app was opened.
//   The Statistics day line fills a circle for each of these days.
//   Keys are local dates (YYYY-MM-DD), so the circle matches the
//   day the person actually saw.
// ═══════════════════════════════════════════════════════════
function dayKey(dt){
  const d = dt || new Date();
  const p = n => (n < 10 ? '0' + n : String(n));
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
}
window.dayKey = dayKey;

function markTodayOpened(){
  if(!S.config.openLog || typeof S.config.openLog !== 'object') S.config.openLog = {};
  const log = S.config.openLog;
  log[dayKey()] = 1;
  /* keep the log bounded — a little over a year of days */
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 400);
  const oldest = dayKey(cutoff);
  Object.keys(log).forEach(k => { if(k < oldest) delete log[k]; });
  save();
}
window.markTodayOpened = markTodayOpened;

/* save() also runs at boot and on page changes, so the "Updated" stamp below
   is gated on a real edit: the editor's own input event flips this flag. */
let sfDocDirty = false;
document.addEventListener('input', function(e){
  const t = e.target;
  if(t && (t.id === 'editor' || (t.closest && t.closest('#editor')))) sfDocDirty = true;
}, true);

function save(){
  /* Overlay panes load the app in a read-only view — they must never write
     over the document the writer is editing in the main window. */
  if(window.SF_VIEW) return;
  normalizeSectionTitles();
   const ed = $('editor');
  if(ed && (S.page === 'write' || S.page === 'manuscript')){
    const c = curCh();
    if(c) c.content = ed.innerHTML;
  }

  /* stamp the open project — this is the "Last updated" date the stats card
     shows, and it is written by the same save() that persists everything else */
  try{
    const d = D();
    const p = (d.projects || []).find(x => x.id === d.currentProject);
        if(p && sfDocDirty) p.updated = Date.now();

  }catch(e){}

  try{
    localStorage.setItem(STORE.CFG, JSON.stringify(S.config));

    localStorage.setItem(STORE.CFG, JSON.stringify(S.config));
    localStorage.setItem(STORE.DATA, JSON.stringify({
      modes: S.modes,
      mode: S.mode,
      page: S.page
    }));
  }catch(e){ console.warn('save failed', e); }
}

  const OK_LANG = ['en','hi'];
  if(!OK_LANG.includes(S.config.defaultLang)) S.config.defaultLang = 'en';
  if(!OK_LANG.includes(S.config.outputLang))  S.config.outputLang  = 'en';
  S.config.uiLang = 'en';

function load(){
  try{
    const cfg = localStorage.getItem(STORE.CFG);
    if(cfg) Object.assign(S.config, JSON.parse(cfg));

    const data = localStorage.getItem(STORE.DATA);
    if(data){
      const d = JSON.parse(data);
      if(d.modes) S.modes = d.modes;
      if(d.mode) S.mode = d.mode;
      S.page = 'draft';
      // Ensure all modes exist
      MODES.forEach(m => {
        if(!S.modes[m.id]) S.modes[m.id] = freshModeData();
      });
    } else {
      migrateOld();
    }
  }catch(e){ console.warn('load failed', e); }
  ensureIds();
  normalizeSectionTitles();
  if(!window.SF_VIEW) markTodayOpened();
}

// ═══════════════════════════════════════════════════════════

function migrateOld(){
  try{
    // Ensure modes exist before migration
    MODES.forEach(m => {
      if(!S.modes[m.id]) S.modes[m.id] = freshModeData();
    });

    const old6 = localStorage.getItem(STORE.OLD6);
    if(old6){
      const d = JSON.parse(old6);
      // v6 had flat data; move into novel mode
      if(d.chapters) S.modes.novel.chapters = d.chapters;
      if(d.currentChapter) S.modes.novel.currentChapter = d.currentChapter;
      if(d.drafts) S.modes.novel.drafts = d.drafts;
      if(d.notes) S.modes.novel.notes = d.notes;
      if(d.ideas) S.modes.novel.ideas = d.ideas;
      if(d.bible) S.modes.novel.bible = d.bible;
      if(d.references) S.modes.novel.references = d.references;
      if(d.beats) S.modes.novel.beats = d.beats;
      if(d.timeline) S.modes.novel.timeline = d.timeline;
      if(d.kanban) S.modes.novel.kanban = d.kanban;
      if(d.canvasElements) S.modes.novel.canvasElements = d.canvasElements;
      if(d.versions) S.modes.novel.versions = d.versions;
      if(d.projects) S.modes.novel.projects = d.projects;
      if(d.mode) S.mode = d.mode;
      if(d.page) S.page = d.page;
      console.log('%c ✓ Migrated from v6', 'color:#10b981');
      save();
      return;
    }
    const old5 = localStorage.getItem(STORE.OLD5);
    if(old5){
      const d = JSON.parse(old5);
      if(d.chapters) S.modes.novel.chapters = d.chapters;
      if(d.currentChapterId) S.modes.novel.currentChapter = d.currentChapterId;
      if(d.notes) S.modes.novel.notes = d.notes;
      if(d.ideas) S.modes.novel.ideas = d.ideas;
      if(d.bible) S.modes.novel.bible = d.bible;
      if(d.versions) S.modes.novel.versions = d.versions;
      if(d.mode) S.mode = d.mode;
      console.log('%c ✓ Migrated from v5', 'color:#10b981');
      save();
    }
  }catch(e){ console.warn('migration failed', e); }
  
        // Ensure all modes exist
      MODES.forEach(m => {
        if(!S.modes[m.id]) S.modes[m.id] = freshModeData();
      });
}

// ═══════════════════════════════════════════════════════════
//   EXPORT TO GLOBAL SCOPE
// ═══════════════════════════════════════════════════════════

window.S = S;
window.MODES = MODES;
window.BASE_PAGES = BASE_PAGES;
window.PAGE_META = PAGE_META;
window.THEMES = THEMES;
window.themeById = themeById;
window.themeTokens = themeTokens;
window.resolveThemeId = resolveThemeId;
window.applyThemeVars = applyThemeVars;
window.AI_PROVIDERS = AI_PROVIDERS;
window.aiProvider = aiProvider;
window.aiKeyFor = aiKeyFor;
window.aiSetKey = aiSetKey;
window.aiBaseFor = aiBaseFor;
window.aiModelFor = aiModelFor;
window.aiSetModel = aiSetModel;
window.FONTS = FONTS;
window.LANGS_INTL = LANGS_INTL;
window.LANGS_INDIA = LANGS_INDIA;
window.$ = $;
window.$$ = $$;
window.esc = esc;
window.uid = uid;
window.debounce = debounce;
window.toast = toast;
window.findCh = findCh;
window.curCh = curCh;
window.flatChs = flatChs;
window.wordCount = wordCount;
window.totalWords = totalWords;
window.D = D;
window.currentMode = currentMode;
window.currentPageDef = currentPageDef;
window.modePages = modePages;
window.allLangs = allLangs;
window.findLang = findLang;
window.save = save;
window.load = load;
window.modePages = modePages;

console.log('%c ✓ state.js loaded (' + MODES.length + ' modes · ' + Object.keys(PAGE_META).length + ' pages)', 'color:#10b981;font-weight:600;');
