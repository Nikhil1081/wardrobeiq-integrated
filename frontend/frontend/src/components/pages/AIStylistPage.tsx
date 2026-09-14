import React, { useState, useRef, useEffect } from 'react';
import { useWardrobe } from '../../store/WardrobeContext';
import { apiClient } from '../../api/client';
import { RecommendationDTO, OutfitDTO, GapDTO, AIStylistResponseDTO } from '../../types/dto';
import { MatchScoreBadge } from '../common/Badge';
import {
  Sparkles,
  Send,
  User,
  Heart,
  Plus,
  Layers,
  ArrowRight,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

interface ChatMessageItem {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  recommendations?: RecommendationDTO[];
  outfits?: OutfitDTO[];
  gaps?: GapDTO[];
  timestamp: string;
}

export const AIStylistPage: React.FC = () => {
  const {
    currentCustomerId,
    currentCustomer,
    openWhyThis,
    openProductDetail,
    toggleSaveProduct,
    addClosetItem,
    savedProducts,
    setActiveTab,
  } = useWardrobe();

  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessageItem[]>([
    {
      id: 'welcome_msg',
      sender: 'assistant',
      text: `Hello ${currentCustomer?.name?.split(' ')[0] || 'there'} ✦\n\nYour closet is my canvas. I've analyzed your owned pieces and current style preferences. Tell me what you're dressing for, or ask how to complete what you already own.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [processing, setProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [activeSteps, setActiveSteps] = useState<string[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const suggestedPrompts = [
    'What should I wear today?',
    'Complete my wardrobe',
    'College outfit under ₹1500',
    'Create a party look',
    'What am I missing?',
    'Style what I already own',
  ];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, processing, currentStep]);

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = queryText || inputMessage;
    if (!textToSend.trim() || processing) return;

    const userMsgId = `user_${Date.now()}`;
    const newMessages: ChatMessageItem[] = [
      ...messages,
      {
        id: userMsgId,
        sender: 'user',
        text: textToSend,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];

    setMessages(newMessages);
    setInputMessage('');
    setProcessing(true);
    setCurrentStep('Connecting to LangGraph multi-node stylist...');
    setActiveSteps([]);

    try {
      // Use SSE Streaming for real-time progress across backend LangGraph execution
      let streamResult: AIStylistResponseDTO | null = null;

      await apiClient.streamAIStylist(
        currentCustomerId,
        textToSend,
        undefined,
        (step) => {
          setCurrentStep(step);
          setActiveSteps((prev) => (prev.includes(step) ? prev : [...prev, step]));
        },
        (result) => {
          streamResult = result;
        },
        (err) => {
          console.warn('Stream fallback to standard API call:', err);
        }
      );

      // If SSE didn't return complete result or stream failed, do standard fallback
      if (!streamResult) {
        streamResult = await apiClient.askAIStylist(currentCustomerId, textToSend);
      }

      const assistantMsg: ChatMessageItem = {
        id: `ai_${Date.now()}`,
        sender: 'assistant',
        text: streamResult.message,
        recommendations: streamResult.recommendations?.slice(0, 3),
        outfits: streamResult.outfits?.slice(0, 1),
        gaps: streamResult.gaps?.slice(0, 1),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          sender: 'assistant',
          text: `Your stylist hit a small snag: ${err?.message || 'Server error'}. Please try asking again.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setProcessing(false);
      setCurrentStep('');
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col justify-between max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-luxury-rose/30 to-luxury-lavender/20 border border-luxury-rose/40 flex items-center justify-center shadow-glow-rose">
            <Sparkles className="w-5 h-5 text-luxury-blush animate-pulse" />
          </div>
          <div>
            <h1 className="font-editorial text-2xl font-bold text-luxury-cream">
              AI Stylist Intelligence
            </h1>
            <p className="text-xs text-luxury-peach italic">&ldquo;Your closet is my canvas.&rdquo;</p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-luxury-lavender/15 text-luxury-lavender border border-luxury-lavender/30">
            LangGraph 14-Node Engine
          </span>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-xl bg-luxury-rose/20 text-luxury-blush border border-luxury-rose/30 flex items-center justify-center shrink-0 mt-1">
                  <Sparkles className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-xl rounded-2xl p-4 text-xs md:text-sm space-y-3 ${
                  isUser
                    ? 'bg-gradient-to-r from-luxury-rose/30 to-luxury-blush/20 text-luxury-cream border border-luxury-rose/40'
                    : 'glass-panel text-gray-200 border border-white/10'
                }`}
              >
                <div className="whitespace-pre-line leading-relaxed">{msg.text}</div>

                {/* Embedded Recommendations in AI Chat */}
                {msg.recommendations && msg.recommendations.length > 0 && (
                  <div className="pt-3 border-t border-white/10 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-luxury-blush block">
                      Recommended Pieces To Complete Your Closet:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {msg.recommendations.map((rec) => {
                        const isSaved = savedProducts.some((p) => p.productId === rec.productId);
                        return (
                          <div
                            key={rec.productId}
                            className="rounded-xl overflow-hidden glass-panel border border-white/10 p-2 space-y-1.5"
                          >
                            <img
                              src={rec.imageUrl}
                              alt={rec.name}
                              className="w-full aspect-square object-cover rounded-lg"
                            />
                            <div className="font-bold text-[11px] text-luxury-cream truncate">
                              {rec.name}
                            </div>
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="text-gray-300 font-mono">₹{rec.price.toLocaleString()}</span>
                              <span className="text-luxury-blush font-semibold">{rec.score}% Match</span>
                            </div>
                            <div className="flex gap-1 pt-1">
                              <button
                                type="button"
                                onClick={() => openWhyThis(rec)}
                                className="flex-1 py-1 rounded text-[9px] font-bold uppercase glass-pill hover:border-luxury-lavender/40 text-luxury-lavender"
                              >
                                Why This
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  addClosetItem({
                                    name: rec.name,
                                    category: rec.category,
                                    subcategory: rec.subcategory,
                                    color: rec.color,
                                    styleTags: rec.styleTags,
                                    occasion: rec.occasion,
                                    season: rec.season,
                                    price: rec.price,
                                    store: rec.store,
                                    imageUrl: rec.imageUrl,
                                    isCustom: false,
                                  })
                                }
                                className="p-1 rounded bg-luxury-rose/25 text-luxury-blush hover:bg-luxury-rose/35 transition-colors"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="text-[9px] text-gray-400 text-right">{msg.timestamp}</div>
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-xl bg-white/10 text-luxury-cream border border-white/10 flex items-center justify-center shrink-0 mt-1">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {/* Real-time LangGraph Processing Pipeline Visual */}
        {processing && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-xl bg-luxury-rose/20 text-luxury-blush border border-luxury-rose/30 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 animate-spin" />
            </div>
            <div className="p-4 rounded-2xl glass-panel border border-luxury-rose/30 max-w-md space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-luxury-blush">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>LangGraph Orchestration Pipeline</span>
              </div>

              <div className="space-y-1 text-xs">
                {activeSteps.map((step, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-gray-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-luxury-sage shrink-0" />
                    <span>{step}</span>
                  </div>
                ))}
                {currentStep && !activeSteps.includes(currentStep) && (
                  <div className="flex items-center gap-2 text-luxury-blush font-medium animate-pulse">
                    <div className="w-2 h-2 rounded-full bg-luxury-blush" />
                    <span>{currentStep}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Suggested Prompt Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {suggestedPrompts.map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSendMessage(prompt)}
            className="px-3 py-1.5 rounded-full text-xs glass-pill hover:border-luxury-rose/40 text-gray-300 hover:text-white whitespace-nowrap transition-all flex items-center gap-1"
          >
            <span>{prompt}</span>
            <span className="text-luxury-rose">✦</span>
          </button>
        ))}
      </div>

      {/* Input Field */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="flex items-center gap-2 p-2 rounded-2xl glass-panel-elevated border border-white/10"
      >
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Ask for an outfit, suggest what to buy, or explore monsoon styling..."
          className="flex-1 bg-transparent px-4 py-2 text-xs md:text-sm text-luxury-cream placeholder-gray-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!inputMessage.trim() || processing}
          className="p-2.5 rounded-xl bg-gradient-to-r from-luxury-rose to-luxury-blush text-dark-950 hover:opacity-90 disabled:opacity-40 transition-all cursor-pointer shadow-glow-rose"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
