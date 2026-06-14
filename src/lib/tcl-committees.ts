export type Question =
  | { id: string; type: "text" | "email" | "tel" | "url" | "textarea"; label: string; required?: boolean; placeholder?: string }
  | { id: string; type: "select" | "radio"; label: string; required?: boolean; options: string[] }
  | { id: string; type: "checkbox"; label: string; required?: boolean; options: string[] }
  | { id: string; type: "scale"; label: string; required?: boolean; min: number; max: number; minLabel?: string; maxLabel?: string };

export interface Committee {
  id: string;
  icon: string;
  name: string;
  tagline: string;
  desc: string;
  director: { name: string; role: string; bio: string };
  highlights: string[];
  questions: Question[];
}

export const COMMITTEES: Committee[] = [
  {
    id: "sports", icon: "⚽", name: "Sports Committee",
    tagline: "Build camaraderie through sport",
    desc: "Organise tournaments, intramurals, and fitness events that bring TCL members together on and off the pitch.",
    director: { name: "Daniel A.", role: "Director, Sports", bio: "Captained intramural football. Built Babcock's intra-hall league." },
    highlights: ["Inter-committee tournaments", "Fitness Fridays", "Game-day media coverage", "Sports-tech experiments"],
    questions: [
      { id: "sports", type: "checkbox", label: "Which sports interest you?", options: ["Football", "Basketball", "Volleyball", "Athletics", "Table Tennis", "E-sports"], required: true },
      { id: "role", type: "radio", label: "What role suits you best?", options: ["Player", "Coach", "Organiser", "Referee", "Hype-person"], required: true },
      { id: "bg", type: "textarea", label: "Tell us about your sports background", required: true },
    ],
  },
  {
    id: "academic", icon: "📚", name: "Academic Committee",
    tagline: "Excellence in and beyond the classroom",
    desc: "Run study groups, mentorships, and academic clinics that help TCL members thrive academically.",
    director: { name: "Esther O.", role: "Director, Academic", bio: "First-class scholar, runs the TCL peer-tutoring circle." },
    highlights: ["Past-question library", "Peer mentorship", "Career-prep clinics", "Scholarship watch"],
    questions: [
      { id: "dept", type: "text", label: "Your department", required: true },
      { id: "areas", type: "checkbox", label: "Subject areas you can support", options: ["Sciences", "Engineering", "Business", "Computer Science", "Health Sciences", "Arts & Humanities"], required: true },
      { id: "cgpa", type: "select", label: "CGPA range", options: ["4.50+", "4.00 – 4.49", "3.50 – 3.99", "3.00 – 3.49", "Below 3.00"], required: true },
      { id: "help", type: "textarea", label: "How would you help fellow students?", required: true },
    ],
  },
  {
    id: "marketing", icon: "📣", name: "Marketing Committee",
    tagline: "Tell TCL's story everywhere",
    desc: "Design campaigns, posters, and growth experiments that put TCL on every Babcock student's radar.",
    director: { name: "Tunde B.", role: "Director, Marketing", bio: "Ran growth for two campus startups." },
    highlights: ["Quarterly campaigns", "Brand-design sprints", "Cross-campus collabs", "Growth experiments"],
    questions: [
      { id: "skills", type: "checkbox", label: "Marketing skills you have", options: ["Copywriting", "Graphic design", "Video editing", "Strategy", "Analytics", "Ads"], required: true },
      { id: "idea", type: "textarea", label: "Pitch a campaign idea for TCL", required: true },
      { id: "portfolio", type: "url", label: "Portfolio link (optional)", placeholder: "https://..." },
    ],
  },
  {
    id: "finance", icon: "💰", name: "Finance Committee",
    tagline: "Sustainable, well-resourced impact",
    desc: "Steward TCL's budget, sponsorships, and member dues with transparent processes.",
    director: { name: "Joy U.", role: "Director, Finance", bio: "Accounting major; treasurer at two student bodies." },
    highlights: ["Quarterly budgeting", "Sponsorship pipeline", "Member-dues platform", "Transparent reports"],
    questions: [
      { id: "bg", type: "radio", label: "Finance background", options: ["Studying Finance / Accounting", "Some coursework", "Self-taught", "No formal background"], required: true },
      { id: "tools", type: "checkbox", label: "Tools you've used", options: ["Excel", "Google Sheets", "QuickBooks", "Notion", "SAP", "None yet"] },
      { id: "conf", type: "scale", label: "Comfort handling confidential data", min: 1, max: 5, minLabel: "Low", maxLabel: "Very high", required: true },
      { id: "why", type: "textarea", label: "Why Finance for TCL?", required: true },
    ],
  },
  {
    id: "social", icon: "📱", name: "Social Media Committee",
    tagline: "Build TCL's online voice",
    desc: "Run TCL's Instagram, TikTok, and WhatsApp presence with consistent, high-quality content.",
    director: { name: "Maryam K.", role: "Director, Social", bio: "Grew a campus page from 0 to 12k in one semester." },
    highlights: ["Daily content calendar", "Reels & TikTok", "Community moderation", "Analytics reviews"],
    questions: [
      { id: "platforms", type: "checkbox", label: "Platforms you use actively", options: ["Instagram", "TikTok", "X / Twitter", "YouTube", "LinkedIn", "Threads"], required: true },
      { id: "handle", type: "text", label: "Your main handle (without @)", required: true },
      { id: "community", type: "select", label: "Largest community you've managed", options: ["< 500", "500 – 2k", "2k – 10k", "10k – 50k", "50k+"] },
      { id: "style", type: "textarea", label: "Describe your content style", required: true },
    ],
  },
  {
    id: "content", icon: "🎙️", name: "Content Council",
    tagline: "TCL's creative engine",
    desc: "Write, film, podcast, and produce the long-form stories that anchor TCL's voice on campus.",
    director: { name: "Ife A.", role: "Director, Content", bio: "Hosts a campus podcast with 5k monthly listeners." },
    highlights: ["Weekly podcast", "Long-form essays", "Mini-documentaries", "Creator collabs"],
    questions: [
      { id: "formats", type: "checkbox", label: "Content formats you work in", options: ["Video", "Podcast", "Writing", "Photography"], required: true },
      { id: "best", type: "textarea", label: "Best content you've made — describe it", required: true },
      { id: "portfolio", type: "url", label: "Portfolio link (optional)", placeholder: "https://..." },
    ],
  },
  {
    id: "photography", icon: "📷", name: "Photography Committee",
    tagline: "Visual storytelling for Babcock",
    desc: "Capture TCL events, portraits, and campus moments with a distinctive editorial eye.",
    director: { name: "Samuel E.", role: "Director, Photography", bio: "Shot 4 campus weeks and 20+ portrait sessions." },
    highlights: ["Event coverage", "Portrait sessions", "Editorial shoots", "Studio 25 collabs"],
    questions: [
      { id: "gear", type: "radio", label: "Gear level", options: ["Pro DSLR / Mirrorless", "Entry-level camera", "Phone only", "Borrow / no gear"], required: true },
      { id: "bg", type: "textarea", label: "Photography background", required: true },
      { id: "portfolio", type: "url", label: "Portfolio link (optional)", placeholder: "https://..." },
      { id: "types", type: "checkbox", label: "Shoot types you enjoy", options: ["Portraits", "Events", "Editorial", "Product", "Sports", "Street"] },
    ],
  },
  {
    id: "events", icon: "🎉", name: "Events Committee",
    tagline: "Unforgettable Babcock experiences",
    desc: "Concept, plan, and execute TCL's signature gatherings — from mixers to the year-end Awards.",
    director: { name: "Praise N.", role: "Director, Events", bio: "Produced two Babcock-wide concerts." },
    highlights: ["TCL Mixers", "Awards Night", "Workshops & masterclasses", "Off-campus retreats"],
    questions: [
      { id: "exp", type: "textarea", label: "An event you've helped organise", required: true },
      { id: "skills", type: "checkbox", label: "Event skills", options: ["Logistics", "Decor", "MC / Host", "Tech / AV", "Catering", "Photography"], required: true },
      { id: "stress", type: "scale", label: "Stress tolerance under deadlines", min: 1, max: 5, minLabel: "Low", maxLabel: "Iron nerves", required: true },
    ],
  },
  {
    id: "partnerships", icon: "🤝", name: "Partnerships Committee",
    tagline: "Building TCL's external network",
    desc: "Open doors with brands, alumni, and campus orgs so TCL members get opportunities that matter.",
    director: { name: "Chika I.", role: "Director, Partnerships", bio: "Closed sponsorships with 6 SMEs in 2024." },
    highlights: ["Brand sponsorships", "Alumni network", "Internship pipeline", "Joint events"],
    questions: [
      { id: "idea", type: "textarea", label: "A partnership idea for TCL", required: true },
      { id: "exp", type: "radio", label: "Outreach experience", options: ["Lots — I've closed deals", "Some pitches", "Helped a friend", "None yet — eager to learn"], required: true },
      { id: "industries", type: "checkbox", label: "Industries you have contacts in", options: ["Tech", "Fashion", "FMCG", "Media", "Finance", "Hospitality"] },
    ],
  },
  {
    id: "tech", icon: "💻", name: "Tech & Innovation Committee",
    tagline: "The digital backbone of TCL",
    desc: "Build TCL's platforms, dashboards, and member tools. Ship what other committees rely on.",
    director: { name: "Ade F.", role: "Director, Tech", bio: "Shipped 3 campus apps; hackathon finalist 2x." },
    highlights: ["Member portal", "Studio booking system", "Internal dashboards", "AI experiments"],
    questions: [
      { id: "skills", type: "checkbox", label: "Skills you have", options: ["React", "Node", "Design / Figma", "DevOps", "AI / ML", "Mobile"], required: true },
      { id: "project", type: "textarea", label: "Describe a project you've built", required: true },
      { id: "github", type: "url", label: "GitHub or portfolio", placeholder: "https://github.com/...", required: true },
    ],
  },
];

export function findCommittee(id: string): Committee | undefined {
  return COMMITTEES.find((c) => c.id === id);
}

export function formatNaira(n: number): string {
  return "₦" + n.toLocaleString("en-NG");
}