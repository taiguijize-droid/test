#!/usr/bin/env node
// HIG audit for Web UI. Usage: node hig-audit.mjs <file.html|URL> [--dark] [--json] [--width=375] [--platform=ios|macos]
// Treats 1 CSS px as 1 pt. Thresholds come from references/specs.md.
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';

// Resolve playwright from the project, then from global installs (npm root -g, NODE_PATH, /opt/node-tools).
function loadPlaywright() {
  const candidates = [process.cwd(), ...(process.env.NODE_PATH || '').split(':').filter(Boolean), '/opt/node-tools'];
  try { candidates.push(execSync('npm root -g', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()); } catch {}
  for (const base of candidates) {
    try { return createRequire(path.join(base, 'noop.js'))('playwright'); } catch {}
  }
  console.error('playwright が見つかりません。`npm i -D playwright` を実行してください。'); process.exit(2);
}
const { chromium } = loadPlaywright();

const args = process.argv.slice(2);
const target = args.find(a => !a.startsWith('--'));
if (!target) { console.error('usage: hig-audit.mjs <file.html|URL> [--dark] [--json] [--width=375] [--platform=ios|macos]'); process.exit(2); }
const opt = k => (args.find(a => a.startsWith(`--${k}=`)) || '').split('=')[1];
const dark = args.includes('--dark');
const json = args.includes('--json');
const width = Number(opt('width') || 375);
const platform = opt('platform') || 'ios';
const T = platform === 'macos'
  ? { minText: 10, body: 13, control: 28, spacing: 8 }
  : { minText: 11, body: 17, control: 44, spacing: 8 };

const url = /^https?:/.test(target) ? target : pathToFileURL(path.resolve(target)).href;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width, height: 812 }, colorScheme: dark ? 'dark' : 'light' });
await page.goto(url, { waitUntil: 'networkidle' });

