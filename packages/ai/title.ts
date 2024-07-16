export function generateLLamaTitlePrompt(text: string) {
  let message = `You are given a short article below. Please reduce it to under 20 words. Only state information presented to you.

### Article:

${text}

### Title:`;
  return message;
}
