// surveySchema.ts (English version)
export type Question =
  | { section: string; id: string; text: string; type: 'single_choice'; options: string[] }
  | {
    section: string;
    id: string;
    text: string;
    type: 'likert_1_5';
    options: ['1', '2', '3', '4', '5'];
  }
  | { section: string; id: string; text: string; type: 'long_text'; options?: undefined };

export const SURVEY_EN: Question[] = [
  // Initial Characterization
  {
    section: "Initial Characterization",
    id: "1",
    text: "Role",
    type: "single_choice",
    options: ["No direct reports", "Supervisor/Manager", "Executive Team Member"],
  },
  {
    section: "Initial Characterization",
    id: "2",
    text: "Group",
    type: "single_choice",
    options: ["Corporate", "Operations"],
  },
  {
    section: "Initial Characterization",
    id: "3",
    text: "Area",
    type: "single_choice",
    options: [
      "Sales",
      "Procurement",
      "Logistics",
      "Operations",
      "Business Technology",
      "Finance",
      "Controlling",
      "People (HR)",
      "Marketing",
      "Innovation",
      "Other",
    ],
  },
  {
    section: "Initial Characterization",
    id: "4",
    text: "Years at the Company",
    type: "single_choice",
    options: ["0-2", "3-5", "6-10", ">10"],
  },
  {
    section: "Initial Characterization",
    id: "5",
    text:
      "Thinking about the AI tools the company has officially provided or recommended, how often do you use them in your work?",
    type: "single_choice",
    options: [
      "Daily",
      "Several times a week",
      "A few times a month",
      "Almost never",
      "Was not aware they existed / Do not have access",
    ],
  },
  {
    section: "Initial Characterization",
    id: "6",
    text:
      "Now, thinking only about your personal life (outside of work), how often do you use AI assistants like ChatGPT, Gemini, Copilot, etc.?",
    type: "single_choice",
    options: [
      "Daily",
      "Several times a week",
      "A few times a month",
      "Almost never",
      "Was not aware they existed / Do not have access",
    ],
  },
  {
    section: "Initial Characterization",
    id: "7",
    text:
      "When you use these assistants in your personal life, what types of activities do you find them most useful for? (Select the most relevant option)",
    type: "single_choice", // mantenemos 'single_choice' por consistencia, aunque en el Excel es multi-select
    options: [
      "Correct spelling or translate a text",
      "Ask quick questions, like using a search engine",
      "Write or improve an email or personal message",
      "Brainstorm ideas for a plan (e.g., a trip, a recipe, a project)",
      "Summarize a long article or video",
      "Learn about a new topic in a structured way",
      "Help with more complex tasks (e.g., data analysis, coding, checking a formula)",
      "Other",
    ],
  },

  // Block A: Strategy and Purpose
  {
    section: "Block A: Strategy and Purpose",
    id: "A1",
    text: "I clearly understand how AI is expected to help us improve our products, services, or the way we work.",
    type: "likert_1_5",
    options: ["1", "2", "3", "4", "5"],
  },
  {
    section: "Block A: Strategy and Purpose",
    id: "A2",
    text: "AI initiatives have the necessary resources (budget and staff) to be carried out effectively.",
    type: "likert_1_5",
    options: ["1", "2", "3", "4", "5"],
  },
  {
    section: "Block A: Strategy and Purpose",
    id: "A3",
    text: "I clearly understand how AI initiatives align with the goals of my area or team.",
    type: "likert_1_5",
    options: ["1", "2", "3", "4", "5"],
  },

  // Block B: Data and Platforms
  {
    section: "Block B: Data and Platforms",
    id: "B1",
    text: "When I need company data for my work, it is easy to find, and I trust its quality.",
    type: "likert_1_5",
    options: ["1", "2", "3", "4", "5"],
  },
  {
    section: "Block B: Data and Platforms",
    id: "B2",
    text: "The technological tools provided by the company are modern and well-maintained.",
    type: "likert_1_5",
    options: ["1", "2", "3", "4", "5"],
  },
  {
    section: "Block B: Data and Platforms",
    id: "B3",
    text: "There is an established practice to monitor, evaluate, and continuously improve AI models and solutions in production.",
    type: "likert_1_5",
    options: ["1", "2", "3", "4", "5"],
  },

  // Block C: Talent and Culture
  {
    section: "Block C: Talent and Culture",
    id: "C1",
    text: "Teams have the necessary skills (both technical and business) to work with AI in their processes.",
    type: "likert_1_5",
    options: ["1", "2", "3", "4", "5"],
  },
  {
    section: "Block C: Talent and Culture",
    id: "C2",
    text: "The company actively promotes learning and experimentation with AI across different areas.",
    type: "likert_1_5",
    options: ["1", "2", "3", "4", "5"],
  },
  {
    section: "Block C: Talent and Culture",
    id: "C3",
    text: "There are collaboration practices between business areas and technical teams to define, develop, and implement AI solutions.",
    type: "likert_1_5",
    options: ["1", "2", "3", "4", "5"],
  },
  {
    section: "Block C: Talent and Culture",
    id: "C4",
    text: "There are initiatives to retrain or reassign people in roles affected by automation and the use of AI.",
    type: "likert_1_5",
    options: ["1", "2", "3", "4", "5"],
  },

  // Block D: Governance and Ethics
  {
    section: "Block D: Governance and Ethics",
    id: "D1",
    text: "We have clear policies for the responsible use of AI, including privacy, security, bias, explainability, and regulatory compliance.",
    type: "likert_1_5",
    options: ["1", "2", "3", "4", "5"],
  },
  {
    section: "Block D: Governance and Ethics",
    id: "D2",
    text: "Clear roles and responsibilities have been established for decision-making and oversight of AI initiatives.",
    type: "likert_1_5",
    options: ["1", "2", "3", "4", "5"],
  },
  {
    section: "Block D: Governance and Ethics",
    id: "D3",
    text: "The company is transparent with customers and employees about the use and impact of AI.",
    type: "likert_1_5",
    options: ["1", "2", "3", "4", "5"],
  },

  // Block E: Use Cases and Value
  {
    section: "Block E: Use Cases and Value",
    id: "E1",
    text: "We develop AI solutions that significantly improve the customer experience.",
    type: "likert_1_5",
    options: ["1", "2", "3", "4", "5"],
  },
  {
    section: "Block E: Use Cases and Value",
    id: "E2",
    text: "We use AI to radically optimize our internal processes and achieve operational efficiency.",
    type: "likert_1_5",
    options: ["1", "2", "3", "4", "5"],
  },
  {
    section: "Block E: Use Cases and Value",
    id: "E4",
    text: "Our AI solutions are designed as reusable, scalable products or platforms (not just isolated projects).",
    type: "likert_1_5",
    options: ["1", "2", "3", "4", "5"],
  },
  {
    section: "Block E: Use Cases and Value",
    id: "E5",
    text: "We measure and transparently communicate the value generated by AI initiatives.",
    type: "likert_1_5",
    options: ["1", "2", "3", "4", "5"],
  },

  // Block F: Ecosystem
  {
    section: "Block F: Ecosystem",
    id: "F1",
    text: "We collaborate with external partners (e.g., startups, universities, providers) to accelerate AI innovation.",
    type: "likert_1_5",
    options: ["1", "2", "3", "4", "5"],
  },
  {
    section: "Block F: Ecosystem",
    id: "F2",
    text: "The company participates in external forums or communities to share and learn about AI.",
    type: "likert_1_5",
    options: ["1", "2", "3", "4", "5"],
  },
  {
    section: "Block F: Ecosystem",
    id: "F5",
    text: "Our technology infrastructure allows us to integrate data, services, and external partners to operate in a digital ecosystem.",
    type: "likert_1_5",
    options: ["1", "2", "3", "4", "5"],
  },

  // // Block G: Open Questions (optional, commented)
  // {
  //   section: "Block G: Open Questions",
  //   id: "G1",
  //   text: "Thinking specifically about employees, what do you see as the main resistance toward adopting new AI tools in their daily work?",
  //   type: "long_text",
  // },
  // {
  //   section: "Block G: Open Questions",
  //   id: "G2",
  //   text: "Beyond efficiency or sales metrics, in what ways do you believe AI could contribute to our core purpose as a company and our promise to customers?",
  //   type: "long_text",
  // },
  // {
  //   section: "Block G: Open Questions",
  //   id: "G3",
  //   text: "Would you like to share any ideas, thoughts, or expectations about the role of AI in your company?",
  //   type: "long_text",
  // },
];
