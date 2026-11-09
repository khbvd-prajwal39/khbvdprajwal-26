import { t } from '@/i18n/translations';
import { isHealthRelated, generateAssistantResponse } from '@/data/tiers';
import type { LanguageCode, Doctor, TierInfo, ChatMessage } from '@/types';
import {
  ArrowLeft, Send, Paperclip, Mic, Image, FileText, X, Circle, BadgeCheck, Star, MicOff, LockKeyhole, MessageSquare, Clock3
} from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';

interface SpeechRecognitionEventLike {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

interface SpeechRecognitionWindow extends Window {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
}

interface Props {
  lang: LanguageCode;
  doctor: Doctor;
  tier: TierInfo;
  chiefComplaint: string;
  symptomDuration: string;
  onBack: () => void;
  onEnd: () => void;
}

const PRESCRIPTION_KEYWORDS = ['prescription', 'prescribe', 'medicine', 'medication', 'tablet', 'tablet name', 'dose', 'dosage', 'syrup', 'cream', 'ointment', 'rx'];

function isPrescriptionRequest(text: string): boolean {
  const lower = text.toLowerCase();
  return PRESCRIPTION_KEYWORDS.some(kw => lower.includes(kw));
}

export default function ChatScreen({ lang, doctor, tier, chiefComplaint, symptomDuration, onBack, onEnd }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: t(lang, 'welcomeMsg'),
      createdAt: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [showAttachments, setShowAttachments] = useState(false);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isDoctorReplied, setIsDoctorReplied] = useState(false);
  const [blockedNotice, setBlockedNotice] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const maxTexts = tier.texts ?? 0;
  const textsRemaining = Math.max(0, maxTexts - messageCount);
  const canSend = maxTexts === 0 || textsRemaining > 0;

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setMessages(previous => [...previous, {
        id: `doctor-${Date.now()}`,
        role: 'assistant',
        content: `Thank you for sharing that you have ${chiefComplaint.toLowerCase()} for ${symptomDuration.toLowerCase()}. I have reviewed your opening notes and you can now send follow-up questions here.`,
        createdAt: new Date().toISOString(),
      }]);
      setIsDoctorReplied(true);
    }, 2200);
    return () => window.clearTimeout(timer);
  }, [chiefComplaint, symptomDuration]);

  const handleSend = () => {
    if (!isDoctorReplied || !canSend) return;
    const text = input.trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      attachmentUrl: attachments.length > 0 ? attachments[0] : undefined,
      createdAt: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setAttachments([]);

    if (!isHealthRelated(text)) {
      setBlockedNotice(true);
      setTimeout(() => {
        const blockedMsg: ChatMessage = {
          id: `msg-${Date.now()}-blocked`,
          role: 'assistant',
          content: t(lang, 'blockedTopic'),
          createdAt: new Date().toISOString(),
        };
        setMessages(prev => [...prev, blockedMsg]);
        setBlockedNotice(false);
      }, 800);
      return;
    }

    setBlockedNotice(false);
    const newCount = messageCount + 1;
    setMessageCount(newCount);
    const wantsPrescription = isPrescriptionRequest(text);
    const remainingAfter = maxTexts - newCount;

    if (remainingAfter <= 0) {
      setTimeout(() => {
        const limitMsg: ChatMessage = {
          id: `msg-${Date.now()}-limit`,
          role: 'assistant',
          content: `You have used all ${maxTexts} text messages included in this plan. You can choose another plan for additional messages.`,
          createdAt: new Date().toISOString(),
        };
        setMessages(prev => [...prev, limitMsg]);
      }, 1200);
      return;
    }

    setTimeout(() => {
      const replyContent = wantsPrescription
        ? 'I cannot provide or invent a prescription. Medication decisions require a licensed clinician to review your symptoms and medical history.'
        : generateAssistantResponse(text);

      const reply: ChatMessage = {
        id: `msg-${Date.now()}-reply`,
        role: 'assistant',
        content: replyContent,
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, reply]);
    }, 900);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      setAttachments(prev => [...prev, file.name]);
    });
    setShowAttachments(false);
    e.target.value = '';
  };

  const toggleVoice = () => {
    const speechWindow = window as SpeechRecognitionWindow;
    const SpeechRecognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setInput(prev => prev + (prev ? ' ' : '') + '[Voice input is not available in this browser. Please type your message.]');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    setIsListening(true);
    try {
      const recognition = new SpeechRecognition();
      recognition.lang = lang === 'en' ? 'en-US' : lang === 'hi' ? 'hi-IN' : lang === 'ta' ? 'ta-IN' : 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event: SpeechRecognitionEventLike) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev + (prev ? ' ' : '') + transcript);
        setIsListening(false);
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const tierLabel = tier.id === 'essential' ? `${t(lang, 'essential')}` :
    tier.id === 'essential_plus' ? `${t(lang, 'essentialPlus')}` :
    tier.id === 'audio' ? t(lang, 'tier2Title') : t(lang, 'tier3Title');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="sticky top-0 z-20 bg-white border-b border-slate-100">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>

          <div className="relative shrink-0">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm ${
              doctor.status === 'online'
                ? 'bg-gradient-to-br from-teal-500 to-cyan-600'
                : 'bg-gradient-to-br from-slate-400 to-slate-500'
            }`}>
              {doctor.initials}
            </div>
            <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
              doctor.status === 'online' ? 'bg-green-500' : 'bg-red-500'
            }`} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <h1 className="font-semibold text-slate-800 text-sm truncate">{doctor.name}</h1>
              <BadgeCheck className="w-3.5 h-3.5 text-teal-500 shrink-0" />
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                {doctor.rating.toFixed(1)}
              </span>
              <span>•</span>
              <span>{tierLabel}</span>
              {maxTexts > 0 && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-medium text-teal-600">
                    <MessageSquare className="w-3 h-3" />
                    {textsRemaining} of {maxTexts} left
                  </span>
                </>
              )}
            </div>
          </div>

          <button
            onClick={onEnd}
            className="text-xs font-medium text-red-500 hover:text-red-600 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
          >
            {t(lang, 'endConsultation')}
          </button>
        </div>

        {maxTexts > 0 && (
          <div className="max-w-3xl mx-auto px-4 pb-2">
            <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-1.5 text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5 text-teal-600" /> Included messages used</span>
              <span className="font-semibold text-slate-700">{messageCount} of {maxTexts}</span>
            </div>
          </div>
        )}
      </header>

      <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-4 space-y-3 overflow-y-auto">
        {maxTexts > 0 && (
          <div className="flex items-center gap-2 rounded-xl bg-teal-50 px-4 py-2.5 text-xs text-teal-800 border border-teal-100">
            <Clock3 className="h-4 w-4 shrink-0" />
            This plan includes {maxTexts} text messages. Used {messageCount}.
          </div>
        )}
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] ${msg.role === 'user' ? '' : 'flex items-start gap-2'}`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white font-bold text-xs shrink-0 mt-0.5">
                  {doctor.initials}
                </div>
              )}
              <div>
                {msg.attachmentUrl && (
                  <div className={`mb-1.5 flex items-center gap-2 px-3 py-2 rounded-xl border text-xs ${
                    msg.role === 'user' ? 'bg-teal-50 border-teal-100' : 'bg-white border-slate-100'
                  }`}>
                    <FileText className="w-4 h-4 text-teal-600" />
                    <span className="text-slate-600 truncate max-w-40">{msg.attachmentUrl}</span>
                  </div>
                )}
                <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-br-md'
                    : 'bg-white text-slate-700 border border-slate-100 rounded-bl-md'
                }`}>
                  {msg.content}
                </div>
              </div>
            </div>
          </div>
        ))}

        {blockedNotice && (
          <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-4 py-2.5 rounded-xl border border-amber-100 self-center mx-auto w-fit">
            <Circle className="w-2 h-2 fill-amber-500 text-amber-500 animate-pulse" />
            {t(lang, 'blockedTopic')}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {showAttachments && (
        <div className="max-w-3xl mx-auto w-full px-4 pb-2">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-lg p-3 flex items-center gap-3">
            <button
              onClick={() => imageInputRef.current?.click()}
              className="flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl hover:bg-slate-50 transition-colors flex-1"
            >
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <Image className="w-5 h-5 text-blue-500" />
              </div>
              <span className="text-xs text-slate-600 font-medium">Photo</span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl hover:bg-slate-50 transition-colors flex-1"
            >
              <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-teal-600" />
              </div>
              <span className="text-xs text-slate-600 font-medium">Document</span>
            </button>
            <button
              onClick={() => setShowAttachments(false)}
              className="w-10 h-10 rounded-xl hover:bg-slate-100 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>
      )}

      {attachments.length > 0 && (
        <div className="max-w-3xl mx-auto w-full px-4 pb-2">
          <div className="flex flex-wrap gap-2">
            {attachments.map((att, i) => (
              <div key={i} className="flex items-center gap-2 bg-white border border-slate-100 px-3 py-1.5 rounded-lg text-xs">
                <FileText className="w-3.5 h-3.5 text-teal-600" />
                <span className="text-slate-600 max-w-32 truncate">{att}</span>
                <button onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))}>
                  <X className="w-3.5 h-3.5 text-slate-400 hover:text-red-500" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="sticky bottom-0 bg-white border-t border-slate-100">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-end gap-2">
            {!isDoctorReplied && <div className="absolute inset-x-4 bottom-20 flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50/95 px-3 py-2 text-center text-xs font-medium text-amber-800 shadow-sm"><LockKeyhole className="h-4 w-4 shrink-0" /> Doctor review in progress. Your reply box will unlock automatically.</div>}
            {!canSend && isDoctorReplied && (
              <div className="absolute inset-x-4 bottom-20 flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50/95 px-3 py-2 text-center text-xs font-medium text-red-700 shadow-sm">
                <MessageSquare className="h-4 w-4 shrink-0" /> All {maxTexts} included messages used. Choose another plan for more.
              </div>
            )}
            <button
              onClick={() => setShowAttachments(!showAttachments)}
              disabled={!isDoctorReplied || !canSend}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors shrink-0 disabled:cursor-not-allowed disabled:opacity-40 ${
                showAttachments ? 'bg-teal-50 text-teal-600' : 'hover:bg-slate-100 text-slate-400'
              }`}
            >
              <Paperclip className="w-5 h-5" />
            </button>

            <button
              onClick={toggleVoice}
              disabled={!isDoctorReplied || !canSend}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors shrink-0 disabled:cursor-not-allowed disabled:opacity-40 ${
                isListening ? 'bg-red-50 text-red-500 animate-pulse' : 'hover:bg-slate-100 text-slate-400'
              }`}
            >
              {isListening ? <MicOff className="w-5 w-5" /> : <Mic className="w-5 h-5" />}
            </button>

            <div className="flex-1 relative">
              <textarea
                rows={1}
                value={input}
                disabled={!isDoctorReplied || !canSend}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isDoctorReplied ? (canSend ? (isListening ? t(lang, 'listening') : t(lang, 'typeMessage')) : 'All texts used') : "Awaiting Doctor's initial review. Your input panel will unlock automatically the second the practitioner responds."}
                className={`w-full resize-none px-4 py-2.5 rounded-xl border outline-none transition-all text-sm pr-11 ${isDoctorReplied && canSend ? 'border-slate-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-100' : 'border-amber-200 bg-amber-50/70 text-slate-400 blur-[0.2px]'}`}
              />
            </div>

            <button
              onClick={handleSend}
              disabled={!isDoctorReplied || !input.trim() || !canSend}
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                input.trim() && canSend
                  ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white hover:shadow-lg hover:shadow-teal-500/30 active:scale-95'
                  : 'bg-slate-100 text-slate-300'
              }`}
            >
              <Send className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </div>

      <input ref={fileInputRef} type="file" multiple onChange={handleFileSelect} className="hidden" />
      <input ref={imageInputRef} type="file" accept="image/*" multiple onChange={handleFileSelect} className="hidden" />
    </div>
  );
}
