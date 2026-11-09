export interface BodyPartSymptom {
  bodyPart: string;
  synonyms: string[];
  specialty: string;
  procedureCategory: string;
  advice: string;
}

export const BODY_PART_MAP: BodyPartSymptom[] = [
  { bodyPart: 'head', synonyms: ['head', 'skull', 'forehead', 'temple', 'migraine', 'headache', 'sir', 'sir dard', 'thalai', 'moju', 'sira'], specialty: 'Neurologist', procedureCategory: 'General Medicine', advice: 'Head pain can range from tension headaches to migraines. If the pain is sudden, severe, or accompanied by vision changes or vomiting, seek immediate in-person care. Otherwise, rest in a quiet, dark room and stay hydrated.' },
  { bodyPart: 'eye', synonyms: ['eye', 'eyes', 'vision', 'blurry', 'blind', 'kannu', 'ankh', 'kann', 'netra'], specialty: 'Ophthalmologist', procedureCategory: 'General Medicine', advice: 'Eye problems should be evaluated promptly. Avoid rubbing the eye and do not use over-the-counter drops without consultation. If vision is suddenly reduced or there is pain, see an eye specialist immediately.' },
  { bodyPart: 'ear', synonyms: ['ear', 'ears', 'hearing', 'kannu', 'kaan', 'chivi', 'shravan'], specialty: 'ENT Specialist', procedureCategory: 'General Medicine', advice: 'Ear pain or hearing changes may indicate infection or wax buildup. Do not insert anything into the ear canal. Warm compresses may help temporarily, but an ENT consultation is recommended.' },
  { bodyPart: 'nose', synonyms: ['nose', 'nasal', 'smell', 'moju', 'naak', 'mookku', 'naasi'], specialty: 'ENT Specialist', procedureCategory: 'General Medicine', advice: 'Nasal issues can range from allergies to infections. Steam inhalation and saline sprays can provide temporary relief. Persistent blockage or bleeding should be evaluated by an ENT specialist.' },
  { bodyPart: 'throat', synonyms: ['throat', 'sore throat', 'swallow', 'tonsil', 'gala', 'hriday', 'tonsil', 'thondai'], specialty: 'ENT Specialist', procedureCategory: 'General Medicine', advice: 'A sore throat may be viral or bacterial. Warm saltwater gargles and hydration help. If there is high fever, difficulty swallowing, or white patches, a doctor should examine the throat.' },
  { bodyPart: 'tooth', synonyms: ['tooth', 'teeth', 'dental', 'gum', 'cavity', 'daant', 'pal', 'iruttu', 'vayu'], specialty: 'Dental Surgeon', procedureCategory: 'Dentistry', advice: 'Dental pain should not be ignored. Maintain oral hygiene with gentle brushing and warm saltwater rinses. Avoid very hot or cold foods. See a dentist for proper evaluation and treatment.' },
  { bodyPart: 'chest', synonyms: ['chest', 'heart', 'cardiac', 'breast', 'chhati', 'maaju', 'iruval', 'hrudaya'], specialty: 'Cardiologist', procedureCategory: 'General Medicine', advice: 'Chest pain can be serious. If you feel pressure, tightness, or pain spreading to the arm or jaw, call emergency services immediately. For mild discomfort, a cardiology consultation is recommended.' },
  { bodyPart: 'back', synonyms: ['back', 'spine', 'spinal', 'lower back', 'upper back', 'pichhe', 'beenu', 'mundun', 'prushta'], specialty: 'Orthopedist', procedureCategory: 'General Medicine', advice: 'Back pain is common and often improves with rest and gentle stretching. If pain is severe, radiates to the legs, or is accompanied by numbness, see an orthopedist for evaluation.' },
  { bodyPart: 'stomach', synonyms: ['stomach', 'abdomen', 'belly', 'gut', 'tummy', 'pet', 'vayaru', 'udharam', 'potu'], specialty: 'Gastroenterologist', procedureCategory: 'General Medicine', advice: 'Abdominal pain can have many causes. Note the location, type of pain, and any associated symptoms like nausea or fever. Stay hydrated and avoid heavy foods. Persistent or severe pain needs immediate attention.' },
  { bodyPart: 'skin', synonyms: ['skin', 'rash', 'itch', 'acne', 'pimple', 'dermatitis', 'eczema', 'twacha', 'irmal', 'khal', 'chavi'], specialty: 'Dermatologist', procedureCategory: 'Dermatology', advice: 'Skin conditions can have many causes. Share a photo of the affected area and describe when it started. Avoid scratching and applying unknown creams. A dermatologist can diagnose and prescribe proper treatment.' },
  { bodyPart: 'joint', synonyms: ['joint', 'knee', 'elbow', 'shoulder', 'hip', 'ankle', 'wrist', 'arthritis', 'ghutna', 'kandal', 'mukkal', 'sandhi'], specialty: 'Orthopedist', procedureCategory: 'General Medicine', advice: 'Joint pain may be from injury, overuse, or arthritis. Rest the affected joint and apply ice if there is swelling. Persistent pain or reduced mobility should be evaluated by an orthopedist.' },
  { bodyPart: 'hand', synonyms: ['hand', 'finger', 'palm', 'wrist', 'haath', 'kai', 'cheyyi', 'hasta'], specialty: 'Orthopedist', procedureCategory: 'General Medicine', advice: 'Hand or finger pain may be from strain, injury, or nerve compression. Avoid repetitive movements and rest the hand. If there is numbness, tingling, or swelling, consult an orthopedist.' },
  { bodyPart: 'leg', synonyms: ['leg', 'legs', 'calf', 'thigh', 'shin', 'taang', 'kaal', 'kaalu', 'janugu'], specialty: 'Orthopedist', procedureCategory: 'General Medicine', advice: 'Leg pain can be from muscle strain, circulation issues, or nerve problems. Elevate the leg and rest. If there is swelling, redness, or warmth, seek medical attention to rule out clots.' },
  { bodyPart: 'foot', synonyms: ['foot', 'feet', 'heel', 'toe', 'sole', 'pair', 'paadha', 'kaddu', 'charana'], specialty: 'Orthopedist', procedureCategory: 'General Medicine', advice: 'Foot pain may be from standing, improper footwear, or conditions like plantar fasciitis. Rest and wear supportive shoes. Persistent heel pain should be evaluated by an orthopedist.' },
  { bodyPart: 'neck', synonyms: ['neck', 'cervical', 'gardan', 'katan', 'taddu', 'griva'], specialty: 'Orthopedist', procedureCategory: 'General Medicine', advice: 'Neck pain is often from poor posture or muscle strain. Gentle stretches and warm compresses help. If pain radiates to the arms or is accompanied by numbness, see an orthopedist.' },
  { bodyPart: 'hair', synonyms: ['hair', 'scalp', 'hair loss', 'baldness', 'dandruff', 'baal', 'mundi', 'mudi', 'koodi'], specialty: 'Dermatologist', procedureCategory: 'Dermatology', advice: 'Hair loss can be caused by genetics, stress, nutrition, or hormonal changes. A dermatologist can determine the cause and recommend treatment. Avoid harsh chemicals and maintain a balanced diet.' },
];

export const MULTILINGUAL_PAIN_WORDS = [
  'pain', 'hurt', 'sore', 'ache', 'burning', 'stabbing', 'throbbing', 'sharp', 'dull',
  'dard', 'peeda', 'dukh', 'soojan',
  'vali', 'noy', 'thunbam',
  'bodha', 'noppu', 'bharam',
  'byatha', 'kaaya',
  'jeji', 'asabu',
  'alam', 'edanam',
];

export const MULTILINGUAL_SYMPTOM_WORDS = [
  'fever', 'temperature', 'cough', 'cold', 'flu', 'infection', 'swelling', 'bleeding',
  'nausea', 'vomiting', 'dizziness', 'fatigue', 'weakness', 'rash', 'itching',
  'bukhar', 'khaansi', 'zukam', 'suijan', 'khoon',
  'kaichal', 'irumal', 'veyyippu', 'velippu',
  'jvaram', 'daagudu', 'vuppu',
  'tap', 'kasa', 'sardi',
  'daara', 'nalla',
];

export function recognizeBodyPart(message: string): BodyPartSymptom | undefined {
  const lower = message.toLowerCase();
  return BODY_PART_MAP.find(part =>
    part.synonyms.some(syn => lower.includes(syn))
  );
}
