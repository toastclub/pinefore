import { Env } from "$index";

export async function embedCohere(
  text: string[],
  mode: "search_document" | "search_query" | "classification" | "clustering",
  env: Env
) {
  return await fetch("https://api.cohere.ai/v1/embed", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.COHERE_API_KEY}`,
    },
    body: JSON.stringify({
      model: "embed-english-light-v3.0",
      texts: text,
      input_type: mode,
    }),
  }).then(
    (res) =>
      res.json() as Promise<{
        response_type: "embeddings_float";
        embeddings: number[][];
      }>
  );
}
