export function generateLLamaTitlePrompt(text: string) {
  let message = `You are given a short article below. Please reduce it to under 20 words. Only state information presented to you. Wrap the title in quotes and do not say anything other than the title.

### Article:

${text}

### Title:`;
  return message;
}
