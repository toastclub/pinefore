export interface RSSQueueBody {
  id: number;
  url: string;
  // convert to date
  last_fetched_at: string | null;
}

export type MiniQueueMessage = {
  type: "rss";
  body: RSSQueueBody[];
};
