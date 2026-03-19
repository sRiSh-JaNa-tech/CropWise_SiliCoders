import React, { useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Copy,
  Download,
  FileText,
  Image as ImageIcon,
  Loader2,
  Paperclip,
  Send,
  TrendingUp,
  Trash2,
} from 'lucide-react';

type ChatMessage = {
  id: number;
  sender: 'user' | 'ai';
  text: string;
  model?: string;
  generatedAt?: string;
  isActionable?: boolean;
};

type PreparedAttachment = {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  kind: 'image' | 'document';
  dataBase64?: string;
  textContent?: string;
};

type CropChatApiResponse = {
  recommendation?: string;
  model?: string;
  generatedAt?: string;
  warnings?: string[];
  error?: string;
};

type AiChatApiResponse = {
  reply?: string;
  model?: string;
  error?: string;
};

const MAX_ATTACHMENTS = 5;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

const readAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error(`Failed to read file ${file.name}`));
    reader.readAsDataURL(file);
  });

const readAsText = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error(`Failed to read file ${file.name}`));
    reader.readAsText(file);
  });

const formatSize = (size: number) => `${(size / 1024).toFixed(1)} KB`;

const SmartMandiReturnsPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      sender: 'ai',
      text: 'Ask about current Mandi prices, crop trends, and the best time to sell your produce. I will provide market insights.',
    },
  ]);
  const [input, setInput] = useState('');
  const [pendingFiles, setPendingFiles] = useState<PreparedAttachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilePick = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files || []);
    event.target.value = '';

    if (selected.length === 0) return;

    if (pendingFiles.length + selected.length > MAX_ATTACHMENTS) {
      setError(`You can upload up to ${MAX_ATTACHMENTS} files per request.`);
      return;
    }

    const prepared: PreparedAttachment[] = [];

    for (const file of selected) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setError(`${file.name} is too large. Max size is 5 MB.`);
        continue;
      }

      const mimeType = file.type || 'application/octet-stream';
      const isImage = mimeType.startsWith('image/');
      const isTextLike =
        mimeType.startsWith('text/') ||
        mimeType.includes('json') ||
        mimeType.includes('xml') ||
        mimeType.includes('csv');

      try {
        if (isImage) {
          const dataUrl = await readAsDataUrl(file);
          const base64 = dataUrl.split(',')[1] || '';
          prepared.push({
            id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            name: file.name,
            mimeType,
            size: file.size,
            kind: 'image',
            dataBase64: base64,
          });
        } else if (isTextLike) {
          const textContent = await readAsText(file);
          prepared.push({
            id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            name: file.name,
            mimeType,
            size: file.size,
            kind: 'document',
            textContent: textContent.slice(0, 10000),
          });
        } else {
          prepared.push({
            id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            name: file.name,
            mimeType,
            size: file.size,
            kind: 'document',
          });
        }
      } catch {
        setError(`Could not read ${file.name}.`);
      }
    }

    if (prepared.length > 0) {
      setPendingFiles((prev) => [...prev, ...prepared]);
      setError(null);
    }
  };

  const removeFile = (id: string) => {
    setPendingFiles((prev) => prev.filter((file) => file.id !== id));
  };

  const copyResponse = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setActionNotice('Response copied to clipboard.');
    } catch {
      setError('Copy failed. Please allow clipboard permission and try again.');
    }
  };

  const downloadResponse = (text: string, generatedAt?: string) => {
    const stamp = generatedAt ? new Date(generatedAt).toISOString().slice(0, 19).replace(/[:T]/g, '-') : Date.now();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `market-analysis-${stamp}.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setActionNotice('Response downloaded as text file.');
  };

  const sendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    if (loading || (!input.trim() && pendingFiles.length === 0)) return;

    setLoading(true);
    setError(null);
    setActionNotice(null);

    const userText = input.trim() || 'Please analyze attached files and provide market insights.';

    setInput('');

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender: 'user',
        text: `${userText}${pendingFiles.length ? `\n\nAttached files: ${pendingFiles.map((f) => f.name).join(', ')}` : ''}`,
      },
    ]);

    try {
      const formData = new FormData();
      const combinedText = userText + (pendingFiles.length ? '\n\n[Attached files: ' + pendingFiles.map(f => f.textContent || '').join(' ') + ']' : '');
      formData.append('query', combinedText);

      const response = await fetch('http://localhost:9000/chat', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      const payload = { recommendation: data.response, model: data.category || 'gemini', generatedAt: new Date().toISOString(), warnings: [] } as CropChatApiResponse;

      if (!response.ok) {
        throw new Error('Failed to get market insights.');
      }

      const warnings = payload.warnings?.length ? `\n\nWarnings:\n- ${payload.warnings.join('\n- ')}` : '';

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'ai',
          text: `${payload.recommendation || 'No insights generated.'}${warnings}`,
          model: payload.model,
          generatedAt: payload.generatedAt,
          isActionable: true,
        },
      ]);

      setPendingFiles([]);
    } catch (sendError) {
      const initialError = sendError instanceof Error ? sendError.message : 'Failed to get recommendation.';
      
      try {
        const fallbackResponse = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: `${userText}${pendingFiles.length ? ' (Attachment-aware mode unavailable in this attempt.)' : ''}`,
          }),
        });

        const fallbackPayload = (await fallbackResponse.json()) as AiChatApiResponse;

        if (fallbackResponse.ok && fallbackPayload.reply) {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now() + 1,
              sender: 'ai',
              text: `${fallbackPayload.reply}\n\nNote: Fallback mode was used for this response.`,
              model: fallbackPayload.model,
              generatedAt: new Date().toISOString(),
              isActionable: true,
            },
          ]);
          setPendingFiles([]);
          setError(null);
          return;
        }
      } catch {
        // Ignore and show friendly final error.
      }

      const friendlyError = /expected pattern|did not match|model/i.test(initialError)
        ? 'AI service model is busy. Please try again in a few seconds.'
        : 'Unable to get market insights right now. Please try again.';

      setError(friendlyError);
    } finally {
      setLoading(false);
    }
  };

  const lastActionableAiId = [...messages]
    .reverse()
    .find((message) => message.sender === 'ai' && message.isActionable)?.id;

  return (
    <section className="min-h-[calc(100vh-80px)] overflow-y-auto p-4 pb-24 md:p-6 md:pb-24 lg:p-8 lg:pb-24 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-128px)] max-w-6xl flex-col rounded-3xl border border-white/10 bg-gradient-to-b from-surface/80 to-black/40 p-4 shadow-2xl backdrop-blur-xl md:p-6">
        
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold tracking-wide text-primary">
              <TrendingUp className="h-3.5 w-3.5" />
              MANDI RETURNS CHAT
            </p>
            <h1 className="text-2xl font-bold md:text-3xl">Market Analyst</h1>
            <p className="mt-1 text-sm text-green-100/70">
              Ask in chat for current market prices, mandi trends, and profit maximization tips.
            </p>
          </div>
        </div>

        <div className="mb-4 flex-1 min-h-[320px] overflow-y-auto rounded-2xl border border-white/10 bg-black/25 p-4 md:p-5">
          <div className="space-y-4">
            {messages.map((message) => (
              <article
                key={message.id}
                className={`rounded-2xl border p-4 ${
                  message.sender === 'user'
                    ? 'ml-auto max-w-[90%] border-primary/30 bg-primary/10'
                    : 'mr-auto max-w-[90%] border-white/10 bg-white/5'
                }`}
              >
                <div className="prose prose-invert max-w-none text-sm leading-7 text-gray-100 prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10 prose-headings:text-green-500 prose-strong:text-green-400">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {message.text}
                  </ReactMarkdown>
                </div>

                {message.sender === 'ai' && message.isActionable && message.id === lastActionableAiId && !loading && (
                  <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-white/10 pt-3">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-black/30 px-3 py-1.5 text-xs font-medium text-gray-100 hover:bg-black/50"
                      onClick={() => copyResponse(message.text)}
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Copy
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-black/30 px-3 py-1.5 text-xs font-medium text-gray-100 hover:bg-black/50"
                      onClick={() => downloadResponse(message.text, message.generatedAt)}
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </button>
                    {message.model && (
                      <span className="rounded-lg border border-primary/20 bg-primary/10 px-2 py-1 text-[11px] text-primary">
                        {message.model}
                      </span>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>

        {pendingFiles.length > 0 && (
          <div className="mb-4 rounded-2xl border border-white/10 bg-black/20 p-3">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Pending attachments</div>
            <div className="flex flex-wrap gap-2">
              {pendingFiles.map((file) => (
                <div key={file.id} className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs">
                  {file.kind === 'image' ? <ImageIcon className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
                  <span>{file.name}</span>
                  <span className="text-gray-400">({formatSize(file.size)})</span>
                  <button type="button" onClick={() => removeFile(file.id)} className="text-red-300 hover:text-red-200" aria-label="Remove attachment">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={sendMessage} className="rounded-2xl border border-white/10 bg-black/30 p-3 md:p-4">
          <label className="mb-2 block text-xs font-medium text-gray-400">Ask for market insights</label>
          <div className="flex items-end gap-2">
            <div className="flex flex-1 items-end gap-2 rounded-xl border border-white/10 bg-black/20 p-2">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                rows={2}
                placeholder="Example: What is the current market price for wheat in Punjab?"
                className="min-h-[44px] flex-1 resize-none bg-transparent px-2 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none"
              />

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.txt,.md,.csv,.json,.xml"
                className="hidden"
                onChange={handleFilePick}
              />

              <button
                type="button"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/5 px-3 text-sm font-medium text-white hover:bg-white/10"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="h-4 w-4" />
                Attach
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || (!input.trim() && pendingFiles.length === 0)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white transition-all hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send
            </button>
          </div>

          {error && (
            <p className="mt-3 whitespace-pre-wrap break-words rounded-lg border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs leading-6 text-red-200">
              {error}
            </p>
          )}
          {actionNotice && !error && (
            <p className="mt-3 rounded-lg border border-primary/20 bg-primary/10 px-3 py-2 text-xs text-primary">{actionNotice}</p>
          )}
        </form>
      </div>
    </section>
  );
};

export default SmartMandiReturnsPage;
