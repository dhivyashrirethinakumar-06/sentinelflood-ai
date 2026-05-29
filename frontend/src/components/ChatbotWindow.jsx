import React, { useState, useRef, useEffect, useContext } from "react";
import { MessageSquare, X, Send, Bot, ShieldAlert } from "lucide-react";
import { AppContext } from "../context/AppContext";

export default function ChatbotWindow() {
  const { language, API_BASE } = useContext(AppContext);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: language === "en" 
        ? "Hello! I am your AI Disaster Coordinator. Ask me about shelters, first-aid drowning steps, emergency helplines, or preparedness packs. How can I protect you today?"
        : "வணக்கம்! நான் உங்களின் பேரிடர் கால உதவியாளர். முகாம்கள், முதலுதவி குறிப்புகள், அவசர எண்கள் போன்ற பேரிடர் தகவல்களை என்னிடம் கேட்டு தெரிந்து கொள்ளலாம்."
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  // Sync scroll on message append
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputValue.trim();
    if (!text) return;

    if (!textToSend) setInputValue("");
    
    // Append user message
    setMessages((prev) => [...prev, { sender: "user", text }]);
    setIsTyping(true);

    try {
      const res = await fetch(`${API_BASE}/chatbot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, language })
      });

      if (res.ok) {
        const data = await res.json();
        // Delay slightly for natural chatbot pacing
        setTimeout(() => {
          setMessages((prev) => [...prev, { sender: "bot", text: data.reply }]);
          setIsTyping(false);
        }, 600);
      } else {
        throw new Error("Chatbot API offline");
      }
    } catch (e) {
      setTimeout(() => {
        setMessages((prev) => [
          ...prev, 
          { 
            sender: "bot", 
            text: language === "en" 
              ? "Connection issues detected. Standard advice: pack emergency bags, stay indoors, and call disaster response lines at 1070 immediately." 
              : "இணைய தொடர்பு தடைபட்டுள்ளது. அவசர உதவிக்கு 1070 என்ற எண்ணை உடனடியாகத் தொடர்பு கொள்ளவும்." 
          }
        ]);
        setIsTyping(false);
      }, 600);
    }
  };

  const handleTagClick = (tagKey, tagText) => {
    handleSendMessage(tagText);
  };

  const quickTags = [
    { key: "shelter", labelEn: "⛺ Shelters List", labelTa: "⛺ முகாம்கள்", txtEn: "List active emergency shelters", txtTa: "அவசர நிவாரண முகாம்கள் எங்குள்ளன?" },
    { key: "firstaid", labelEn: "🆘 First-Aid Help", labelTa: "🆘 முதலுதவி", txtEn: "Drowning first aid steps", txtTa: "நீரில் மூழ்கியவருக்கான முதலுதவி என்ன?" },
    { key: "helpline", labelEn: "📞 Emergency Nos", labelTa: "📞 அவசர எண்கள்", txtEn: "Emergency disaster helpline contacts", txtTa: "மாநில அவசர உதவி எண்கள் யாவை?" },
    { key: "tamil", labelEn: "தமிழ் உதவி", labelTa: "English Help", txtEn: "தமிழ் உதவி", txtTa: "English emergency help" }
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Expanded Chat Dialog */}
      {isOpen && (
        <div className="glass-card w-[350px] h-[480px] rounded-2xl mb-4 shadow-2xl border border-white/10 flex flex-col justify-between overflow-hidden animate-fade-in animate-slide-up">
          {/* Header */}
          <div className="bg-brand-cyan/10 px-4 py-3 flex items-center justify-between border-b border-white/5">
            <div className="flex items-center space-x-2">
              <Bot className="h-5 w-5 text-brand-cyan" />
              <div>
                <h3 className="text-xs font-black text-gray-200 tracking-wide uppercase">
                  {language === "en" ? "AI Disaster Assistant" : "செயற்கை நுண்ணறிவு உதவியாளர்"}
                </h3>
                <span className="text-[9px] font-semibold text-emerald-400 uppercase flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1 animate-pulse"></span>
                  {language === "en" ? "24/7 Active Sentinel" : "உடனடி சேவை"}
                </span>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg hover:bg-white/5 text-gray-400 hover:text-gray-200 transition-all cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Chat Messages Log */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`flex items-start space-x-2 ${msg.sender === "user" ? "flex-row-reverse space-x-reverse" : ""}`}
              >
                {msg.sender === "bot" ? (
                  <div className="p-1.5 rounded-lg bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/20 shrink-0">
                    <Bot className="h-3.5 w-3.5" />
                  </div>
                ) : null}
                <div className={`p-3 rounded-2xl text-xs font-semibold max-w-[75%] leading-relaxed ${
                  msg.sender === "user" 
                    ? "bg-brand-cyan/20 text-white border border-brand-cyan/30 rounded-tr-none ml-auto" 
                    : "bg-dark-card text-gray-200 border border-white/5 rounded-tl-none"
                }`}>
                  <p className="whitespace-pre-line">{msg.text}</p>
                </div>
              </div>
            ))}
            
            {/* Loading Typing Animation */}
            {isTyping && (
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/20 shrink-0">
                  <Bot className="h-3.5 w-3.5" />
                </div>
                <div className="bg-dark-card text-gray-200 border border-white/5 rounded-2xl rounded-tl-none p-3 max-w-[40%] flex space-x-1 justify-center items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan animate-bounce"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Tags Suggestions */}
          <div className="px-4 py-2 border-t border-white/5 flex gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-thin">
            {quickTags.map((tag) => (
              <button
                key={tag.key}
                onClick={() => handleTagClick(tag.key, language === "en" ? tag.txtEn : tag.txtTa)}
                className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-brand-cyan/10 border border-white/5 hover:border-brand-cyan/20 transition-all text-[9px] font-bold text-gray-300 hover:text-brand-cyan cursor-pointer"
              >
                {language === "en" ? tag.labelEn : tag.labelTa}
              </button>
            ))}
          </div>

          {/* Text Input Footer */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
            className="p-3 border-t border-white/5 bg-dark-bg/60 flex items-center space-x-2"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={language === "en" ? "Query safety core..." : "இங்கே தட்டச்சு செய்யவும்..."}
              className="flex-1 px-3 py-2 rounded-xl bg-dark-card border border-white/5 text-xs text-white focus:outline-none focus:border-brand-cyan/40"
            />
            <button 
              type="submit"
              className="p-2 rounded-xl bg-brand-cyan text-dark-bg font-black hover:bg-brand-cyan/85 transition-all cursor-pointer shadow-lg shadow-brand-cyan/20"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-4 rounded-full bg-gradient-to-tr from-brand-cyan to-brand-blue text-dark-bg font-black hover:scale-105 transition-all duration-300 cursor-pointer shadow-xl shadow-brand-cyan/25 flex items-center justify-center relative border border-white/20"
      >
        {isOpen ? <X className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" />}
        {/* Unread dot notification */}
        {!isOpen && (
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-dark-bg animate-ping"></span>
        )}
      </button>
    </div>
  );
}