const findings = await page.evaluate((T) => {
  const out = [];
  const add = (rule, el, detail, extra = {}) => out.push({ rule, el: describe(el), detail, ...extra });
  const describe = el => {
    if (!el || !el.tagName) return '';
    const id = el.id ? `#${el.id}` : '';
    const cls = el.classList && el.classList.length ? '.' + [...el.classList].slice(0, 2).join('.') : '';
    const txt = (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40);
    return `${el.tagName.toLowerCase()}${id}${cls}${txt ? ` "${txt}"` : ''}`;
  };
  const visible = el => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && cs.opacity !== '0'; };
  const parseColor = s => { const m = s && s.match(/rgba?\(([^)]+)\)/); if (!m) return null; const [r, g, b, a = 1] = m[1].split(',').map(Number); return { r, g, b, a: isNaN(a) ? 1 : a }; };
  const lum = ({ r, g, b }) => { const f = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const blend = (fg, bg) => ({ r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a), a: 1 });
  const bgOf = el => {
    let n = el, acc = null;
    while (n && n.nodeType === 1) {
      const c = parseColor(getComputedStyle(n).backgroundColor);
      if (c && c.a > 0) { acc = acc ? blend(acc, c) : c; if (acc.a >= 1 || c.a >= 1) return acc; }
      n = n.parentElement;
    }
    const body = parseColor(getComputedStyle(document.body).backgroundColor);
    const base = body && body.a > 0 ? body : { r: 255, g: 255, b: 255, a: 1 };
    return acc ? blend(acc, base) : base;
  };
  const ratio = (a, b) => { const l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); };

  // --- text ---
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const seen = new Set();
  let n;
  while ((n = walker.nextNode())) {
    if (!n.textContent.trim()) continue;
    const el = n.parentElement;
    if (!el || seen.has(el) || !visible(el) || ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(el.tagName)) continue;
    seen.add(el);
    const cs = getComputedStyle(el);
    const size = parseFloat(cs.fontSize), weight = parseInt(cs.fontWeight, 10) || 400;
    if (size < T.minText) add('text-too-small', el, `${size}px < ${T.minText}px`);
    if (weight < 400) add('light-weight', el, `font-weight ${weight}`);
    const fg = parseColor(cs.color);
    if (fg) {
      const bg = bgOf(el);
      const fgb = fg.a < 1 ? blend(fg, bg) : fg;
      const r = ratio(fgb, bg);
      const need = (size >= 18 || weight >= 700) ? 3 : 4.5;
      if (r < need) add('contrast', el, `${r.toFixed(2)}:1 < ${need}:1 (${size}px, w${weight})`, { fg: cs.color, bg: `rgb(${Math.round(bg.r)},${Math.round(bg.g)},${Math.round(bg.b)})` });
    }
  }
  // body-small: paragraphs / list items / td under 17px
  // Body copy below Subhead (15pt on iOS) is flagged; captions (label, small, th) are allowed down to minText.
  const bodyFloor = T.body === 17 ? 15 : T.body;
  document.querySelectorAll('p, li, td, textarea, input[type=text]').forEach(el => {
    if (!visible(el) || !(el.textContent || el.value || '').trim()) return;
    const size = parseFloat(getComputedStyle(el).fontSize);
    if (size < bodyFloor && size >= T.minText) add('body-small', el, `${size}px < ${bodyFloor}px (推奨: 本文は ${T.body}px、密度優先でも ${bodyFloor}px)`);
  });

  // --- controls ---
  const ctrlSel = 'a[href], button, input:not([type=hidden]), select, textarea, [role=button], [role=link], [role=tab], [role=checkbox], [role=switch], [tabindex]:not([tabindex="-1"])';
  const ctrls = [...document.querySelectorAll(ctrlSel)].filter(visible);
  // a checkbox/radio wrapped in a <label> is hit through the label, so measure the label
  const hitEl = el => (el.tagName === 'INPUT' && /^(checkbox|radio)$/.test(el.type) && el.closest('label')) || el;
  const rects = ctrls.map(el => ({ el, r: hitEl(el).getBoundingClientRect() }));
  rects.forEach(({ el, r }) => {
    const inline = getComputedStyle(el).display === 'inline' && el.tagName === 'A' && el.closest('p, li, td');
    if (!inline && (r.width < T.control || r.height < T.control)) add('tap-target', el, `${Math.round(r.width)}×${Math.round(r.height)} < ${T.control}×${T.control}`);
  });
  for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
    const a = rects[i].r, b = rects[j].r;
    if (rects[i].el.contains(rects[j].el) || rects[j].el.contains(rects[i].el)) continue;
    const dx = Math.max(0, Math.max(a.left, b.left) - Math.min(a.right, b.right));
    const dy = Math.max(0, Math.max(a.top, b.top) - Math.min(a.bottom, b.bottom));
    const overlapX = a.left < b.right && b.left < a.right, overlapY = a.top < b.bottom && b.top < a.bottom;
    if ((overlapY && dx > 0 && dx < T.spacing) || (overlapX && dy > 0 && dy < T.spacing)) add('tap-spacing', rects[i].el, `${Math.round(Math.max(dx, dy))}px gap to ${describe(rects[j].el)}`);
  }
  // accessible names
  const nameOf = el => {
    if (el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || el.getAttribute('title')) return true;
    if (el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA') {
      if (el.id && document.querySelector(`label[for="${CSS.escape(el.id)}"]`)) return true;
      if (el.closest('label')) return true;
      if (el.type === 'submit' || el.type === 'button') return !!el.value;
      return !!el.placeholder && false; // placeholder alone does not count
    }
    if (el.querySelector('img[alt]:not([alt=""])')) return true;
    return !!(el.textContent || '').trim();
  };
  ctrls.forEach(el => { if (!nameOf(el)) add('no-accessible-name', el, 'no text / aria-label / <label for>'); });
  document.querySelectorAll('img').forEach(img => { if (visible(img) && !img.hasAttribute('alt')) add('img-no-alt', img, 'missing alt'); });

  // --- motion / materials / layout ---
  let hasAnim = false, hasReduce = false, glassInContent = [];
  for (const ss of document.styleSheets) {
    let rules; try { rules = ss.cssRules; } catch { continue; }
    const walk = list => { for (const r of list) {
      if (r.media && /prefers-reduced-motion/.test(r.media.mediaText)) hasReduce = true;
      if (r.style && ((r.style.transition && r.style.transition !== 'none' && r.style.transition !== 'all 0s ease 0s') || (r.style.animationName && r.style.animationName !== 'none'))) hasAnim = true;
      if (r.cssRules) walk(r.cssRules);
    } };
    walk(rules);
  }
  if (hasAnim && !hasReduce) out.push({ rule: 'motion-no-reduce', el: '<stylesheet>', detail: 'transition/animation present, no @media (prefers-reduced-motion: reduce)' });
  document.querySelectorAll('*').forEach(el => {
    const cs = getComputedStyle(el);
    const bf = cs.backdropFilter || cs.webkitBackdropFilter;
    if (bf && bf !== 'none' && visible(el)) {
      const isControlLayer = el.closest('header, nav, footer, [role=toolbar], [role=tablist], [role=navigation], aside, .toolbar, .tabbar, .sidebar');
      if (!isControlLayer) glassInContent.push(el);
    }
  });
  glassInContent.forEach(el => add('glass-in-content', el, 'backdrop-filter outside toolbar/nav/sidebar'));
  if (document.documentElement.scrollWidth > innerWidth + 1) out.push({ rule: 'horizontal-overflow', el: '<page>', detail: `scrollWidth ${document.documentElement.scrollWidth} > viewport ${innerWidth}` });
  document.querySelectorAll('*').forEach(el => {
    const cs = getComputedStyle(el);
    if (cs.position === 'fixed' && visible(el)) {
      const edge = ['top', 'bottom'].find(k => cs[k] === '0px');
      if (edge && !/env\(safe-area-inset/.test(el.getAttribute('style') || '') && !cssTextHas(el, 'safe-area-inset')) add('no-safe-area', el, `position:fixed ${edge}:0 without env(safe-area-inset-*)`);
    }
  });
  function cssTextHas(el, needle) {
    for (const ss of document.styleSheets) { let rules; try { rules = ss.cssRules; } catch { continue; } for (const r of rules) { try { if (r.selectorText && el.matches(r.selectorText) && r.cssText.includes(needle)) return true; } catch {} } }
    return false;
  }
  return out;
}, T);

await browser.close();

// dedupe
const key = f => `${f.rule}|${f.el}|${f.detail}`;
const uniq = [...new Map(findings.map(f => [key(f), f])).values()];
const counts = uniq.reduce((m, f) => (m[f.rule] = (m[f.rule] || 0) + 1, m), {});

if (json) {
  console.log(JSON.stringify({ target, width, dark, platform, thresholds: T, counts, findings: uniq }, null, 2));
} else {
  console.log(`HIG audit: ${target}  (width ${width}px, ${dark ? 'dark' : 'light'}, ${platform})`);
  if (!uniq.length) console.log('✅ no findings');
  for (const [rule, c] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
    console.log(`\n❌ ${rule} ×${c}`);
    uniq.filter(f => f.rule === rule).slice(0, 12).forEach(f => console.log(`   ${f.el}  — ${f.detail}${f.fg ? `  [${f.fg} on ${f.bg}]` : ''}`));
    if (c > 12) console.log(`   … ${c - 12} more`);
  }
  console.log(`\n→ 修正方法: .claude/skills/apple-hig/references/fixes.md`);
}
process.exit(uniq.length ? 1 : 0);
