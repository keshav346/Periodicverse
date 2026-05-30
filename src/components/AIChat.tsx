import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, Sparkles, Upload, X, Copy, Check, Volume2, VolumeX } from "lucide-react";
import Markdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import "katex/dist/katex.min.css";
import { ElementData } from "../types";
import Atom3D from "./Atom3D";
import ReactionVisualizer from "./ReactionVisualizer";

const MessageContext = React.createContext({ isStreaming: false, messageId: "" });

const getExecutedActions = (): Set<string> => {
  try {
    return new Set(JSON.parse(localStorage.getItem('executed_actions_v2') || '[]'));
  } catch {
    return new Set<string>();
  }
};

const saveExecutedAction = (id: string) => {
  const actions = getExecutedActions();
  actions.add(id);
  localStorage.setItem('executed_actions_v2', JSON.stringify([...actions]));
};

function ActionExecutor({ actions }: { actions: any[] }) {
  const { isStreaming, messageId } = React.useContext(MessageContext);

  useEffect(() => {
    const executedActions = getExecutedActions();
    if (executedActions.has(messageId)) return;
    saveExecutedAction(messageId);


    const runActions = async () => {
      for (const action of actions) {
         try {
           if (action.type === "highlight") {
              const els = document.querySelectorAll(action.selector);
              els.forEach(el => {
                 el.classList.add("ai-highlight");
                 // Force reflow
                 void (el as HTMLElement).offsetWidth;
                 setTimeout(() => el.classList.remove("ai-highlight"), 3000);
              });
           } else if (action.type === "click") {
              const el = document.querySelector(action.selector) as HTMLElement;
              el?.click();
           } else if (action.type === "set_input") {
              const el = document.querySelector(action.selector) as HTMLInputElement;
              if (el) {
                 const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                   window.HTMLInputElement.prototype,
                   "value"
                 )?.set;
                 nativeInputValueSetter?.call(el, action.value);
                 el.dispatchEvent(new Event("input", { bubbles: true }));
                 el.dispatchEvent(new Event("change", { bubbles: true }));
              }
           } else if (action.type === "playground") {
              window.dispatchEvent(new CustomEvent('ai-playground', { detail: action }));
           } else if (action.type === "navigate") {
              window.dispatchEvent(new CustomEvent('ai-navigate', { detail: action.target }));
           } else if (action.type === "select_category") {
              window.dispatchEvent(new CustomEvent('ai-category', { detail: action.value }));
           } else if (action.type === "search") {
              window.dispatchEvent(new CustomEvent('ai-search', { detail: action.value }));
           } else if (action.type === "select_element") {
              window.dispatchEvent(new CustomEvent('ai-select-element', { detail: action.value }));
           } else if (action.type === "wait") {
              const delay = action.duration || action.ms || 1000;
              await new Promise(r => setTimeout(r, delay));
           }
         } catch (e) {
           console.warn("AI UI Automation failed for step", action, e);
         }
         await new Promise(r => setTimeout(r, 200)); // Small delay between actions so view updates
      }
    };
    runActions();
  }, [actions]);
  return <div className="text-[10px] text-[#33ccff] italic my-2 p-2 border border-[#33ccff]/30 bg-black/50 rounded flex items-center gap-2 w-fit">
    <Sparkles size={12} className="animate-pulse" />
    EXECUTING UI AUTOMATION...
  </div>;
}

