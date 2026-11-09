import { useState } from 'react';
import { Bot, X, Send, CircleHelp, Mic, MicOff } from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';
import { isHealthRelated } from '@/data/tiers';
import { PROCEDURES, VET_PROCEDURES } from '@/data/procedures';
import { recognizeBodyPart, BODY_PART_MAP, MULTILINGUAL_PAIN_WORDS, MULTILINGUAL_SYMPTOM_WORDS } from '@/data/symptoms';
import type { Doctor, Procedure, LanguageCode } from '@/types';

interface Props { doctors: Doctor[]; lang?: LanguageCode; }

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
type SpeechRecognitionWindow = Window & { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor };

const uniqueDoctors = (doctors: Doctor[]): Doctor[] => Array.from(new Map(doctors.map(d => [d.id, d])).values());
const catalog = [...PROCEDURES, ...VET_PROCEDURES];

const VOICE_LANG_MAP: Record<string, string> = {
  en: 'en-US', hi: 'hi-IN', ta: 'ta-IN', te: 'te-IN', bn: 'bn-IN', mr: 'mr-IN',
  gu: 'gu-IN', kn: 'kn-IN', ml: 'ml-IN', es: 'es-ES', fr: 'fr-FR', de: 'de-DE',
  ar: 'ar-SA', zh: 'zh-CN', pt: 'pt-BR',
};

function findProcedure(message: string): Procedure | undefined {
  const lower = message.toLowerCase();
  return catalog.find(p => p.name.toLowerCase().split(/\s+/).some(w => w.length > 3 && lower.includes(w)))
    ?? catalog.find(p => lower.includes(p.id.split('-').join(' ')));
}

function findDoctor(message: string, doctors: Doctor[], procedure?: Procedure): Doctor | undefined {
  const lower = message.toLowerCase();
  const list = uniqueDoctors(procedure?.doctors ?? doctors);
  return list.find(d => lower.includes(d.name.toLowerCase()))
    ?? [...list].sort((a, b) => b.rating - a.rating || b.experience - a.experience)[0];
}

function findDoctorBySpecialty(specialty: string, doctors: Doctor[]): Doctor | undefined {
  const matches = uniqueDoctors(doctors).filter(d =>
    d.specialty.toLowerCase().includes(specialty.toLowerCase())
  );
  return matches.sort((a, b) => {
    if (a.status === 'online' && b.status !== 'online') return -1;
    if (b.status === 'online' && a.status !== 'online') return 1;
    return b.rating - a.rating;
  })[0];
}

const VET_ANIMALS: Record<string, string[]> = {
  'Pet Veterinarian': ['dogs', 'cats', 'rabbits', 'birds', 'and other companion pets'],
  'Livestock Veterinarian': ['cows', 'buffaloes', 'goats', 'sheep', 'horses', 'and other farm animals'],
};

function detectAnimalType(message: string): string | null {
  const lower = message.toLowerCase();
  if (lower.includes('cow') || lower.includes('gai') || lower.includes('livestock') || lower.includes('cattle') || lower.includes('buffalo')) return 'livestock';
  if (lower.includes('dog') || lower.includes('cat') || lower.includes('pet') || lower.includes('puppy') || lower.includes('kitten') || lower.includes('rabbit') || lower.includes('bird')) return 'pet';
  return null;
}

function findVetProcedure(message: string): Procedure | undefined {
  const animalType = detectAnimalType(message);
  if (animalType === 'livestock') return VET_PROCEDURES.find(p => p.id === 'cow-care');
  if (animalType === 'pet') return VET_PROCEDURES.find(p => p.id === 'pets-care');
  return undefined;
}

function doctorFullDetails(doctor: Doctor, procedure?: Procedure): string {
  const focus = procedure ? ` for ${procedure.name}` : '';
  const status = doctor.status === 'online' ? 'available now for consultation' : 'currently offline but can be booked for a later slot';
  const animalsTreated = VET_ANIMALS[doctor.specialty];
  const animalInfo = animalsTreated ? ` This doctor treats ${animalsTreated.join(', ')}.` : '';
  return `${doctor.name} is a ${doctor.specialty}${focus}, practicing in ${doctor.location}. With ${doctor.experience} years of experience and a patient rating of ${doctor.rating.toFixed(1)} out of 5 stars, this doctor is ${status}.${animalInfo} You can start a text, audio, or video consultation by selecting this doctor from the directory.`;
}

