export type Language = {
    id: string;           // Firestore doc id
    name: string;         // e.g., "Português"
    emoji?: string;       // e.g., "🇧🇷"
    color?: string;       // optional hex for badges
  };
  
  export type Entry = {
    id: string;           // `${date}_${languageId}`
    date: string;         // "YYYY-MM-DD"
    languageId: string;
    content: string;
    minutes: number;      // time spent
    effort: number;       // 1..5
    createdAt: number;    // epoch ms
    updatedAt: number;    // epoch ms
  };
  