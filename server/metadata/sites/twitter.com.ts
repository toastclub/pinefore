// vendored from https://github.com/vercel-labs/react-tweet

export interface TweetUser {
  id_str: string;
  name: string;
  profile_image_url_https: string;
  profile_image_shape: "Circle" | "Square" | "Hexagon";
  screen_name: string;
  verified: boolean;
  verified_type?: "Business" | "Government";
  is_blue_verified: boolean;
}

/**
 * Base tweet information shared by a tweet, a parent tweet and a quoted tweet.
 */
export interface TweetBase {
  /**
   * Language code of the tweet. E.g "en", "es".
   */
  lang: string;
  /**
   * Creation date of the tweet in the format ISO 8601.
   */
  created_at: string;
  /**
   * Text range of the tweet text.
   */
  /*display_text_range: Indices*/
  /**
   * All the entities that are part of the tweet. Like hashtags, mentions, urls, etc.
   */
  /*entities: TweetEntities*/
  /**
   * The unique identifier of the tweet.
   */
  id_str: string;
  /**
   * The tweet text, including the raw text from the entities.
   */
  text: string;
  /**
   * Information about the user who posted the tweet.
   */
  user: TweetUser;
  /**
   * Edit information about the tweet.
   */
  /*edit_control: TweetEditControl
  isEdited: boolean
  isStaleEdit: boolean*/
}

/**
 * A tweet as returned by the the Twitter syndication API.
 */
export interface Tweet extends TweetBase {
  __typename: "Tweet";
  favorite_count: number;
  /*mediaDetails?: MediaDetails[];
  photos?: TweetPhoto[];
  video?: TweetVideo;*/
  conversation_count: number;
  news_action_type: "conversation";
  quoted_tweet?: QuotedTweet;
  in_reply_to_screen_name?: string;
  in_reply_to_status_id_str?: string;
  in_reply_to_user_id_str?: string;
  parent?: TweetParent;
  possibly_sensitive?: boolean;
}

/**
 * The parent tweet of a tweet reply.
 */
export interface TweetParent extends TweetBase {
  reply_count: number;
  retweet_count: number;
  favorite_count: number;
}

/**
 * A tweet quoted by another tweet.
 */
export interface QuotedTweet extends TweetBase {
  reply_count: number;
  retweet_count: number;
  favorite_count: number;
  //mediaDetails?: MediaDetails[];
  self_thread: {
    id_str: string;
  };
}

const SYNDICATION_URL = "https://cdn.syndication.twimg.com";

export class TwitterApiError extends Error {
  status: number;
  data: any;

  constructor({
    message,
    status,
    data,
  }: {
    message: string;
    status: number;
    data: any;
  }) {
    super(message);
    this.name = "TwitterApiError";
    this.status = status;
    this.data = data;
  }
}

const TWEET_ID = /^[0-9]+$/;

function getToken(id: string) {
  return ((Number(id) / 1e15) * Math.PI)
    .toString(6 ** 2)
    .replace(/(0+|\.)/g, "");
}

/**
 * Fetches a tweet from the Twitter syndication API.
 */
export async function fetchTweet(
  id: string,
  fetchOptions?: RequestInit
): Promise<{ data?: Tweet; tombstone?: true; notFound?: true }> {
  if (id.length > 40 || !TWEET_ID.test(id)) {
    throw new Error(`Invalid tweet id: ${id}`);
  }

  const url = new URL(`${SYNDICATION_URL}/tweet-result`);

  url.searchParams.set("id", id);
  url.searchParams.set("lang", "en");
  url.searchParams.set(
    "features",
    [
      "tfw_timeline_list:",
      "tfw_follower_count_sunset:true",
      "tfw_tweet_edit_backend:on",
      "tfw_refsrc_session:on",
      "tfw_fosnr_soft_interventions_enabled:on",
      "tfw_show_birdwatch_pivots_enabled:on",
      "tfw_show_business_verified_badge:on",
      "tfw_duplicate_scribes_to_settings:on",
      "tfw_use_profile_image_shape_enabled:on",
      "tfw_show_blue_verified_badge:on",
      "tfw_legacy_timeline_sunset:true",
      "tfw_show_gov_verified_badge:on",
      "tfw_show_business_affiliate_badge:on",
      "tfw_tweet_edit_frontend:on",
    ].join(";")
  );
  url.searchParams.set("token", getToken(id));

  const res = await fetch(url.toString(), fetchOptions);
  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json() : undefined;

  if (res.ok) {
    if (data?.__typename === "TweetTombstone") {
      return { tombstone: true };
    }
    return { data };
  }
  if (res.status === 404) {
    return { notFound: true };
  }

  throw new TwitterApiError({
    message:
      typeof data.error === "string"
        ? data.error
        : `Failed to fetch tweet at "${url}" with "${res.status}".`,
    status: res.status,
    data,
  });
}
