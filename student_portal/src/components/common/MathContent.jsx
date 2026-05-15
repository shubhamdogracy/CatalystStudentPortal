import katex from 'katex';
import 'katex/dist/katex.min.css';

const DOLLAR_PLACEHOLDER = '\x02DOLLAR\x03';

const tryKatex = (tex, display) => {
  try {
    const out = katex.renderToString(tex.trim(), { displayMode: display, throwOnError: false, strict: false });
    // If KaTeX produced an error span, fall back to the original raw text
    return out.includes('katex-error') ? null : out;
  } catch {
    return null;
  }
};

const renderLatex = (source) => {
  if (!source) return source;
  let out = source;

  // Normalise HTML-encoded dollar signs (&#36; or &dollar;) to literal $
  out = out.replace(/&#36;|&dollar;/gi, '$');

  // Protect currency amounts: $20, $8, $1,000, $37.50, $20buttons etc.
  // $<digits> is NEVER a LaTeX delimiter — shield it from all regex passes below.
  out = out.replace(/\$(\d[\d,]*(?:\.\d+)?)/g, `${DOLLAR_PLACEHOLDER}$1`);

  // Display math: $$...$$
  out = out.replace(/\$\$([\s\S]+?)\$\$/g, (match, tex) => tryKatex(tex, true) ?? match);

  // Display math: \[...\]
  out = out.replace(/\\\[([\s\S]+?)\\\]/g, (match, tex) => tryKatex(tex, true) ?? match);

  // Inline math: \(...\)
  out = out.replace(/\\\(([\s\S]+?)\\\)/g, (match, tex) => tryKatex(tex, false) ?? match);

  // Inline math: $...$  (no newlines, no HTML tags inside)
  out = out.replace(/\$([^$\n<>]+?)\$/g, (match, tex) => tryKatex(tex, false) ?? match);

  // Restore protected currency dollar signs
  out = out.split(DOLLAR_PLACEHOLDER).join('$');

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
