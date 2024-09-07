import { stringToBoolean } from "lib/types";
import { unescape } from "@std/html/entities";
import entityList from "@std/html/named-entity-list.json" with { type: "json" };

interface Bookmark {
  title: string;
  url: string;
  tags?: string[];
  description?: string;
  addedAt?: Date | undefined;
  modifiedAt?: Date | undefined;
  visitedAt?: Date | undefined;
  toRead?: boolean;
  private?: boolean;
}

export function netscapeHTMLImporter(
  file: string,
  options: {
    defaults: {
      toRead: boolean;
      private: boolean;
    };
  }
) {
  let lines = file.split("\n");
  let bookmarks: Bookmark[] = [];
  let feeds: Bookmark[] = [];
  let isDDMode = false;
  let workingDescription = "";

  for (let line of lines) {
    line = line.trim();
    if (line.startsWith("<")) {
      if (isDDMode) {
        bookmarks[bookmarks.length - 1].description = workingDescription.trim();
        workingDescription = "";
      }
      isDDMode = false;
    }
    if (
      line.startsWith("<DT>") ||
      line.startsWith("<p>") ||
      line.startsWith("<DL>") ||
      line.startsWith("<li>")
    ) {
      line = line
        .replace("<DT>", "")
        .replace("<p>", "") // pinboard
        .replace("<DL>", "")
        .replace("<li>", "") // pocket
        .trim();
    }
    if (line.startsWith("<A") || line.startsWith("<a")) {
      let title = (line.match(/<[Aa].*?>(.*?)</) || [])[1];
      let url = (line.match(/(?:HREF|href)="(.*?)"/) || [])[1];
      if (title == undefined || url == undefined || line.includes('FEEDURL="'))
        continue;
      title = unescape(title, { entityList});
      let tags = line.match(/(?:TAGS|tags)="(.*?)"/)?.[1].split(",");
      let addedAt =
        new Date(
          1000 *
            Number((line.match(/(?:ADD_DATE|time_added)="(.*?)"/) || [])[1])
        ) || undefined;
      let modifiedAt =
        new Date(
          1000 * Number((line.match(/LAST_MODIFIED="(.*?)"/) || [])[1])
        ) || undefined;
      let visitedAt =
        new Date(1000 * Number((line.match(/LAST_VISIT="(.*?)"/) || [])[1])) ||
        undefined;
      let toRead = stringToBoolean(
        (line.match(/TOREAD="([01]|true|false)"/) || [])[1]
      );
      let tempPrivate = stringToBoolean(
        (line.match(/PRIVATE="([01]|true|false)"/) || [])[1]
      );
      let feedUrl = (line.match(/FEEDURL="(.*?)"/) || [])[1] || undefined;
      let constructed = {
        title,
        url,
        tags,
        addedAt:
          addedAt instanceof Date && !isNaN(addedAt.getTime())
            ? addedAt
            : undefined,
        modifiedAt:
          modifiedAt instanceof Date && !isNaN(modifiedAt.getTime())
            ? modifiedAt
            : undefined,
        visitedAt:
          visitedAt instanceof Date && !isNaN(visitedAt.getTime())
            ? visitedAt
            : undefined,
        toRead: toRead == undefined ? options.defaults.toRead : toRead,
        private:
          tempPrivate == undefined ? options.defaults.private : tempPrivate,
      };
      if (feedUrl) {
        feeds.push({ ...constructed, url: feedUrl });
      } else {
        bookmarks.push(constructed);
      }
    }
    if (line.startsWith("<DD>") || isDDMode) {
      isDDMode = true;
      line = line.replace("<DD>", "").trim();
      workingDescription += line;
    }
  }
  if (workingDescription.length > 0) {
    workingDescription = workingDescription.replaceAll(
      /<blockquote>((.|\n)*?)<\/blockquote>/gm,
      "> $1\n\n"
    );
  }
  return {
    bookmarks,
    feeds,
  };
}
