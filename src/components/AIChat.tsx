import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Send, Sparkles } from 'lucide-react';

export default function AIChat({ contextName }: { contextName: string }) {
  const [messages, setMessages] = useState<{role: 'user'|'ai', text: string}[]>([
    { role: 'ai', text: `Hi! I'm PeriodicVerse AI. Ask me anything about ${contextName}.` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMessages([
      { role: 'ai', text: `Hi! I'm PeriodicVerse AI. Ask me anything about ${contextName}.` }
    ]);
    setInput('');
  }, [contextName]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const msg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: msg }]);
    setLoading(true);
    
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, context: `Element: ${contextName}` })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setMessages(prev => [...prev, { role: 'ai', text: data.text }]);
    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'ai', text: `Error: ${e.message}` }]);
    }
    setLoading(false);
  };

  const explainLike10 = async () => {
    setLoading(true);
    setMessages(prev => [...prev, { role: 'user', text: "Explain this like I'm 10." }]);
    try {
      const res = await fetch('/api/explain10', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ element: contextName })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setMessages(prev => [...prev, { role: 'ai', text: data.text }]);
    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'ai', text: `Error: ${e.message}` }]);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/50 rounded-xl border border-white/10 overflow-hidden">
      <div className="p-3 border-b border-white/10 bg-black/20 flex flex-wrap gap-2 justify-between items-center">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-blue-400" />
          <h3 className="font-medium text-sm text-blue-100">AI Tutor</h3>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => {
              setLoading(true);
              setMessages(prev => [...prev, { role: 'user', text: "Tell me about its stable and radioactive isotopes." }]);
              fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: "Tell me about its stable and radioactive isotopes in one short paragraph.", context: `Element: ${contextName}` })
              }).then(res => res.json()).then(data => {
                if (data.error) throw new Error(data.error);
                setMessages(prev => [...prev, { role: 'ai', text: data.text }]);
              }).catch(e => setMessages(prev => [...prev, { role: 'ai', text: `Error: ${e.message}` }])).finally(() => setLoading(false));
            }}
            disabled={loading}
            className="text-[10px] sm:text-xs px-2 py-1 bg-white/5 hover:bg-white/10 rounded border border-white/10 transition-colors pointer-events-auto"
          >
            Isotopes
          </button>
          <button 
            onClick={explainLike10}
            disabled={loading}
            className="text-[10px] sm:text-xs px-2 py-1 bg-white/5 hover:bg-white/10 rounded border border-white/10 transition-colors pointer-events-auto"
          >
            Explain like I'm 10
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm custom-scrollbar">
        {messages.map((m, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            key={i} 
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] rounded-lg p-3 ${m.role === 'user' ? 'bg-blue-600/50 text-white' : 'bg-slate-800 text-blue-50'} shadow-md backdrop-blur-sm`}>
              {m.text}
            </div>
          </motion.div>
        ))}
        {loading && (
          <div className="flex justify-start">
             <div className="bg-slate-800 rounded-lg p-3 w-16 flex justify-center space-x-1">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '100ms'}}></div>
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '200ms'}}></div>
             </div>
          </div>
        )}
      </div>

      <div className="p-2 sm:p-3 border-t border-white/10 bg-black/20 flex gap-2">
        <input 
          type="text" 
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Ask a question..."
          className="flex-1 bg-black/30 border border-white/10 rounded-lg px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm focus:outline-none focus:border-blue-500 transition-colors"
        />
        <button 
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="px-3 py-1.5 sm:p-2 bg-blue-600/80 hover:bg-blue-600 text-white rounded-lg disabled:opacity-50 transition-colors flex items-center justify-center"
        >
          <Send size={14} className="sm:w-4 sm:h-4" />
        </button>
      </div>
    </div>
  );
}
