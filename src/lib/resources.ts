export type Category = "tools" | "skills" | "projects" | "knowledge";

export type Resource = {
  name: string;
  url: string;
  description: string;
  category: Category;
};

export const categories: { value: Category; label: string }[] = [
  { value: "tools", label: "Tools" },
  { value: "skills", label: "Skills" },
  { value: "projects", label: "Projects" },
  { value: "knowledge", label: "Knowledge" },
];

export const resources: Resource[] = [
  {
    name: "ElevenLabs",
    url: "https://elevenlabs.io/",
    description: "Free text-to-speech & AI voice generator.",
    category: "tools",
  },
  {
    name: "Poised",
    url: "https://www.poised.com/",
    description: "Free AI-powered communication coach.",
    category: "tools",
  },
  {
    name: "Galileo AI",
    url: "https://www.usegalileo.ai/explore",
    description: "Generate UI designs from natural language.",
    category: "tools",
  },
  {
    name: "MagicPath",
    url: "https://www.magicpath.ai/",
    description: "Design and iterate products with AI.",
    category: "tools",
  },
  {
    name: "Make",
    url: "https://www.make.com/en",
    description: "Automation software to connect apps and design workflows.",
    category: "tools",
  },
  {
    name: "Langflow",
    url: "https://www.langflow.org/",
    description: "Low-code AI builder for agentic and RAG applications.",
    category: "tools",
  },
  {
    name: "n8n",
    url: "https://n8n.io/",
    description: "AI workflow automation tool.",
    category: "tools",
  },
  {
    name: "FLORA",
    url: "https://www.florafauna.ai/",
    description: "Infinite canvas for connecting AI models and media.",
    category: "tools",
  },
  {
    name: "NotebookLM",
    url: "https://notebooklm.google/",
    description: "Note taking & research assistant powered by AI.",
    category: "tools",
  },
  {
    name: "Scite",
    url: "https://scite.ai/",
    description: "AI for research — smart citations for scientific papers.",
    category: "tools",
  },
  {
    name: "SciSpace",
    url: "https://typeset.io/",
    description: "AI chat for scientific PDFs.",
    category: "tools",
  },
  {
    name: "Elicit",
    url: "https://elicit.com/welcome",
    description: "The AI research assistant for literature reviews.",
    category: "tools",
  },
  {
    name: "There's An AI For That",
    url: "https://theresanaiforthat.com/",
    description: "The #1 AI aggregator — find an AI for any task.",
    category: "tools",
  },

  {
    name: "SkillsMP",
    url: "https://skillsmp.com/search",
    description: "Search agent skills by category and author.",
    category: "skills",
  },
  {
    name: "SkillHub",
    url: "https://www.skillhub.club/",
    description: "Agent skills marketplace.",
    category: "skills",
  },

  {
    name: "Google AI Studio",
    url: "https://aistudio.google.com/prompts/new_chat",
    description: "Prototype with Google's Gemini models.",
    category: "projects",
  },
  {
    name: "Google Labs",
    url: "https://labs.google/",
    description: "Experimental AI products from Google.",
    category: "projects",
  },
];

export function getFavicon(url: string, size = 128): string {
  const host = getHostname(url);
  return `https://www.google.com/s2/favicons?domain=${host}&sz=${size}`;
}

export function getHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