function hasPainOrSymptom(message: string): boolean {
  const lower = message.toLowerCase();
  return MULTILINGUAL_PAIN_WORDS.some(w => lower.includes(w))
    || MULTILINGUAL_SYMPTOM_WORDS.some(w => lower.includes(w));
}

export default function AssistantWidget({ doctors, lang = 'en' }: Props) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  type AssistantMessage = { role: 'assistant' | 'user'; text: string };
  const [messages, setMessages] = useState<AssistantMessage[]>([{ role: 'assistant', text: 'Hello. I am the KHBV.D Assistant. Tell me what hurts or what you need, in any language by voice or typing. I will identify the problem and recommend the right doctor with full details.' }]);

  const answer = (text: string) => {
    const lower = text.toLowerCase();
    const bodyPart = recognizeBodyPart(text);
    const vetProcedure = findVetProcedure(text);
    const procedure = vetProcedure ?? findProcedure(text);
    const matchedDoctor = vetProcedure
      ? findDoctor(text, doctors, vetProcedure)
      : procedure
      ? findDoctor(text, doctors, procedure)
      : bodyPart
      ? findDoctorBySpecialty(bodyPart.specialty, doctors)
      : findDoctor(text, doctors);
    let response: string;

    if (!isHealthRelated(text)) {
      response = 'I can only help with health concerns, body pain, symptoms, medical procedures, veterinary care for animals, and doctor details. Please describe what you are experiencing.';
    } else if (vetProcedure && matchedDoctor) {
      const animalsTreated = VET_ANIMALS[matchedDoctor.specialty];
      const animalInfo = animalsTreated ? ` This doctor treats ${animalsTreated.join(', ')}.` : '';
      response = `${vetProcedure.name} is available in the ${vetProcedure.category} directory. ${doctorFullDetails(matchedDoctor, vetProcedure)} ${vetProcedure.description}.${animalInfo} Would you like to start a consultation?`;
    } else if (vetProcedure && !matchedDoctor) {
      response = `${vetProcedure.name} is available in the ${vetProcedure.category} directory. ${vetProcedure.description} You can browse the available veterinarians and start a consultation.`;
    } else if (bodyPart && matchedDoctor) {
      response = `I can see your concern is related to your ${bodyPart.bodyPart}. ${bodyPart.advice} The right specialist for you is: ${doctorFullDetails(matchedDoctor, procedure)}. Their clinic is in ${matchedDoctor.location}. Would you like to start a consultation?`;
    } else if (bodyPart && !matchedDoctor) {
      response = `I can see your concern is related to your ${bodyPart.bodyPart}. ${bodyPart.advice} I recommend consulting a ${bodyPart.specialty}. You can find one in the ${bodyPart.procedureCategory} directory.`;
    } else if (procedure && matchedDoctor) {
      response = `${procedure.name} is available in the ${procedure.category} directory. ${doctorFullDetails(matchedDoctor, procedure)} Open this procedure to review the consultation options.`;
    } else if (lower.includes('available') || lower.includes('online')) {
      const available = uniqueDoctors(doctors).filter(d => d.status === 'online');
      response = available.length
        ? `${available.length} doctors are online now: ${available.map(d => `${d.name} (${d.specialty}, ${d.location})`).join('; ')}.`
        : 'No doctors are online right now. You can still browse profiles and choose a later consultation.';
    } else if (lower.includes('doctor') || lower.includes('specialist') || lower.includes('profile') || lower.includes('address') || lower.includes('location') || lower.includes('experience') || lower.includes('rating')) {
      response = matchedDoctor ? doctorFullDetails(matchedDoctor) : 'Open the Doctors directory to compare specialties, years of experience, clinic locations, availability, and review ratings.';
    } else if (lower.includes('how') || lower.includes('use') || lower.includes('app') || lower.includes('payment') || lower.includes('language') || lower.includes('service') || lower.includes('consult')) {
      response = 'Choose a health service, select a doctor, complete Chief Complaint and Duration of Symptoms, choose text, audio, or video consultation, then continue. Text plans use the payment screen; audio and video plans open the call screen directly. You can change language from the top menu and attach reports or photos in chat.';
    } else if (hasPainOrSymptom(text)) {
      const parts = BODY_PART_MAP.filter(p => p.synonyms.some(s => lower.includes(s)));
      if (parts.length > 0) {
        const doc = findDoctorBySpecialty(parts[0].specialty, doctors);
        response = doc
          ? `I can see you are experiencing discomfort. ${parts[0].advice} The recommended specialist is: ${doctorFullDetails(doc)}.`
          : `I can see you are experiencing discomfort. ${parts[0].advice} Please consult a ${parts[0].specialty}.`;
      } else {
        response = 'I understand you are experiencing discomfort. Could you tell me which body part is affected and describe the type of pain? This will help me recommend the right specialist.';
      }
    } else {
      response = 'Please describe your symptom, which body part is affected, or the medical service you need. I can identify the problem and recommend a doctor with their full details and clinic location.';
    }

    setMessages(prev => [...prev, { role: 'user', text }, { role: 'assistant', text: response }]);
    setInput('');
  };

  const send = () => {
    const text = input.trim();
    if (text) answer(text);
  };

  const toggleVoice = () => {
    const speechWindow = window as SpeechRecognitionWindow;
    const SpeechRecognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setInput(prev => `${prev}${prev ? ' ' : ''}Voice input is unavailable in this browser.`);
      return;
    }
    if (isListening) { setIsListening(false); return; }
    setIsListening(true);
    try {
      const recognition = new SpeechRecognition();
      recognition.lang = VOICE_LANG_MAP[lang] ?? 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.onresult = event => {
        const transcript = event.results[0][0].transcript;
        setIsListening(false);
        answer(transcript);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  return <>
    <button onClick={() => setOpen(true)} className="assistant-fab assistant-fab-left" aria-label="Open KHBV.D Assistant"><Bot className="h-6 w-6" /><span>KHBV.D Assistant</span></button>
    {open && <div className="fixed bottom-24 left-5 z-30 w-[min(420px,calc(100vw-2rem))] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
      <div className="flex items-center justify-between bg-gradient-to-r from-blue-700 to-cyan-600 px-4 py-4 text-white">
        <div className="flex items-center gap-3"><BrandLogo compact light /><div><p className="font-semibold">KHBV.D Assistant</p><p className="text-xs text-blue-100">Any language, voice or typing</p></div></div>
        <button onClick={() => setOpen(false)} className="rounded-lg p-2 hover:bg-white/10" aria-label="Close assistant"><X className="h-5 w-5" /></button>
      </div>
      <div className="max-h-96 space-y-3 overflow-y-auto bg-slate-50 p-4">
        {messages.map((message, index) => <div key={`${message.role}-${index}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[88%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${message.role === 'user' ? 'bg-blue-700 text-white' : 'border border-slate-100 bg-white text-slate-700'}`}>{message.text}</div></div>)}
      </div>
      <div className="flex gap-2 border-t border-slate-100 p-3">
        <input autoFocus value={input} onChange={event => setInput(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') send(); }} placeholder={isListening ? 'Listening…' : 'Describe what hurts, in any language'} className="field" />
        <button onClick={toggleVoice} className={`rounded-xl px-3 ${isListening ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-600'}`} aria-label="Use voice input">{isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}</button>
        <button onClick={send} className="rounded-xl bg-blue-700 px-3 text-white hover:bg-blue-800" aria-label="Send assistant message"><Send className="h-4 w-4" /></button>
      </div>
      <div className="flex items-center gap-1 px-4 pb-3 text-[11px] text-slate-400"><CircleHelp className="h-3.5 w-3.5" /> Not a replacement for emergency medical care.</div>
    </div>}
  </>;
}
