export const SYMPTOM_MAP = {
  // --- CARDIOLOGY (Heart) ---
  "chest pain": { specialties: ["Cardiology"], isEmergency: true },
  "heart attack": { specialties: ["Cardiology"], isEmergency: true },
  "cardiac": { specialties: ["Cardiology"], isEmergency: true },
  "palpitations": { specialties: ["Cardiology"], isEmergency: false },
  "irregular heartbeat": { specialties: ["Cardiology"], isEmergency: false },
  "high blood pressure": { specialties: ["Cardiology", "General Physician"], isEmergency: false },
  "hypertension": { specialties: ["Cardiology", "General Physician"], isEmergency: false },
  "cholesterol": { specialties: ["Cardiology"], isEmergency: false },

  // --- ORTHOPEDICS (Bones & Joints) ---
  "fracture": { specialties: ["Orthopedics"], isEmergency: true },
  "broken bone": { specialties: ["Orthopedics"], isEmergency: true },
  "joint pain": { specialties: ["Orthopedics"], isEmergency: false },
  "arthritis": { specialties: ["Orthopedics", "Rheumatology"], isEmergency: false },
  "back pain": { specialties: ["Orthopedics", "Physiotherapy"], isEmergency: false },
  "knee pain": { specialties: ["Orthopedics"], isEmergency: false },
  "sprain": { specialties: ["Orthopedics"], isEmergency: false },
  "ligament": { specialties: ["Orthopedics"], isEmergency: false },
  "spondylitis": { specialties: ["Orthopedics"], isEmergency: false },

  // --- DERMATOLOGY (Skin, Hair, Nails) ---
  "skin": { specialties: ["Dermatology"], isEmergency: false },
  "rash": { specialties: ["Dermatology"], isEmergency: false },
  "acne": { specialties: ["Dermatology"], isEmergency: false },
  "pimple": { specialties: ["Dermatology"], isEmergency: false },
  "hair loss": { specialties: ["Dermatology"], isEmergency: false },
  "eczema": { specialties: ["Dermatology"], isEmergency: false },
  "psoriasis": { specialties: ["Dermatology"], isEmergency: false },
  "dark spots": { specialties: ["Dermatology"], isEmergency: false },
  "fungal infection": { specialties: ["Dermatology"], isEmergency: false },

  // --- PEDIATRICS (Children) ---
  "baby": { specialties: ["Pediatrics"], isEmergency: false },
  "child": { specialties: ["Pediatrics"], isEmergency: false },
  "infant": { specialties: ["Pediatrics"], isEmergency: false },
  "vaccination": { specialties: ["Pediatrics"], isEmergency: false },
  "pediatric": { specialties: ["Pediatrics"], isEmergency: false },
  "chicken pox": { specialties: ["Pediatrics", "General Physician"], isEmergency: false },

  // --- GYNECOLOGY (Women's Health) ---
  "pregnancy": { specialties: ["Gynecology/Obstetrics"], isEmergency: false },
  "pregnant": { specialties: ["Gynecology/Obstetrics"], isEmergency: false },
  "period": { specialties: ["Gynecology/Obstetrics"], isEmergency: false },
  "menstrual": { specialties: ["Gynecology/Obstetrics"], isEmergency: false },
  "pcod": { specialties: ["Gynecology/Obstetrics"], isEmergency: false },
  "pcos": { specialties: ["Gynecology/Obstetrics"], isEmergency: false },
  "infertility": { specialties: ["Gynecology/Obstetrics", "IVF Specialist"], isEmergency: false },
  "abortion": { specialties: ["Gynecology/Obstetrics"], isEmergency: false },
  "delivery": { specialties: ["Gynecology/Obstetrics"], isEmergency: true },

  // --- GASTROENTEROLOGY (Stomach & Digestion) ---
  "stomach pain": { specialties: ["Gastroenterology", "General Physician"], isEmergency: false },
  "acidity": { specialties: ["Gastroenterology", "General Physician"], isEmergency: false },
  "gastric": { specialties: ["Gastroenterology"], isEmergency: false },
  "liver": { specialties: ["Gastroenterology", "Hepatology"], isEmergency: false },
  "jaundice": { specialties: ["Gastroenterology", "General Physician"], isEmergency: false },
  "ulcer": { specialties: ["Gastroenterology"], isEmergency: false },
  "vomiting": { specialties: ["General Physician", "Gastroenterology"], isEmergency: false },
  "diarrhea": { specialties: ["General Physician", "Gastroenterology"], isEmergency: false },
  "constipation": { specialties: ["Gastroenterology", "General Physician"], isEmergency: false },
  "piles": { specialties: ["Gastroenterology", "Proctology"], isEmergency: false },

  // --- NEUROLOGY (Brain & Nerves) ---
  "headache": { specialties: ["Neurology", "General Physician"], isEmergency: false },
  "migraine": { specialties: ["Neurology"], isEmergency: false },
  "stroke": { specialties: ["Neurology"], isEmergency: true },
  "paralysis": { specialties: ["Neurology"], isEmergency: true },
  "seizure": { specialties: ["Neurology"], isEmergency: true },
  "epilepsy": { specialties: ["Neurology"], isEmergency: false },
  "dizziness": { specialties: ["Neurology", "General Physician"], isEmergency: false },
  "vertigo": { specialties: ["Neurology", "ENT"], isEmergency: false },

  // --- ENT (Ear, Nose, Throat) ---
  "ear": { specialties: ["ENT"], isEmergency: false },
  "nose": { specialties: ["ENT"], isEmergency: false },
  "throat": { specialties: ["ENT"], isEmergency: false },
  "sinus": { specialties: ["ENT"], isEmergency: false },
  "tonsils": { specialties: ["ENT"], isEmergency: false },
  "hearing": { specialties: ["ENT"], isEmergency: false },
  "cold": { specialties: ["General Physician", "ENT"], isEmergency: false },
  "cough": { specialties: ["General Physician", "Pulmonology"], isEmergency: false },

  // --- DENTAL (Teeth) ---
  "tooth": { specialties: ["Dentist"], isEmergency: false },
  "teeth": { specialties: ["Dentist"], isEmergency: false },
  "dental": { specialties: ["Dentist"], isEmergency: false },
  "cavity": { specialties: ["Dentist"], isEmergency: false },
  "root canal": { specialties: ["Dentist"], isEmergency: false },
  "gum": { specialties: ["Dentist"], isEmergency: false },

  // --- OPHTHALMOLOGY (Eyes) ---
  "eye": { specialties: ["Ophthalmology"], isEmergency: false },
  "vision": { specialties: ["Ophthalmology"], isEmergency: false },
  "cataract": { specialties: ["Ophthalmology"], isEmergency: false },
  "glasses": { specialties: ["Ophthalmology"], isEmergency: false },

  // --- PSYCHIATRY (Mental Health) ---
  "depression": { specialties: ["Psychiatry", "Psychologist"], isEmergency: false },
  "anxiety": { specialties: ["Psychiatry", "Psychologist"], isEmergency: false },
  "stress": { specialties: ["Psychiatry", "Psychologist"], isEmergency: false },
  "mental": { specialties: ["Psychiatry"], isEmergency: false },
  "sleep": { specialties: ["Psychiatry", "General Physician"], isEmergency: false },

  // --- GENERAL / EMERGENCY ---
  "fever": { specialties: ["General Physician"], isEmergency: false },
  "weakness": { specialties: ["General Physician"], isEmergency: false },
  "infection": { specialties: ["General Physician"], isEmergency: false },
  "accident": { specialties: ["Emergency Medicine", "Orthopedics"], isEmergency: true },
  "bleeding": { specialties: ["Emergency Medicine"], isEmergency: true },
  "burn": { specialties: ["Plastic Surgery", "Dermatology", "Emergency Medicine"], isEmergency: true },
  "poison": { specialties: ["Emergency Medicine"], isEmergency: true },
  "trauma": { specialties: ["Emergency Medicine", "Orthopedics"], isEmergency: true },

  // --- UROLOGY / NEPHROLOGY (Kidney & Urinary) ---
  "kidney": { specialties: ["Nephrology", "Urology"], isEmergency: false },
  "stone": { specialties: ["Urology"], isEmergency: false },
  "urine": { specialties: ["Urology"], isEmergency: false },
  "uti": { specialties: ["Urology", "General Physician"], isEmergency: false },
  "prostate": { specialties: ["Urology"], isEmergency: false },

  // --- PULMONOLOGY (Lungs) ---
  "asthma": { specialties: ["Pulmonology"], isEmergency: true },
  "breathing": { specialties: ["Pulmonology", "Emergency Medicine"], isEmergency: true },
  "lungs": { specialties: ["Pulmonology"], isEmergency: false },
  "tuberculosis": { specialties: ["Pulmonology"], isEmergency: false },
  "pneumonia": { specialties: ["Pulmonology", "General Physician"], isEmergency: true },

  // --- ONCOLOGY (Cancer) ---
  "cancer": { specialties: ["Oncology"], isEmergency: false },
  "tumor": { specialties: ["Oncology", "Surgery"], isEmergency: false },
  "chemotherapy": { specialties: ["Oncology"], isEmergency: false },

  // --- ENDOCRINOLOGY (Hormones) ---
  "diabetes": { specialties: ["Endocrinology", "General Physician"], isEmergency: false },
  "sugar": { specialties: ["Endocrinology", "General Physician"], isEmergency: false },
  "thyroid": { specialties: ["Endocrinology"], isEmergency: false },
  "hormone": { specialties: ["Endocrinology"], isEmergency: false }
};