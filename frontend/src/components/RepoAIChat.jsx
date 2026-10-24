import { useState, useRef, useEffect, useContext } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Bot, MessageSquare, Send, X, Maximize2, Minimize2,
  Copy, Check, Sparkles, Trash2, Terminal, Code2,
  RotateCcw, Shield, Cpu, Layers, HelpCircle, ChevronDown,
  GitBranch, Workflow, Filter, Activity
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import MermaidRenderer from './MermaidRenderer';

const SUGGESTED_PROMPTS = [
  { label: 'Architecture Flowchart', icon: GitBranch, prompt: 'Generate an interactive Mermaid flowchart (using ```mermaid ... ```) showing the architecture and module relationships of this repository.' },
  { label: 'Call Stack Sequence', icon: Workflow, prompt: 'Generate an interactive Mermaid sequence diagram (using ```mermaid ... ```) showing the execution call stack and component interactions.' },
  { label: 'Explain Architecture', icon: Layers, prompt: 'Explain the high-level architecture and structure of this repository.' },
  { label: 'Security & Risks', icon: Shield, prompt: 'What security vulnerabilities, sensitive areas, or risks should I be aware of in this codebase?' },
  { label: 'Performance Audit', icon: Cpu, prompt: 'Analyze potential performance bottlenecks and memory hotspots in this repository.' },
  { label: 'How to Run & Deploy', icon: Terminal, prompt: 'How do I build, test, and deploy this project? What are the key entry points?' },
];

