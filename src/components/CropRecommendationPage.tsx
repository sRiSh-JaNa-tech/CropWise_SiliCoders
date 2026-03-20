import * as React from 'react';
import { useRef, useState } from 'react';
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
  Sprout,
  Trash2,
  Wifi,
  Zap,
} from 'lucide-react';
import { useConnectivity } from '../context/ConnectivityContext';
import { modelService } from '../services/ai/ModelService';
import { knowledgeService } from '../services/ai/KnowledgeService';

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
  response?: string;
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

const renderMessageAsCards = (text: string) => {
  if (!text.includes('## ')) {
    return (
      <div className="prose prose-invert max-w-none text-sm leading-7 text-gray-100 prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10 prose-headings:text-green-500 prose-strong:text-green-400">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
      </div>
    );
  }

  const parts = text.split(/(?=## )/g);

  return (
    <div className="flex flex-col gap-4 mt-2">
      {parts.map((part, index) => {
        if (!part.trim()) return null;

        if (part.trim().startsWith('## ')) {
          const lines = part.trim().split('\n');
          const title = lines[0]?.replace('## ', '').trim() || '';
          const content = lines.slice(1).join('\n').trim();

          return (
            <div key={index} className="bg-gradient-to-br from-black/60 to-black/30 border border-green-500/20 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-green-500/40 transition-colors">
               <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 blur-[50px] rounded-full pointer-events-none group-hover:bg-green-500/15 transition-colors duration-500" />
               <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/10 relative z-10">
                 <div className="w-8 h-8 rounded-lg bg-green-500/20 text-green-400 flex items-center justify-center font-bold text-sm border border-green-500/30 shadow-[0_0_10px_rgba(34,197,94,0.2)]">
                   {index}
                 </div>
                 <h2 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300 tracking-wide">{title}</h2>
               </div>
               <div className="prose prose-invert max-w-none text-sm text-gray-300 relative z-10 prose-p:leading-relaxed prose-li:marker:text-green-500 prose-strong:text-green-400 prose-headings:text-green-300">
                 <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
               </div>
            </div>
          );
        }

        return (
           <div key={index} className="prose prose-invert max-w-none text-sm text-gray-200 px-2 leading-relaxed">
             <ReactMarkdown remarkPlugins={[remarkGfm]}>{part}</ReactMarkdown>
           </div>
        );
      })}
    </div>
  );
};

const CropRecommendationPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      sender: 'ai',
      text: 'Upload crop photos, soil reports, or field notes, then ask your question. I will provide actionable recommendations.',
    },
  ]);
  const [input, setInput] = useState('');
  const [pendingFiles, setPendingFiles] = useState<PreparedAttachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const { connectivity, isOffline } = useConnectivity();
  const [offlineResult, setOfflineResult] = useState<{ crop: string, disease: string, agCode: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilePick = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files || []) as File[];
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
    anchor.download = `crop-recommendation-${stamp}.txt`;
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
    setOfflineResult(null);

    const userText = input.trim() || 'Analyze crop photos and suggest recommendations.';
    const firstImage = pendingFiles.find(f => f.kind === 'image');

    // 🌑 ZERO SIGNAL PATH (OFFLINE)
    if (connectivity === 'zero') {
      const userMessageId = Date.now();
      setMessages(prev => [...prev, { id: userMessageId, sender: 'user', text: userText }]);
      setInput('');

      if (firstImage?.dataBase64) {
        try {
          // 1. Local Inference
          const prediction = await modelService.classifyImage(`data:${firstImage.mimeType};base64,${firstImage.dataBase64}`);
          
          // 2. Local Knowledge Retrieval (RAG)
          const treatment = await knowledgeService.getTreatment(prediction.crop, prediction.disease);
          const agCode = knowledgeService.generateAgCode(prediction);

          let offlineMsg = `⚡ **Offline Analysis Active**\n\n`;
          offlineMsg += `Detected: **${prediction.crop}** with **${prediction.disease}** (${Math.floor(prediction.confidence * 100)}% confidence).\n\n`;
          
          if (treatment) {
            offlineMsg += `**Symptons:** ${treatment.symptoms.join(', ')}\n\n`;
            offlineMsg += `**Recommended Treatment (Organic):** ${treatment.organic_treatment}\n\n`;
            offlineMsg += `**Agri-Code for SMS:** \`${agCode}\``;
          }

          setOfflineResult({ crop: prediction.crop, disease: prediction.disease, agCode });
          
          setMessages(prev => [...prev, {
            id: Date.now() + 1,
            sender: 'ai',
            text: offlineMsg,
            model: 'Local-Model-V1',
            isActionable: true
          }]);
          setPendingFiles([]);
        } catch (err) {
          setError("Local AI analysis failed. Please try again or wait for signal.");
        }
      } else {
        setError("Offline mode requires an image for local classification.");
      }
      setLoading(false);
      return;
    }

    // ⛅ LOW SIGNAL PATH (HYBRID)
    if (connectivity === 'low') {
        const userMessageId = Date.now();
        setMessages(prev => [...prev, { id: userMessageId, sender: 'user', text: userText }]);
        setInput('');

        if (firstImage?.dataBase64) {
            // Give instant local answer
            const prediction = await modelService.classifyImage(firstImage.dataBase64);
            const agCode = knowledgeService.generateAgCode(prediction);
            setMessages(prev => [...prev, {
              id: Date.now() + 1,
              sender: 'ai',
              text: `⛅ **Low Signal Syncing...**\n\nIdentified **${prediction.crop}** locally. Sending lightweight metadata (\`${agCode}\`) to server for expert confirmation...`,
              model: 'Local+LiteSync'
            }]);

            // Background Light Sync (No Image)
            try {
              const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: `LOW_SIGNAL_SYNC: ${agCode}. User Question: ${userText}`, category: 'recommend' }),
              });
              const data = await response.json();
              setMessages(prev => [...prev, {
                id: Date.now() + 2,
                sender: 'ai',
                text: `${data.response}\n\n*Confirmed via Cloud Expert.*`,
                model: 'Cloud-Verified'
              }]);
              setPendingFiles([]);
            } catch {
              // Fail silently, they already have the local result
            }
        }
        setLoading(false);
        return;
    }

    // ☀️ HIGH SIGNAL PATH (STANDARD)
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender: 'user',
        text: `${userText}${pendingFiles.length ? `\n\nAttached files: ${pendingFiles.map((f) => f.name).join(', ')}` : ''}`,
      },
    ]);
    setInput('');

    try {
      const docsContext = pendingFiles
        .filter(f => f.kind === 'document' && f.textContent)
        .map(f => `[Context from ${f.name}: ${f.textContent}]`)
        .join('\n');

      const fullQuery = `${userText}${docsContext ? `\n\n${docsContext}` : ''}`;

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: fullQuery,
          image_data: firstImage?.dataBase64 ? `data:${firstImage.mimeType};base64,${firstImage.dataBase64}` : null,
          category: 'recommend',
        }),
      });

      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || 'Failed to get recommendation.');

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'ai',
          text: data.response,
          model: data.category || 'Vision-Expert',
          generatedAt: new Date().toISOString(),
          isActionable: true,
        },
      ]);
      setPendingFiles([]);
    } catch (sendError: any) {
      setError(sendError.message || "Failed to connect to AI server.");
    } finally {
      setLoading(false);
    }
  };

  const handleSmsRelay = () => {
    if (!offlineResult) return;
    const smsBody = `AgriCrop Metadata: ${offlineResult.agCode}. Farmer needs help with ${offlineResult.crop} ${offlineResult.disease}.`;
    const smsUrl = `sms:?body=${encodeURIComponent(smsBody)}`;
    window.location.href = smsUrl;
  };

  const lastActionableAiId = [...messages]
    .reverse()
    .find((message) => message.sender === 'ai' && message.isActionable)?.id;

  return (
    <section className="min-h-[calc(100vh-80px)] overflow-y-auto p-4 pb-24 md:p-6 md:pb-24 lg:p-8 lg:pb-24 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-128px)] max-w-6xl flex-col rounded-3xl border border-white/10 bg-gradient-to-b from-surface/80 to-black/40 p-4 shadow-2xl backdrop-blur-xl md:p-6">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <p className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold tracking-wide text-primary">
                <Sprout className="h-3.5 w-3.5" />
                CROP RECOMMENDATION CHAT
              </p>
              {isOffline && (
                <p className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-semibold tracking-wide text-red-400 animate-pulse">
                  <Wifi className="h-3.5 w-3.5" />
                  OFFLINE MODE
                </p>
              )}
            </div>
            <h1 className="text-2xl font-bold md:text-3xl">Farmer Assistant</h1>
            <p className="mt-1 text-sm text-green-100/70">
              {isOffline 
                ? "Running on local AI models. Performance may vary but no internet is required."
                : "Ask in chat and attach crop photos or field documents for contextual recommendations."}
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
                {renderMessageAsCards(message.text)}

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
          <label className="mb-2 block text-xs font-medium text-gray-400">Ask for recommendation</label>
          <div className="flex items-end gap-2">
            <div className="flex flex-1 items-end gap-2 rounded-xl border border-white/10 bg-black/20 p-2">
              <textarea
                id="crop-recommendation-input"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                rows={2}
                placeholder="Example: Analyze this crop leaf image and suggest treatment with next irrigation plan."
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
              id="crop-recommendation-submit"
              type="submit"
              disabled={loading || (!input.trim() && pendingFiles.length === 0)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white transition-all hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send
            </button>
          </div>

          {offlineResult && isOffline && (
            <div className="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-2">
               <div className="flex gap-2 items-center">
                 <Zap className="w-5 h-5 text-green-400" />
                 <div>
                   <p className="text-xs font-bold text-white uppercase tracking-wider">Metdata Generated</p>
                   <p className="text-[10px] text-green-200/60">Ag-Code: {offlineResult.agCode}</p>
                 </div>
               </div>
               <button 
                type="button"
                onClick={handleSmsRelay}
                className="bg-green-500 hover:bg-green-400 text-black font-bold text-xs px-4 py-2 rounded-lg transition-all shadow-[0_0_15px_rgba(34,197,94,0.3)] active:scale-95"
               >
                 Send via SMS
               </button>
            </div>
          )}
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

export default CropRecommendationPage;
