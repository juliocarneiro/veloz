export interface Quote {
  text: string;
  author: string;
}

const quotes: Quote[] = [
  { text: 'Simplicity is prerequisite for reliability.', author: 'Edsger W. Dijkstra' },
  { text: 'Make it work, make it right, make it fast.', author: 'Kent Beck' },
  { text: 'The best code is no code at all.', author: 'Jeff Atwood' },
];

// Stands in for a real API call: swap it for fetch() to your backend.
export async function getQuote(): Promise<Quote> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return quotes[Math.floor(Math.random() * quotes.length)]!;
}
