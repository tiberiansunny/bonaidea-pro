// Brief bonuses. Edit text here; the form and the meter read from this file.
// Each optional answer unlocks one bonus. Answering all of them unlocks `complete`.
export interface Bonus { field: string; question: string; hint: string; reward: string; }

export const bonuses: Bonus[] = [
  { field: 'url', question: 'Product URL', hint: 'Site, app store or demo link', reward: 'Free style frame before you commit' },
  { field: 'formats', question: 'Formats you need', hint: 'Pick all that apply', reward: '+1 extra format at no cost' },
  { field: 'budget', question: 'Budget range', hint: 'Helps me suggest the right scope', reward: 'Fixed quote within 24 hours' },
  { field: 'refs', question: 'References you like', hint: 'Links to videos or sites', reward: 'Extra revision round' },
  { field: 'goal', question: 'Goal and audience', hint: 'What should viewers do after watching? (40+ characters)', reward: 'Free 15-min scoping call' },
];

export const complete = { reward: '−10% on your first project', note: 'Complete brief' };