export default function RepoAIChat({
  repoId = 'demo',
  repoName = 'Repository',
  selectedFile = null,
  contextData = null
}) {
  const { token } = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hello! I am **CodeAtlas AI**, powered by Groq. I have analyzed this repository graph and files.\n\nAsk me anything about the **architecture**, **dependencies**, **security**, or click one of the quick prompts below to get started!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      inputRef.current?.focus();
    }
  }, [isOpen, messages]);

  const handleSend = async (textToSend) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const userMessage = {
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Build contextual prompt including selected file if any
      const enhancedPrompt = selectedFile
        ? `[Focused file: ${selectedFile.label || selectedFile.id} (${selectedFile.data?.path || ''})]\n\n${query}`
        : query;

      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE_URL}/api/repo/chat/${repoId || 'demo'}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          prompt: enhancedPrompt,
          context: contextData || undefined
        })
      });

      const data = await res.json();
      const botReply = data.answer || 'I could not generate a response. Please verify that your backend and GROQ_API_KEY are configured.';

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: botReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: '⚠️ **Connection Error**: Unable to communicate with the CodeAtlas AI backend. Please check your network connection.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const clearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: `Conversation cleared. How can I help you analyze **${repoName}**?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        id="codeatlas-ai-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle CodeAtlas AI Chat"
        className={`fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 rounded-full font-medium shadow-2xl transition-all duration-300 ${
          isOpen
            ? 'bg-slate-800 text-slate-200 border border-white/20 scale-95'
            : 'bg-gradient-to-r from-orange-500 via-amber-500 to-rose-500 text-white hover:scale-105 shadow-[0_0_30px_rgba(249,115,22,0.45)]'
        }`}
      >
        <div className="relative">
          <Bot size={20} className={isOpen ? 'text-orange-400' : 'text-white'} />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-900 animate-pulse" />
        </div>
        <span className="text-sm font-semibold tracking-wide">
          {isOpen ? 'Close AI' : 'Ask AI'}
        </span>
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div
          id="codeatlas-ai-window"
          className={`fixed z-50 transition-all duration-300 ease-out flex flex-col overflow-hidden border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.8)] backdrop-blur-2xl bg-slate-950/90 rounded-2xl ${
            isExpanded
              ? 'bottom-20 right-6 w-[700px] max-w-[calc(100vw-3rem)] h-[750px] max-h-[calc(100vh-7rem)]'
              : 'bottom-20 right-6 w-[430px] max-w-[calc(100vw-2rem)] h-[560px] max-h-[calc(100vh-7rem)]'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent border-b border-white/10 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
                <Bot size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white tracking-wide">CodeAtlas AI</span>
                  <span className="px-1.5 py-0.5 text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md">
                    Groq LLaMA
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 truncate max-w-[220px]">
                  {selectedFile ? `Focus: ${selectedFile.label || selectedFile.id}` : repoName}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 text-slate-400">
              <button
                onClick={clearChat}
                title="Clear Chat History"
                className="p-1.5 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                <Trash2 size={15} />
              </button>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? 'Restore Size' : 'Expand View'}
                className="p-1.5 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                {isExpanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close Chat"
                className="p-1.5 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar text-sm">
            {messages.map((msg, index) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={index}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} group`}
                >
                  <div className="flex items-center gap-2 mb-1 px-1 text-[11px] text-slate-500">
                    <span>{isUser ? 'You' : 'CodeAtlas AI'}</span>
                    <span>•</span>
                    <span>{msg.timestamp}</span>
                  </div>

                  <div
                    className={`relative rounded-2xl px-4 py-3 max-w-[90%] leading-relaxed break-words ${
                      isUser
                        ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-tr-none shadow-md'
                        : 'bg-slate-900/90 text-slate-200 border border-white/10 rounded-tl-none shadow-sm'
                    }`}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <div className="markdown-prose prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:p-0 prose-pre:bg-transparent">
                        <ReactMarkdown
                          components={{
                            p({ children }) {
                              return <div className="mb-2 leading-relaxed">{children}</div>;
                            },
                            code({ node, inline, className, children, ...props }) {
                              const match = /language-(\w+)/.exec(className || '');
                              const lang = match ? match[1].toLowerCase() : '';
                              if (lang === 'mermaid') {
                                return <MermaidRenderer chart={String(children)} />;
                              }
                              return !inline ? (
                                <div className="my-2 rounded-lg bg-black/60 border border-white/10 overflow-hidden font-mono text-xs">
                                  <div className="flex items-center justify-between px-3 py-1.5 bg-white/5 border-b border-white/5 text-slate-400 text-[10px]">
                                    <span>{lang || 'code'}</span>
                                    <button
                                      onClick={() => navigator.clipboard.writeText(String(children))}
                                      className="hover:text-white transition-colors"
                                    >
                                      Copy
                                    </button>
                                  </div>
                                  <pre className="p-3 overflow-x-auto text-emerald-300">
                                    <code>{children}</code>
                                  </pre>
                                </div>
                              ) : (
                                <code className="px-1.5 py-0.5 rounded bg-white/10 text-orange-300 font-mono text-[12px]" {...props}>
                                  {children}
                                </code>
                              );
                            },
                            table({ children }) {
                              return (
                                <div className="my-2 overflow-x-auto rounded-lg border border-white/10">
                                  <table className="min-w-full divide-y divide-white/10 text-xs">
                                    {children}
                                  </table>
                                </div>
                              );
                            },
                            th({ children }) {
                              return <th className="px-2.5 py-1.5 bg-white/5 text-left font-semibold text-slate-300">{children}</th>;
                            },
                            td({ children }) {
                              return <td className="px-2.5 py-1.5 border-t border-white/5 text-slate-300">{children}</td>;
                            }
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    )}

                    {/* Copy action on assistant message */}
                    {!isUser && (
                      <button
                        onClick={() => copyToClipboard(msg.content, index)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity absolute -right-8 top-2 p-1 text-slate-400 hover:text-white bg-slate-800 border border-white/10 rounded-md"
                        title="Copy Response"
                      >
                        {copiedIndex === index ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex flex-col items-start space-y-1">
                <div className="text-[11px] text-slate-500 px-1">CodeAtlas AI is thinking...</div>
                <div className="bg-slate-900 border border-white/10 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-400 animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 rounded-full bg-rose-400 animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Quick Prompts */}
          <div className="px-3 py-2 bg-slate-900/60 border-t border-white/5 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
              <Sparkles size={11} className="text-amber-400" /> Prompts:
            </span>
            {SUGGESTED_PROMPTS.map((item, idx) => {
              const Icon = item.icon;
              return (
                <button
                  key={idx}
                  onClick={() => handleSend(item.prompt)}
                  disabled={loading}
                  className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 hover:border-orange-500/30 text-xs text-slate-300 hover:text-white transition-all disabled:opacity-50"
                >
                  <Icon size={12} className="text-orange-400" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Input Footer */}
          <div className="p-3 bg-slate-950 border-t border-white/10 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="relative flex items-center"
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder={selectedFile ? `Ask about ${selectedFile.label}...` : 'Ask anything about this repo...'}
                className="w-full bg-slate-900/90 text-slate-200 placeholder-slate-500 text-sm rounded-xl pl-3.5 pr-12 py-2.5 border border-white/10 focus:border-orange-500/60 focus:outline-none focus:ring-1 focus:ring-orange-500/40 resize-none transition-all"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                aria-label="Send Message"
                className="absolute right-2 p-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-white disabled:opacity-40 disabled:from-slate-700 disabled:to-slate-700 hover:scale-105 active:scale-95 transition-all"
              >
                <Send size={14} />
              </button>
            </form>
            <div className="flex items-center justify-between mt-1.5 px-1 text-[10px] text-slate-500">
              <span>Press <kbd className="font-mono bg-white/5 px-1 py-0.5 rounded text-slate-400">Enter</kbd> to send, <kbd className="font-mono bg-white/5 px-1 py-0.5 rounded text-slate-400">Shift+Enter</kbd> for newline</span>
              <span className="text-emerald-400/80 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                Groq Ultra-Fast
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
