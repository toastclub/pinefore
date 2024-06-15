# The Netscape Bookmarks Format

[Microsoft](<https://learn.microsoft.com/en-us/previous-versions/windows/internet-explorer/ie-developer/platform-apis/aa753582(v=vs.85)>) had the best docs on this format, but this hasn't been updated to cover modern usage. I describe a parsing methodology that works across many implementations that have subtly diverged. It may also be useful to reference source code of major browsers, like [Chromium](https://source.chromium.org/chromium/chromium/src/+/main:chrome/utility/importer/bookmark_html_reader.cc;l=107;drc=90cac1911508d3d682a67c97aa62483eb712f69a;bpv=0;bpt=1).

Bookmarks should begin like

```
<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!--This is an automatically generated file.
It will be read and overwritten.
Do Not Edit! -->
<Title>Bookmarks</Title>
<H1>Bookmarks</H1>
```

Modern implementations may include a meta chartype specifier, and may include no comment:

```
<!DOCTYPE NETSCAPE-Bookmark-file-1>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
```

The `<TITLE>` may have changed. The `<H1>` may have changed. Chrome parses the charset like this:

```cpp
bool ParseCharsetFromLine(const std::string& line, std::string* charset) {
  if (!base::StartsWith(line, "<META", base::CompareCase::INSENSITIVE_ASCII) ||
      (line.find("CONTENT=\"") == std::string::npos &&
       line.find("content=\"") == std::string::npos)) {
    return false;
  }
  const char kCharset[] = "charset=";
  size_t begin = line.find(kCharset);
  if (begin == std::string::npos)
    return false;
  begin += sizeof(kCharset) - 1;
  size_t end = line.find_first_of('\"', begin);
  *charset = line.substr(begin, end - begin);
  return true;
}
```

If it is a folder, it will be `<DT><H3 ...>`. We are not interested in this.

In all other cases, we are looking for a line with `<A>`. If it is a feed, it will contain `FEED="true" FEEDURL="..."`

If it is a web link, it should contain the following properties: `ADD_DATE`, `LAST_VISIT`, `LAST_MODIFIED`.

The inner value will be the title. Times are seconds since 1970. All of these values should be assumed nullable. The presence of a `FEEDURL` means it is a feed.

## Extensions

If it is pinboard, there will be `<DD>`s, but no closing tags.

Pinboard bookmarks contain the following additional properies: `PRIVATE`, `TOREAD`, `TAGS` where bools are `"0"|"1"` and tags are comma deliminated.

## Parsing Strats

## Other refs

Referencing the Chromium sourcecode is helpful for bookmarks parsing strategy:

```cpp
bool ParseBookmarkFromLine(const std::string& lineDt,
                           const std::string& charset,
                           std::u16string* title,
                           GURL* url,
                           GURL* favicon,
                           std::u16string* shortcut,
                           base::Time* add_date,
                           std::u16string* post_data) {
  const char kItemOpen[] = "<A";
  const char kItemClose[] = "</A>";
  const char kFeedURLAttribute[] = "FEEDURL";
  const char kHrefAttribute[] = "HREF";
  const char kIconAttribute[] = "ICON";
  const char kShortcutURLAttribute[] = "SHORTCUTURL";
  const char kAddDateAttribute[] = "ADD_DATE";
  const char kPostDataAttribute[] = "POST_DATA";
  std::string line = stripDt(lineDt);
  title->clear();
  *url = GURL();
  *favicon = GURL();
  shortcut->clear();
  post_data->clear();
  *add_date = base::Time();
  if (!base::StartsWith(line, kItemOpen, base::CompareCase::SENSITIVE))
    return false;
  size_t end = line.find(kItemClose);
  size_t tag_end = line.rfind('>', end) + 1;
  if (end == std::string::npos || tag_end < std::size(kItemOpen))
    return false;  // No end tag or start tag is broken.
  std::string attribute_list =
      line.substr(std::size(kItemOpen), tag_end - std::size(kItemOpen) - 1);
  // We don't import Live Bookmark folders, which is Firefox's RSS reading
  // feature, since the user never necessarily bookmarked them and we don't
  // have this feature to update their contents.
  std::string value;
  if (GetAttribute(attribute_list, kFeedURLAttribute, &value))
    return false;
  // Title
  base::CodepageToUTF16(line.substr(tag_end, end - tag_end), charset.c_str(),
                        base::OnStringConversionError::SKIP, title);
  *title = base::UnescapeForHTML(*title);
  // URL
  if (GetAttribute(attribute_list, kHrefAttribute, &value)) {
    std::u16string url16;
    base::CodepageToUTF16(value, charset.c_str(),
                          base::OnStringConversionError::SKIP, &url16);
    url16 = base::UnescapeForHTML(url16);
    *url = GURL(url16);
  }
  // Favicon
  if (GetAttribute(attribute_list, kIconAttribute, &value))
    *favicon = GURL(value);
  // Keyword
  if (GetAttribute(attribute_list, kShortcutURLAttribute, &value)) {
    base::CodepageToUTF16(value, charset.c_str(),
                          base::OnStringConversionError::SKIP, shortcut);
    *shortcut = base::UnescapeForHTML(*shortcut);
  }
  // Add date
  if (GetAttribute(attribute_list, kAddDateAttribute, &value)) {
    int64_t time;
    base::StringToInt64(value, &time);
    // Upper bound it at 32 bits.
    if (0 < time && time < (1LL << 32))
      *add_date = base::Time::FromTimeT(time);
  }
  // Post data.
  if (GetAttribute(attribute_list, kPostDataAttribute, &value)) {
    base::CodepageToUTF16(value, charset.c_str(),
                          base::OnStringConversionError::SKIP, post_data);
    *post_data = base::UnescapeForHTML(*post_data);
  }
  return true;
}
```
