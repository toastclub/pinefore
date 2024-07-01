import stringSimilarity from "../helpers/string-similarity";

export function tagsRanker(
  data: {
    tag: string;
    count: number;
    user_count?: number;
    entity_count?: number;
  }[],
  query?: { q?: string }
) {
  return data
    .map((tag) => {
      let ranking = 0;
      if (tag.user_count) {
        ranking += Math.sqrt(Number(tag.user_count));
      }
      if (tag.entity_count) {
        ranking += Math.pow(Number(tag.entity_count), 1 / 3);
      }
      ranking += Math.pow(Number(tag.count), 1 / 4);
      if (query?.q) {
        ranking += stringSimilarity(query.q, tag.tag);
      }
      return { tag, ranking };
    })
    .sort((a, b) => b.ranking - a.ranking)
    .map((a) => a.tag.tag);
}
