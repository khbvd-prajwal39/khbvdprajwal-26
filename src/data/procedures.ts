import type { Procedure, Doctor } from '@/types';

const doctors: Doctor[] = [
  { id: 'd1', name: 'Dr. Anjali Sharma', location: 'Mumbai, Maharashtra', experience: 12, rating: 4.8, status: 'online', specialty: 'Dermatologist', initials: 'AS' },
  { id: 'd2', name: 'Dr. Rajesh Kumar', location: 'Delhi, NCR', experience: 15, rating: 4.9, status: 'online', specialty: 'Dermatologist', initials: 'RK' },
  { id: 'd3', name: 'Dr. Priya Nair', location: 'Bangalore, Karnataka', experience: 8, rating: 4.6, status: 'offline', specialty: 'Dermatologist', initials: 'PN' },
  { id: 'd4', name: 'Dr. Vikram Singh', location: 'Chandigarh, Punjab', experience: 18, rating: 4.7, status: 'online', specialty: 'Dental Surgeon', initials: 'VS' },
  { id: 'd5', name: 'Dr. Meera Iyer', location: 'Chennai, Tamil Nadu', experience: 10, rating: 4.5, status: 'offline', specialty: 'Orthodontist', initials: 'MI' },
  { id: 'd6', name: 'Dr. Arjun Reddy', location: 'Hyderabad, Telangana', experience: 14, rating: 4.8, status: 'online', specialty: 'Orthodontist', initials: 'AR' },
  { id: 'd7', name: 'Dr. Sneha Patel', location: 'Ahmedabad, Gujarat', experience: 9, rating: 4.4, status: 'online', specialty: 'Dental Surgeon', initials: 'SP' },
  { id: 'd8', name: 'Dr. Rohit Deshmukh', location: 'Pune, Maharashtra', experience: 20, rating: 4.9, status: 'offline', specialty: 'Cosmetic Surgeon', initials: 'RD' },
  { id: 'd9', name: 'Dr. Kavya Krishnan', location: 'Kochi, Kerala', experience: 7, rating: 4.3, status: 'online', specialty: 'Dermatologist', initials: 'KK' },
  { id: 'd10', name: 'Dr. Sanjay Gupta', location: 'Jaipur, Rajasthan', experience: 16, rating: 4.7, status: 'offline', specialty: 'Orthodontist', initials: 'SG' },
  { id: 'd11', name: 'Dr. Ananya Bose', location: 'Kolkata, West Bengal', experience: 11, rating: 4.6, status: 'online', specialty: 'Cosmetic Surgeon', initials: 'AB' },
  { id: 'd12', name: 'Dr. Nikhil Joshi', location: 'Nagpur, Maharashtra', experience: 13, rating: 4.5, status: 'online', specialty: 'Dental Surgeon', initials: 'NJ' },
];

export const PROCEDURES: Procedure[] = [
  {
    id: 'laser-hair-removal',
    name: 'Laser Hair Removal',
    icon: 'Sparkles',
    category: 'Dermatology',
    description: 'Permanent hair reduction with advanced laser technology',
    doctors: doctors.filter(d => d.specialty === 'Dermatologist' || d.specialty === 'Cosmetic Surgeon'),
  },
  {
    id: 'dental-implants',
    name: 'Dental Implants',
    icon: 'Bone',
    category: 'Dentistry',
    description: 'Replace missing teeth with permanent titanium implants',
    doctors: doctors.filter(d => d.specialty === 'Dental Surgeon'),
  },
  {
    id: 'orthodontic-braces',
    name: 'Orthodontic Braces',
    icon: 'AlignHorizontalJustifyCenter',
    category: 'Dentistry',
    description: 'Straighten teeth with traditional or clear aligners',
    doctors: doctors.filter(d => d.specialty === 'Orthodontist'),
  },
  {
    id: 'skin-rejuvenation',
    name: 'Skin Rejuvenation',
    icon: 'Sun',
    category: 'Dermatology',
    description: 'Chemical peels, microdermabrasion and laser resurfacing',
    doctors: doctors.filter(d => d.specialty === 'Dermatologist'),
  },
  {
    id: 'rhinoplasty',
    name: 'Rhinoplasty',
    icon: 'Wind',
    category: 'Cosmetic Surgery',
    description: 'Nose reshaping surgery for aesthetic or functional reasons',
    doctors: doctors.filter(d => d.specialty === 'Cosmetic Surgeon'),
  },
  {
    id: 'root-canal',
    name: 'Root Canal Treatment',
    icon: 'Activity',
    category: 'Dentistry',
    description: 'Save infected teeth with endodontic therapy',
    doctors: doctors.filter(d => d.specialty === 'Dental Surgeon'),
  },
  {
    id: 'botox-fillers',
    name: 'Botox & Fillers',
    icon: 'Syringe',
    category: 'Dermatology',
    description: 'Wrinkle reduction and facial volume restoration',
    doctors: doctors.filter(d => d.specialty === 'Dermatologist' || d.specialty === 'Cosmetic Surgeon'),
  },
  {
    id: 'teeth-whitening',
    name: 'Teeth Whitening',
    icon: 'Smile',
    category: 'Dentistry',
    description: 'Professional bleaching for a brighter smile',
    doctors: doctors.filter(d => d.specialty === 'Dental Surgeon' || d.specialty === 'Orthodontist'),
  },
];

export const VET_PROCEDURES: Procedure[] = [
  {
    id: 'pets-care',
    name: 'Pets Care',
    icon: 'PawPrint',
    category: 'Veterinary',
    description: 'Consult a veterinarian for dogs, cats, and companion pets',
    doctors: [
      { id: 'v1', name: 'Dr. Neha Rao', location: 'Bengaluru, Karnataka', experience: 11, rating: 4.8, status: 'online', specialty: 'Pet Veterinarian', initials: 'NR' },
      { id: 'v2', name: 'Dr. Amit Verma', location: 'Pune, Maharashtra', experience: 9, rating: 4.6, status: 'offline', specialty: 'Pet Veterinarian', initials: 'AV' },
    ],
  },
  {
    id: 'cow-care',
    name: 'Cow Care',
    icon: 'Milk',
    category: 'Veterinary',
    description: 'Livestock health guidance for cows and farm animals',
    doctors: [
      { id: 'v3', name: 'Dr. Kavita Desai', location: 'Nashik, Maharashtra', experience: 14, rating: 4.9, status: 'online', specialty: 'Livestock Veterinarian', initials: 'KD' },
      { id: 'v4', name: 'Dr. Ramesh Gowda', location: 'Mysuru, Karnataka', experience: 17, rating: 4.7, status: 'offline', specialty: 'Livestock Veterinarian', initials: 'RG' },
    ],
  },
];

export function getProcedureById(id: string): Procedure | undefined {
  return [...PROCEDURES, ...VET_PROCEDURES].find(p => p.id === id);
}
