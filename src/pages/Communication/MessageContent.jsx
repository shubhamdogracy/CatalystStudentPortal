import { formatBytes } from '../../utils/formatters';

export default function MessageContent({ text }) {
  if (!text) return null;

  if (text.startsWith('[IMG:')) {
    const end = text.indexOf(']', 5);
    if (end === -1) return <span className="break-words">{text}</span>;
    const dataUrl = text.slice(5, end);
    const caption = text.slice(end + 1).trim();
    return (
      <div>
        <img
          src={dataUrl} alt="attachment"
          className="max-w-full rounded-lg max-h-[200px] object-contain cursor-pointer block"
          onClick={() => window.open(dataUrl, '_blank')}
        />
        {caption && <p className="text-sm mt-1 break-words">{caption}</p>}
      </div>
    );
  }

  if (text.startsWith('[FILE:')) {
    const end = text.indexOf(']', 6);
    if (end === -1) return <span className="break-words">{text}</span>;
    const [filename, sizeStr] = text.slice(6, end).split('||');
    const caption = text.slice(end + 1).trim();
    const ext  = filename?.split('.').pop()?.toLowerCase() || '';
    const icon = ext === 'pdf' ? '📄' : ['doc', 'docx'].includes(ext) ? '📝' : ext === 'zip' ? '🗜️' : '📎';
    return (
      <div>
        <div className="flex items-center gap-2 bg-black/[0.06] rounded-lg px-2.5 py-2">
          <span className="text-lg leading-none">{icon}</span>
          <div className="min-w-0">
            <p className="text-sm font-medium leading-tight truncate">{filename}</p>
            <p className="text-xs opacity-60">{formatBytes(sizeStr)}</p>
          </div>
        </div>
        {caption && <p className="text-sm mt-1 break-words">{caption}</p>}
      </div>
    );
  }

  return <span className="break-words">{text}</span>;
}
