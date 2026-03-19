import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Bot, User, Loader2, MessageSquare, Mic, Square, Volume2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'ai';
  category?: string;
}

const AiChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: "Namaste! I am your AgriCrop Assistant. How can I help you today?", sender: 'ai' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const navigate = useNavigate();
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const speak = (text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-IN';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await sendAudioMessage(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Mic error:", err);
      alert("Please allow microphone access to use voice chat.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const sendAudioMessage = async (blob: Blob) => {
    setIsLoading(true);
    const formData = new FormData();
    formData.append('audio', blob, 'recording.wav');
    if (user?.aadhaarCard) formData.append('aadhaar', user.aadhaarCard);

    try {
      const response = await fetch('/api/ai/audio-chat', {
        method: 'POST',
        body: formData
      });
      if (!response.ok) throw new Error('AI Service Offline');
      
      const data = await response.json();

      if (data.redirect) {
        if (data.redirect.startsWith('/')) {
          navigate(data.redirect);
        } else if (data.redirect.startsWith('http')) {
          window.open(data.redirect, '_blank');
        }
      }

      setMessages(prev => [
        ...prev, 
        { id: Date.now(), text: data.user_text, sender: 'user' },
        { id: Date.now() + 1, text: data.response, sender: 'ai', category: data.category }
      ]);

      speak(data.response);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        text: "Voice processing failed. Please ensure the AI server is running.", 
        sender: 'ai' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { id: Date.now(), text: input, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: input, aadhaar: user?.aadhaarCard || null }),
      });

      if (!response.ok) throw new Error('AI Service Offline');
      
      const data = await response.json();

      if (data.redirect) {
        if (data.redirect.startsWith('/')) {
          navigate(data.redirect);
        } else if (data.redirect.startsWith('http')) {
          window.open(data.redirect, '_blank');
        }
      }

      const aiMessage: Message = { 
        id: Date.now() + 1, 
        text: data.response, 
        sender: 'ai',
        category: data.category
      };
      setMessages(prev => [...prev, aiMessage]);
      speak(data.response);
    } catch (err: any) {
      let errorMsg = "I'm having trouble connecting right now. Please ensure the AI server is running.";
      if (err?.message?.includes('429') || err?.message?.includes('rate limit')) {
        errorMsg = "The AI model is temporarily rate-limited (free tier quota). Please wait a minute and try again.";
      }
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        text: errorMsg, 
        sender: 'ai' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all transform hover:scale-110 active:scale-95 ${
          isOpen ? 'bg-red-500 rotate-90' : 'bg-primary'
        }`}
      >
        {isOpen ? <X className="w-6 h-6 text-white" /> : <MessageSquare className="w-6 h-6 text-white" />}
      </button>

      {isOpen && (
        <div className="absolute bottom-20 right-0 w-80 sm:w-96 h-[500px] bg-[#0a0f1a]/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden animate-fade-in-up">
          <div className="p-4 border-b border-white/10 bg-primary/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Bot className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">CropWise Free AI</h3>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[10px] text-gray-400 font-medium">AUDIO READY</span>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.sender === 'user' ? 'bg-primary' : 'bg-white/10'
                  }`}>
                    {msg.sender === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-primary" />}
                  </div>
                  <div className="relative group">
                    <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                      msg.sender === 'user' 
                        ? 'bg-primary text-white rounded-tr-none shadow-lg' 
                        : 'bg-white/5 border border-white/10 text-gray-300 rounded-tl-none shadow-xl'
                    }`}>
                      {msg.text}
                    </div>
                    {msg.sender === 'ai' && (
                      <button 
                        onClick={() => speak(msg.text)}
                        title="Replay Audio"
                        className="absolute -right-10 top-2 opacity-0 group-hover:opacity-100 p-2 text-primary hover:text-white transition-all bg-white/5 rounded-full"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    )}
                    {msg.category && (
                      <span className="text-[10px] text-gray-500 uppercase tracking-tighter mt-1 block ml-1">
                        {msg.category} Insight
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex gap-3 max-w-[85%]">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                  </div>
                  <div className="p-4 bg-white/5 border border-white/10 rounded-2xl rounded-tl-none flex gap-1 items-center">
                    <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:0s]" />
                    <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} className="p-4 border-t border-white/10 bg-black/20">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                className={`p-2.5 rounded-xl transition-all shadow-lg active:scale-95 ${
                  isRecording ? 'bg-red-500 animate-pulse text-white' : 'bg-white/5 text-primary hover:bg-white/10'
                }`}
              >
                {isRecording ? <Square className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isRecording ? "Listening..." : "Ask anything..."}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary placeholder:text-gray-600 transition-all"
                disabled={isRecording}
              />
              <button 
                type="submit" 
                disabled={isLoading || isRecording || !input.trim()}
                className="bg-primary hover:bg-primary-light disabled:opacity-50 text-white p-2.5 rounded-xl transition-all shadow-lg active:scale-95"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AiChat;
