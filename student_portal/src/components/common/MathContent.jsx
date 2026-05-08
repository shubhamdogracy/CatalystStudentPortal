import katex from 'katex';
import 'katex/dist/katex.min.css';

// Pre-processes an HTML string and replaces LaTeX delimiters with
// KaTeX-rendered HTML. Handles $$...$$ (display) and $...$ (inline).
const renderLatex = (html) => {
  if (!html) return html;

  // Display math: $$...$$
  let out = html.replace(/\$\$([\s\S]+?)\$\$/g, (match, tex) => {
    try {
      return katex.renderToString(tex.trim(), { displayMode: true, throwOnError: false });
    } catch {
      return match;
    }
  });

  // Inline math: $...$ (not preceded or followed by another $)
  out = out.replace(/\$([^$\n<>]+?)\$/g, (match, tex) => {
    try {
      return katex.renderToString(tex.trim(), { displayMode: false, throwOnError: false });
    } catch {
      return match;
    }
  });

  return out;
};

export default function MathContent({ html, className = '', style }) {
  if (!html) return null;
  return (
    <div
      className={`sat-content ${className}`}
      style={style}
      dangerouslySetInnerHTML={{ __html: renderLatex(html) }}
    />
  );
}
