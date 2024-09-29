export function getWellknownNodeInfo(domain: string) {
  return {
    links: [
      {
        rel: "http://nodeinfo.diaspora.software/ns/schema/2.0",
        href: `https://${domain}/nodeinfo/2.0`,
      },
      {
        rel: "http://nodeinfo.diaspora.software/ns/schema/2.1",
        href: `https://${domain}/nodeinfo/2.1`,
      },
    ],
  };
}

type DefinedProtocols =
  | "activitypub"
  | "buddycloud"
  | "dfrn"
  | "diaspora"
  | "libertree"
  | "ostatus"
  | "pumpio"
  | "tent"
  | "xmpp"
  | "zot"
  | string;

/**
 * https://nodeinfo.diaspora.software/schema.html
 */
interface NodeInfoConfig {
  software: {
    name?: string;
    version?: string;
    repository?: string;
  } & Record<string, unknown>;
  protocols: DefinedProtocols[];
  services?: {
    inbound?: string[];
    outbound?: string[];
  };
  usage?: {
    users?: {
      total?: number;
      activeHalfyear?: number;
    };
    localPosts?: number;
    localComments?: number;
    localShares?: number;
  };
  openRegistrations: boolean;
  metadata?: Record<string, unknown>;
}

export function getNodeInfo(config: NodeInfoConfig, version: "2.0" | "2.1") {
  return {
    version,
    software: config.software,
    protocols: config.protocols,
    services: config.services,
    openRegistrations: config.openRegistrations,
    usage: config.usage,
    metadata: config.metadata,
  };
}
