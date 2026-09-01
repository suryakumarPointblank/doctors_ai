export const ZONE_MANAGERS: Record<string, string> = {
  "South 1": "Mr.Chelvan",
  "South 2": "Mr.Rajeev",
  West: "Mr.Shajie",
  North: "Mr.Serveshwer",
  East: "Mr.Subir",
};

export const ZONES = Object.keys(ZONE_MANAGERS);

export const CITY_TYPES = ["Metro", "Non-metro"];

export const PRACTICE_TYPES = ["Private clinic", "Corporate Hospital", "Nursing Home/Polyclinic"];

export const INPUTS_NEEDED = ["LAMA", "A2 Poster"];

export const REGIONAL_LANGUAGES = [
  "Hindi",
  "Marathi",
  "Kannada",
  "Tamil",
  "Telugu",
  "English",
  "Malayalam",
  "Gujarati",
  "Odia",
  "Bengali",
  "Assamese",
];

export const VOICE_SCRIPT_TEMPLATE = `Hello, I am Dr. [Your Name], [Your Degree]. Over the years, I have treated
many patients dealing with this condition, and I have seen first-hand how the right
guidance and timely care can make a real difference to their recovery and quality of life.
Based on my clinical experience, I recommend this treatment to my patients because it is
safe, effective, and backed by strong clinical evidence. It is important to take the
medication exactly as prescribed and to complete the full course, even if you start
feeling better before it is finished. If you notice any unusual symptoms or side effects,
please reach out to your doctor immediately rather than stopping the treatment on your own.
As always, please consult your doctor before starting any new medication, and do not
hesitate to ask questions about your treatment plan. Thank you, and take care of your health.`;