export default function AIChat({
  contextName,
  title = "AI INTERFACE",
  hidePresets = false,
  persistKey,
  elements = [],
}: {
  contextName: string;
  title?: string;
  hidePresets?: boolean;
  persistKey?: string;
  elements?: ElementData[];
}) {
  const [messages, setMessages] = useState<
    {
      id: string;
      role: "user" | "ai";
      text: string;
      reasoning?: string;
      showReasoning?: boolean;
      image?: string;
    }[]
  >(() => {
    if (persistKey) {
      const saved = localStorage.getItem(`aichat_${persistKey}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map((m: any) => ({
          ...m,
          id: m.id || Math.random().toString(36).slice(2)
        }));
      }
    }
    return [
      { id: Date.now().toString(), role: "ai", text: `SYSTEM ONLINE. QUERIES FOR ${contextName} READY.` },
    ];
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<"mimo" | "gemini">("mimo");
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const ttsEnabledRef = useRef(ttsEnabled);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ttsEnabledRef.current = ttsEnabled;
  }, [ttsEnabled]);

  const getHexForCategory = (cat: string) => {
    if (cat.includes("alkali metal")) return "#ff4d4d";
    if (cat.includes("alkaline earth metal")) return "#ff9933";
    if (cat.includes("transition metal")) return "#ffd633";
    if (cat.includes("post-transition metal")) return "#99ff33";
    if (cat.includes("metalloid")) return "#33ccff";
    if (
      cat.includes("polyatomic nonmetal") ||
      cat.includes("diatomic nonmetal")
    )
      return "#00ff9d";
    if (cat.includes("noble gas")) return "#b366ff";
    if (cat.includes("actinide")) return "#ff33cc";
    if (cat.includes("lanthanide")) return "#ff66cc";
    return "#cccccc";
  };

  useEffect(() => {
    if (persistKey) {
      localStorage.setItem(`aichat_${persistKey}`, JSON.stringify(messages));
    }
  }, [messages, persistKey]);

  useEffect(() => {
    if (!persistKey) {
      setMessages([
        {
          id: Date.now().toString(),
          role: "ai",
          text: `SYSTEM ONLINE. QUERIES FOR ${contextName} READY.`,
        },
      ]);
      setInput("");
      setImage(null);
    }
  }, [contextName, persistKey]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const streamPrompt = async (
    displayMessage: string,
    apiMessage: string,
    useImage: boolean = false,
  ) => {
    window.speechSynthesis.cancel();
    const currentImage = useImage ? image : null;
    if (useImage) {
      setImage(null);
    }

    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), role: "user", text: displayMessage, image: currentImage },
    ]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: apiMessage,
          context: `${contextName}`,
          image: currentImage,
          aiModel: selectedModel,
        }),
      });

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");

      let currentResponse = { id: Date.now().toString(), role: "ai" as const, text: "", reasoning: "" };
      let started = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.trim() === "data: [DONE]") break;
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.substring(6));
              if (data.error) throw new Error(data.error);

              currentResponse.text += data.text || "";
              currentResponse.reasoning += data.reasoning || "";

              if (!started) {
                setMessages((prev) => [...prev, { ...currentResponse }]);
                started = true;
              } else {
                setMessages((prev) => {
                  const newMsgs = [...prev];
                  newMsgs[newMsgs.length - 1] = { ...currentResponse };
                  return newMsgs;
                });
              }
            } catch (e) {}
          }
        }
      }

      if (ttsEnabledRef.current && currentResponse.text) {
        window.speechSynthesis.cancel();
        // Super basic cleanup so it doesn't speak markdown syntax loudly
        const cleanText = currentResponse.text
          .replace(/```[\s\S]*?```/g, "")
          .replace(/[*#]/g, "")
          .trim();
        if (cleanText) {
          const utterance = new SpeechSynthesisUtterance(cleanText);
          window.speechSynthesis.speak(utterance);
        }
      }
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "ai",
          text: `ERROR: ${e.message || "Failed to generate response"}`,
        },
      ]);
    }
    setLoading(false);
  };

  const handleSend = async () => {
    if (!input.trim() && !image) return;
    const msg = input.trim() || "[Attached Image]";
    setInput("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    await streamPrompt(msg, msg, true);
  };

  const explainLike10 = async () => {
    await streamPrompt(
      "Provide a simple overview.",
      "Explain it like I am 10 years old. Use fun analogies and keep it under 3 short paragraphs. Highlight its real-world usage.",
    );
  };

  const MarkdownComponents = React.useMemo(
    () => ({
      code({ node, className, children, ...props }: any) {
        const { isStreaming, messageId } = React.useContext(MessageContext);
        const match = /language-(\w+)/.exec(className || "");
        const inline = !match;

        if (!inline && match && match[1] === "element") {
          if (isStreaming) {
            return (
              <div className="my-4 h-64 border border-white/20 bg-[#050505] relative rounded flex items-center justify-center font-mono text-[10px] text-white">
                <div className="animate-pulse">STREAMING 3D DATA...</div>
              </div>
            );
          }
          const symbolOrNum = String(children).replace(/\n$/, "").trim();
          const el = elements?.find(
            (e: any) =>
              e.symbol.toLowerCase() === symbolOrNum.toLowerCase() ||
              e.number.toString() === symbolOrNum,
          );
          if (el) {
            const hex = getHexForCategory(el.category);
            return (
              <div className="my-4 h-64 border border-white/20 bg-[#050505] relative rounded overflow-hidden flex flex-col not-prose block">
                <div className="flex-1 relative w-full h-full min-h-[200px]">
                  <Atom3D shells={el.shells} color={hex} modelType="bohr" />
                </div>
                <div className="absolute top-2 left-2 pointer-events-none z-10 text-[10px] font-bold tracking-widest px-2 py-1 bg-black/50 border border-white/10 backdrop-blur-sm">
                  {el.name.toUpperCase()} ({el.symbol})
                </div>
              </div>
            );
          }
        }

        if (!inline && match && match[1] === "action") {
          if (isStreaming) {
            return (
              <div className="my-4 h-16 border border-white/20 bg-[#050505] relative rounded flex items-center justify-center font-mono text-[10px] text-white">
                <div className="animate-pulse flex items-center gap-2">
                   <Sparkles size={12} className="text-[#33ccff]" /> PLANNING AUTOMATION...
                </div>
              </div>
            );
          }
          try {
             const extractText = (node: any): string => {
               if (typeof node === 'string') return node;
               if (typeof node === 'number') return String(node);
               if (Array.isArray(node)) return node.map(extractText).join('');
               if (node && node.props && node.props.children) return extractText(node.props.children);
               return '';
             };
             const textContent = extractText(children);
             const actions = JSON.parse(textContent.trim());
             return <ActionExecutor actions={actions} />;
          } catch(e) {
             console.error("Failed to parse AI action JSON:", e, children);
             return <div className="text-red-500 text-[10px] italic my-2">UI AUTOMATION FAILED: Invalid JSON format</div>;
          }
        }

        if (!inline && match && match[1] === "reaction") {
          if (isStreaming) {
            return (
              <div className="my-4 h-64 border border-white/20 bg-[#050505] relative rounded flex items-center justify-center font-mono text-[10px] text-white">
                <div className="animate-pulse">STREAMING KINETIC MODEL...</div>
              </div>
            );
          }
          const symbolsStr = String(children).replace(/\n$/, "").trim();
          const symbols = symbolsStr.split(",").map((s) => s.trim());
          const reactantsToPass = symbols
            .map((sym) => {
              return elements?.find(
                (e) =>
                  e.symbol.toLowerCase() === sym.toLowerCase() ||
                  e.number.toString() === sym,
              );
            })
            .filter(Boolean) as ElementData[];

          if (reactantsToPass.length > 0) {
            return (
              <div className="my-4 h-64 border border-white/20 bg-[#050505] relative rounded overflow-hidden flex flex-col not-prose block font-mono">
                <div className="flex-1 relative w-full h-full min-h-[200px]">
                  <React.Suspense
                    fallback={
                      <div className="text-white text-xs p-4 flex items-center justify-center h-full">
                        INITIALIZING 3D RENDER...
                      </div>
                    }
                  >
                    <ReactionVisualizer
                      reactants={reactantsToPass}
                      reactionOccurred={true}
                      temperature={298}
                    />
                  </React.Suspense>
                </div>
                <div className="absolute bottom-2 left-0 right-0 pointer-events-none z-10 flex justify-center">
                  <div className="px-3 py-1 bg-black/80 backdrop-blur-md border border-[#00ff9d]/30 text-[#00ff9d] text-[10px] tracking-widest font-bold rounded shadow-lg uppercase">
                    BOND VISUALIZATION: {symbols.join(" + ")}
                  </div>
                </div>
              </div>
            );
          }
        }

        return (
          <code className={className} {...props}>
            {children}
          </code>
        );
      },
    }),
    [elements],
  );

  return (
    <div className="flex flex-col h-full bg-[#050505] border border-white/20 overflow-hidden font-mono text-[10px]">
      <div className="p-3 border-b border-white/20 bg-[#0a0a0a] flex flex-wrap gap-2 justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Sparkles size={12} className="text-[#33ccff]" />
            <h3 className="font-bold text-white tracking-widest">{title}</h3>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setMessages([
                  {
                    id: Date.now().toString(),
                    role: "ai",
                    text: `SYSTEM ONLINE. QUERIES FOR ${contextName} READY.`,
                  },
                ]);
                if (persistKey) {
                  localStorage.removeItem(`aichat_${persistKey}`);
                }
              }}
              className="px-2 py-1 bg-[#111] hover:bg-white/10 border border-white/20 transition-colors uppercase tracking-widest text-white font-bold text-[8px]"
            >
              NEW CHAT
            </button>
            <div className="flex bg-[#111] border border-white/20 text-[8px] tracking-widest font-bold">
              <button
                onClick={() => setSelectedModel("mimo")}
                className={`px-2 py-1 transition-colors ${selectedModel === "mimo" ? "bg-white text-black" : "text-white hover:bg-white/10"}`}
              >
                MIMO
              </button>
              <button
                onClick={() => setSelectedModel("gemini")}
                className={`px-2 py-1 transition-colors border-l border-white/20 ${selectedModel === "gemini" ? "bg-white text-black" : "text-white hover:bg-white/10"}`}
              >
                GEMINI
              </button>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {!hidePresets && (
            <>
              <button
                onClick={() =>
                  streamPrompt(
                    "Retrieve isotope data.",
                    "Tell me about its stable and radioactive isotopes in one short paragraph. Keep it very brief and technical.",
                  )
                }
                disabled={loading}
                className="px-2 py-1 bg-[#111] hover:bg-white/10 border border-white/20 transition-colors uppercase tracking-widest text-[#888] disabled:opacity-50"
              >
                ISOTOPES
              </button>
              <button
                onClick={explainLike10}
                disabled={loading}
                className="px-2 py-1 bg-[#111] hover:bg-white/10 border border-white/20 transition-colors uppercase tracking-widest text-[#888] disabled:opacity-50"
              >
                SIMPLIFIED
              </button>
            </>
          )}
          <button
             onClick={() => {
               setTtsEnabled(!ttsEnabled);
               if (ttsEnabled) window.speechSynthesis.cancel();
             }}
             title={ttsEnabled ? 'Disable AI Voice' : 'Enable AI Voice'}
             className={`px-2 py-1 bg-[#111] border border-white/20 flex items-center justify-center transition-colors ${ttsEnabled ? 'text-[#33ccff] bg-white/10' : 'text-[#888] hover:bg-white/10'}`}
          >
             {ttsEnabled ? <Volume2 size={12} /> : <VolumeX size={12} />}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => {
          const isStreaming = loading && i === messages.length - 1;
          return (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            key={i}
            className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
          >
            <div className="flex items-center gap-2 mb-1 w-full max-w-[85%]">
              <span className={`text-[8px] text-[#666] font-bold ${m.role === "user" ? "ml-auto" : "mr-auto"}`}>
                {m.role === "user" ? "USER" : "SYSTEM"}
              </span>
              <CopyButton text={m.text} />
            </div>
            <div
              className={`max-w-[85%] border px-3 py-2 leading-relaxed flex flex-col ${m.role === "user" ? "bg-[#111] border-white/20 text-white" : "bg-transparent border-[#33ccff]/30 text-[#e0fcfc]"}`}
            >
              {m.image && (
                <img
                  src={m.image}
                  alt="User upload"
                  className="max-h-48 object-contain mb-2 border border-white/20"
                />
              )}
              {m.reasoning && (
                <div className="mb-2 border-b border-[#33ccff]/30 pb-2">
                  <button
                    onClick={() => {
                      const newMsgs = [...messages];
                      newMsgs[i].showReasoning = !newMsgs[i].showReasoning;
                      setMessages(newMsgs);
                    }}
                    className="text-[8px] text-[#33ccff] font-bold tracking-widest hover:text-white transition-colors flex items-center gap-1"
                  >
                    {m.showReasoning
                      ? "[-] HIDE REASONING"
                      : "[+] SHOW REASONING"}
                  </button>
                  {m.showReasoning && (
                    <div className="mt-2 text-slate-400 text-[9px] italic whitespace-pre-wrap">
                      {m.reasoning}
                    </div>
                  )}
                </div>
              )}
              <div className="prose prose-invert prose-p:my-1 prose-headings:my-2 prose-sm max-w-none text-current">
                <MessageContext.Provider value={{ isStreaming, messageId: m.id }}>
                  <Markdown
                    remarkPlugins={[remarkMath, remarkGfm]}
                    rehypePlugins={[rehypeKatex]}
                    components={MarkdownComponents}
                  >
                    {m.text}
                  </Markdown>
                </MessageContext.Provider>
              </div>
            </div>
          </motion.div>
        )})}
        {loading && (
          <div className="flex justify-start flex-col items-start">
            <span className="text-[8px] text-[#666] mb-1 font-bold">
              SYSTEM
            </span>
            <div className="bg-transparent border border-white/20 px-3 py-2 flex justify-center space-x-1">
              <div className="w-1 h-1 bg-[#33ccff] animate-ping"></div>
            </div>
          </div>
        )}
      </div>

      {image && (
        <div className="p-2 border-t border-white/20 bg-[#0a0a0a] flex items-center gap-4 relative">
          <img
            src={image}
            className="h-16 object-contain border border-white/20"
            alt="Preview"
          />
          <span className="text-[10px] text-slate-400">MEDIA ATTACHED</span>
          <button
            onClick={() => setImage(null)}
            className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-white/20 transition-colors text-white"
          >
            <X size={12} />
          </button>
        </div>
      )}

      <div className="p-3 border-t border-white/20 bg-[#0a0a0a] flex gap-2">
        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileUpload}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-3 py-2 bg-[#111] text-slate-400 hover:text-white hover:bg-white/10 border border-white/20 transition-colors"
        >
          <Upload size={14} />
        </button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="INPUT QUERY STRINGS..."
          className="flex-1 bg-[#050505] border border-white/20 px-3 py-2 focus:outline-none focus:border-white transition-colors uppercase placeholder-slate-600 text-white min-w-0"
        />
        <button
          onClick={handleSend}
          disabled={loading || (!input.trim() && !image)}
          className="px-4 py-2 bg-white text-black hover:bg-slate-200 disabled:opacity-50 disabled:bg-[#333] transition-colors flex items-center justify-center font-bold"
        >
          <Send size={12} />
        </button>
      </div>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      title="Copy message"
      className="ml-2 text-slate-500 hover:text-white transition-colors p-1"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
    </button>
  );
}
