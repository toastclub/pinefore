# Every bug I found via automated tests

- 🟨: getBackoff doesn't actually use the last time the feed was updated possibly
- ✅: getBackoff was returning negative values for the fallback
- ✅: Setting pins to private during creation didn't work due to `||`
- ✅: RSS feed parsing frequently failed due to missing `?.` operators
- 🙄✅: RSS feeds not ordered by date
