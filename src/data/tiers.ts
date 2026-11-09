import type { TierInfo } from '@/types';

export const TIERS: TierInfo[] = [
  {
    id: 'essential',
    label: 'Essential',
    price: 0,
    texts: 10,
    images: 5,
    type: 'text',
  },
  {
    id: 'essential_plus',
    label: 'Essential Plus',
    price: 0,
    texts: 25,
    images: 8,
    type: 'text',
  },
  {
    id: 'audio',
    label: 'Audio Call',
    price: 0,
    type: 'audio',
  },
  {
    id: 'video',
    label: 'Video Call',
    price: 0,
    type: 'video',
  },
];

export function getTierById(id: string): TierInfo | undefined {
  return TIERS.find(t => t.id === id);
}

const HEALTH_KEYWORDS = [
  'pain', 'fever', 'cough', 'rash', 'allergy', 'infection', 'surgery', 'dental', 'tooth',
  'skin', 'laser', 'hair', 'braces', 'implant', 'doctor', 'medicine', 'symptom', 'health',
  'treatment', 'diagnosis', 'wound', 'swelling', 'bleeding', 'nausea', 'headache', 'throat',
  'stomach', 'chest', 'back', 'joint', 'bone', 'muscle', 'nerve', 'anxiety', 'sleep',
  'diet', 'nutrition', 'vitamin', 'blood', 'pressure', 'diabetes', 'cholesterol', 'vaccine',
  'appointment', 'consultation', 'prescription', 'dosage', 'side effect', 'recovery',
  'appointment', 'fee', 'refund', 'payment', 'plan', 'tier', 'chat', 'upload', 'file',
  'help', 'how', 'what', 'when', 'can i', 'should i', 'is it', 'does it',
  'procedure', 'clinic', 'specialist', 'experience', 'rating', 'online', 'offline',
];

const OFF_TOPIC_KEYWORDS = [
  'weather', 'movie', 'song', 'game', 'football', 'cricket', 'politics', 'news',
  'stock', 'crypto', 'bitcoin', 'recipe', 'cook', 'travel', 'hotel', 'flight',
  'shopping', 'amazon', 'netflix', 'youtube', 'tiktok', 'instagram', 'facebook',
  'joke', 'story', 'poem', 'code', 'program', 'hack', 'password', 'download',
];

export function isHealthRelated(message: string): boolean {
  const lower = message.toLowerCase();
  if (OFF_TOPIC_KEYWORDS.some(kw => lower.includes(kw))) return false;
  if (HEALTH_KEYWORDS.some(kw => lower.includes(kw))) return true;
  const VET_KEYWORDS = ['cow', 'pet', 'dog', 'cat', 'animal', 'vet', 'veterinary', 'livestock', 'goat', 'sheep', 'horse', 'buffalo', 'poultry', 'hen', 'chicken', 'pig', 'donkey', 'gai', 'bachada', 'pet doctor', 'animal doctor'];
  if (VET_KEYWORDS.some(kw => lower.includes(kw))) return true;
  if (lower.includes('app') || lower.includes('feature') || lower.includes('consult') || lower.includes('doctor') || lower.includes('medical') || lower.includes('clinic')) return true;
  return false;
}

export function generateAssistantResponse(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('pain') || lower.includes('hurt') || lower.includes('sore')) {
    return 'I understand you are experiencing pain. Could you describe the location and intensity of the pain on a scale of 1-10? This will help me provide better guidance. If the pain is severe or sudden, please consider an in-person visit.';
  }
  if (lower.includes('fever') || lower.includes('temperature')) {
    return 'A fever can indicate an infection. Please monitor your temperature regularly, stay hydrated, and rest. If your fever exceeds 39°C (102°F) or persists beyond 3 days, please see a doctor in person.';
  }
  if (lower.includes('rash') || lower.includes('skin') || lower.includes('itch')) {
    return 'Skin conditions can have many causes including allergies, infections, or irritants. Please share a photo of the affected area using the attachment option, and describe when it started and if anything triggers it.';
  }
  if (lower.includes('tooth') || lower.includes('dental') || lower.includes('teeth')) {
    return 'For dental concerns, it is important to see a dentist for proper evaluation. In the meantime, maintain oral hygiene with gentle brushing and warm saltwater rinses. Avoid very hot or cold foods on the affected side.';
  }
  if (lower.includes('implant')) {
    return 'Dental implants are a great long-term solution for missing teeth. The procedure typically takes 2-3 visits over 3-6 months. Would you like to know about the procedure steps, aftercare, or cost estimates?';
  }
  if (lower.includes('laser') || lower.includes('hair removal')) {
    return 'Laser hair removal works by targeting melanin in hair follicles. Multiple sessions (6-8) are usually needed for optimal results. It is most effective on dark hair and lighter skin, but modern lasers work on most skin types.';
  }
  if (lower.includes('brace') || lower.includes('align')) {
    return 'Orthodontic treatment with braces typically takes 12-24 months depending on the complexity. Options include traditional metal braces, ceramic braces, and clear aligners. A consultation will determine the best option for you.';
  }
  if (lower.includes('medicine') || lower.includes('medication') || lower.includes('prescription')) {
    return 'I can provide general health guidance, but specific medication prescriptions require an in-person or video consultation with a licensed doctor. Please describe your symptoms so I can guide you further.';
  }
  if (lower.includes('app') || lower.includes('feature') || lower.includes('how') || lower.includes('upload') || lower.includes('file') || lower.includes('attach')) {
    return 'You can attach medical reports or photos using the paperclip icon in the chat. You can also use voice input via the microphone button. Your consultation includes text, image sharing, and more depending on your selected plan.';
  }
  if (lower.includes('thank')) {
    return 'You are welcome! If you have any other health concerns, feel free to ask. Take care of your health!';
  }
  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
    return 'Hello! I am here to help with clinical health advice and app guidance. What health concern can I assist you with today?';
  }
  return 'Thank you for sharing that. Could you provide more details about your symptoms, such as when they started, their severity, and any related concerns? This will help me give you more relevant guidance.';
}
