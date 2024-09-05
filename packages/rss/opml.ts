import { xml2js, js2xml } from "xml-js";

interface RSSOPML {
  dateCreated?: Date;
  title?: string;
  items: RSSOPMLItem[];
}

interface RSSOPMLItem {
  title?: string;
  xmlUrl?: string;
  htmlUrl?: string;
  categories?: string[];
}

class RSSOPMLError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RSSOPMLError";
  }
}

export function importOPML(opml: string): RSSOPML {
  let parsed: any = xml2js(opml, {
    compact: true,
    ignoreComment: true,
    alwaysArray: true,
  });
  let body = parsed.opml[0]?.body[0];
  if (!body) {
    throw new RSSOPMLError("No body element found in OPML");
  }
  let working: RSSOPML = {
    items: [],
  };
  if (parsed.opml[0]?.head?.[0]) {
    working.dateCreated = parsed.opml[0]?.head[0].dateCreated?.[0]?._text;
    if (working.dateCreated) {
      working.dateCreated = new Date(working.dateCreated);
    }
    working.title = parsed.opml[0]?.head[0].title?.[0]?._text;
  }
  let currentCategory: string[] = [];
  let processOutline = (outline: any) => {
    let isCategory =
      outline._attributes.text &&
      // current outline doesn't have htmlUrl or xmlUrl
      !outline._attributes.htmlUrl &&
      !outline._attributes.xmlUrl;
    if (isCategory) {
      currentCategory = [...currentCategory, outline._attributes.text];
    } else {
      working.items.push({
        title: outline._attributes?.title,
        xmlUrl: outline._attributes?.xmlUrl,
        htmlUrl: outline._attributes?.htmlUrl,
        categories: [...currentCategory],
      });
    }
    if (outline.outline) {
      for (let child of outline.outline) {
        processOutline(child);
      }
      if (isCategory) {
        currentCategory.pop();
      }
    }
  };
  for (let outline of body.outline) {
    processOutline(outline);
  }
  // combine the cats of outlines with the same url
  let combined: RSSOPMLItem[] = [];
  working.items.forEach((item) => {
    let existing = combined.find((c) => c.xmlUrl === item.xmlUrl);
    if (existing) {
      existing.categories = [
        ...new Set([
          ...(existing.categories || []),
          ...(item.categories || []),
        ]),
      ];
    } else {
      combined.push(item);
    }
  });
  working.items = combined;
  return working;
}

export function exportOPML(opml: RSSOPML): string {
  let working: any = {
    opml: {
      _attributes: {
        version: "2.0",
      },
      head: {
        title: {
          _text: opml.title,
        },
        dateCreated: {
          _text: opml.dateCreated?.toISOString(),
        },
      },
      body: {
        outline: [],
      },
    },
  };
  for (let item of opml.items) {
    // for each item, for each category, create a new outline
    for (let category of item.categories || []) {
      let current = working.opml.body.outline;
      let existing = current.find((c) => c._attributes.text === category);
      if (existing) {
        current = existing.outline;
      } else {
        let newOutline = {
          _attributes: {
            text: category,
          },
          outline: [],
        };
        current.push(newOutline);
        current = newOutline.outline;
      }
      current.push({
        _attributes: {
          title: item.title,
          xmlUrl: item.xmlUrl,
          htmlUrl: item.htmlUrl,
        },
      });
    }
  }
  return js2xml(working, { compact: true });
}
