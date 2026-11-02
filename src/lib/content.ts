// All shared copy. Keep it word-for-word with design_handoff/reference/index.html.

export const SURVEY_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSfuRTl49MZc6-YOYjas6g9L1Ug8RAC9FkMcp62ep1VuHO90tw/viewform";

export const CONTACT_EMAIL = "admin@saans.me";

export const SOCIAL = [
  { label: "X", href: "#", title: "[X link]" },
  { label: "Instagram", href: "#", title: "[Instagram link]" },
  { label: "LinkedIn", href: "#", title: "[LinkedIn link]" },
];

export type ForTab = {
  label: string;
  title: string;
  copy: string;
  chips: string[];
  img: string;
  img2: string;
  alt: string;
};

export const FOR: ForTab[] = [
  {
    label: "Talk",
    title: "Someone to talk to, who gets to know you.",
    copy: "Text or voice, any hour, in English, Hindi or Hinglish. SAANS remembers what matters and learns your patterns, like when stress rises or sleep slips.",
    chips: ["Text or voice", "Remembers you", "Notices patterns"],
    img: "/screens/app-talk.webp",
    img2: "",
    alt: "SAANS chat screen",
  },
  {
    label: "Grow",
    title: "See yourself getting better.",
    copy: "Quick daily check-ins, a mood calendar, and programs like Better sleep in 6 weeks.",
    chips: ["Daily check-in", "Mood calendar", "Programs"],
    img: "/screens/app-grow.webp",
    img2: "",
    alt: "SAANS Grow screen with mood check-in and program progress",
  },
  {
    label: "Sleep and calm",
    title: "Calmer nights, lighter days.",
    copy: "Sleep stories and sounds, and calm games like Patang, where you fly a kite with your breath.",
    chips: ["Sleep stories", "Sounds", "Calm games"],
    img: "/screens/app-sleep.webp",
    img2: "/screens/app-play.webp",
    alt: "SAANS Sleep screen",
  },
  {
    label: "Help now",
    title: "Help, one tap away.",
    copy: "Helplines, breathing and your safety plan, even offline. If you turn it on, someone you trust gets a message to call you.",
    chips: ["Works offline", "Safety plan", "Trusted contact"],
    img: "/screens/app-helpnow.webp",
    img2: "",
    alt: "SAANS Help now screen",
  },
  {
    label: "Professional care",
    title: "Real care, when you're ready.",
    copy: "Book a verified psychologist or psychiatrist, online or in person, and choose exactly what they can see.",
    chips: ["Verified professionals", "You choose what's shared", "Online or in person"],
    img: "/screens/app-share.webp",
    img2: "/screens/app-pro.webp",
    alt: "SAANS screen showing what the therapist will see",
  },
];

export const FAQ: [string, string][] = [
  ["Is SAANS a therapist?", "No. SAANS is an AI companion. It can help you talk things through and notice patterns, and it connects you to real professionals when you need more."],
  ["When can I use it?", "We're opening to the first users soon. Join the waitlist and we'll email you once."],
  ["Which languages does it speak?", "English, Hindi and Hinglish, by text or voice."],
  ["Who can see my conversations?", "Only you. Your therapist sees only what you choose to share, and your college sees anonymous totals, never names."],
  ["What happens in a crisis?", "SAANS shows helplines right away and, if you've allowed it, messages someone you trust. If you're in danger, call your local emergency number."],
  ["How much will it cost?", "Starting free. A premium plan and professional sessions will be paid; we'll share prices before launch."],
  ["I'm a therapist. How do I get involved?", "Join the clinician pilot in the For clinicians section."],
  ["Can my college use SAANS?", 'Yes. Use "Talk to us" in the For colleges section.'],
];

export const MEMS = ["Prefers Hindi", "Exams in March", "Likes short replies"];

export type Helpline = {
  name: string;
  detail: string;
  tel?: string;
  display: string;
  external?: string;
};

export const HELPLINES: Helpline[] = [
  { name: "Emergency services", detail: "India and Europe, US, UK", tel: "112", display: "112 · 911 · 999" },
  { name: "Tele-MANAS", detail: "India · 24/7, free, many languages", tel: "14416", display: "14416" },
  { name: "iCall", detail: "India · Trained counsellors, Mon–Sat", tel: "+919152987821", display: "9152987821" },
  { name: "988 Suicide & Crisis Lifeline", detail: "US · Call or text, 24/7", tel: "988", display: "988" },
  { name: "Samaritans", detail: "UK and Ireland · 24/7, free", tel: "116123", display: "116 123" },
];

export const HELPLINE_OTHER = {
  text: "Somewhere else? Find a free line in your country",
  href: "https://findahelpline.com",
  display: "findahelpline.com",
};

export const ROLE_OPTIONS = ["Someone looking for support", "A clinician", "From a college"];
export const COUNTRY_OPTIONS = ["United States", "India", "Other"];
export const CLINICIAN_ROLES = ["Psychologist", "Psychiatrist", "Counsellor", "Psychotherapist", "Other"];
export const CLIENT_COUNTS = ["1–10", "11–30", "31+"];
export const COLLEGE_ROLES = ["Counsellor", "Wellness office", "Dean or leadership", "Faculty", "Other"];
export const STUDENT_COUNTS = ["under 2,000", "2,000–10,000", "10,000+"];
