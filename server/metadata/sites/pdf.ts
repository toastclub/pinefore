export function getMetadataFromPdf(data: string) {
  try {
    let tIdx = data.indexOf("/Title(");
    let title: string;
    if (tIdx == -1) {
      tIdx = data.indexOf("<dc:title>");
      // we know the title was in /Title( ... )
      if (tIdx == -1) {
        return null;
      } else {
        title = data.substring(
          tIdx + 10,
          data.indexOf("</dc:title>", tIdx + 10)
        );
        // remove html
        title = title.replaceAll(/<[^>]*>?/gm, "");
      }
    } else {
      title = data.substring(tIdx + 7, data.indexOf(")", tIdx + 7));
    }
    return {
      mode: "pdf",
      title: title || null,
      description: null,
    };
  } catch (e) {}
}
