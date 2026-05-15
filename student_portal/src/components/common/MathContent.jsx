import katex from 'katex';
import 'katex/dist/katex.min.css';

const DOLLAR_PLACEHOLDER = '\x02DOLLAR\x03';

const tryKatex = (tex, display) => {
  try {
    const out = katex.renderToString(tex.trim(), { displayMode: display, throwOnError: false, strict: false });
    return out.includes('katex-error') ? null : out;
  } catch {
    return null;
  }
};

// Clean up raw LaTeX so it reads naturally when KaTeX can't render it.
// e.g. "x^{2}+3x" → "x²+3x",  "x_{n}" → "xₙ",  "\frac{1}{2}" → "1/2"
const latexToPlain = (tex) => {
  let t = tex.trim();

  // Simple fractions: \frac{a}{b} → a/b
  t = t.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)');

  // Superscripts with braces: ^{...} → use unicode superscripts when single digit/sign
  const superMap = { '0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹','+':'⁺','-':'⁻','n':'ⁿ' };
  t = t.replace(/\^\{([^}]+)\}/g, (_, exp) =>
    exp.length === 1 && superMap[exp] ? superMap[exp] : `^${exp}`
  );
  // Bare superscripts: ^2 → ²
  t = t.replace(/\^([0-9n])/g, (_, c) => superMap[c] || `^${c}`);

  // Subscripts with braces: _{...} → plain text
  t = t.replace(/_\{([^}]+)\}/g, '_$1');

  // Remove remaining LaTeX commands like \cdot → ·, \times → ×, \div → ÷
  t = t.replace(/\\cdot/g, '·');
  t = t.replace(/\\times/g, '×');
  t = t.replace(/\\div/g, '÷');
  t = t.replace(/\\leq/g, '≤');
  t = t.replace(/\\geq/g, '≥');
  t = t.replace(/\\neq/g, '≠');
  t = t.replace(/\\sqrt\{([^}]+)\}/g, '√($1)');
  t = t.replace(/\\sqrt/g, '√');
  t = t.replace(/\\pi/g, 'π');
  t = t.replace(/\\infty/g, '∞');
  t = t.replace(/\\pm/g, '±');

  // Remove remaining backslash commands
  t = t.replace(/\\[a-zA-Z]+/g, '');
  // Remove stray braces
  t = t.replace(/[{}]/g, '');

  return t;
};

const renderLatex = (source) => {
  if (!source) return source;
  let out = source;

  // Normalise HTML-encoded dollar signs (&#36; or &dollar;) to literal $
  out = out.replace(/&#36;|&dollar;/gi, '$');

  // Protect currency amounts: $20, $8, $1,000, $37.50
  // Exclude when followed by LaTeX chars or ( so $12(9x+1)$ is still treated as math.
  out = out.replace(/\$(\d[\d,]*(?:\.\d+)?)(?![{^_\\a-zA-Z(])/g, `${DOLLAR_PLACEHOLDER}$1`);

  // Display math: $$...$$
  out = out.replace(/\$\$([\s\S]+?)\$\$/g, (match, tex) => tryKatex(tex, true) ?? latexToPlain(tex));

  // Display math: \[...\]
  out = out.replace(/\\\[([\s\S]+?)\\\]/g, (match, tex) => tryKatex(tex, true) ?? latexToPlain(tex));

  // Inline math: \(...\)
  out = out.replace(/\\\(([\s\S]+?)\\\)/g, (match, tex) => tryKatex(tex, false) ?? latexToPlain(tex));

  // Inline math: $...$  (no newlines, no HTML tags inside)
  out = out.replace(/\$([^$\n<>]+?)\$/g, (match, tex) => tryKatex(tex, false) ?? latexToPlain(tex));

  // Restore protected currency dollar signs
  out = out.split(DOLLAR_PLACEHOLDER).join('$');

  // Absolute safety net: strip any $...$ that still weren't rendered
  // (catches edge cases where the regex above didn't match)
  out = out.replace(/\$([^$\n]+)\$/g, '$1');

  return out;
};

const boldChoiceLabels = (source) => {
  if (!source) return source;
  return source.replace(
    /(Choice\s+[A-D]\s+is\s+(?:(?:the\s+)?(?:correct|best)\s+answer|(?:in)?correct))/gi,
    '<strong>$1</strong>',
  );
};

export default function MathContent({ html, className = '', style }) {
  if (!html) return null;
  return (
    <div
      className={`sat-content ${className}`}
      style={style}
      dangerouslySetInnerHTML={{ __html: renderLatex(boldChoiceLabels(html)) }}
    />
  );
}
