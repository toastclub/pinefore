interface CDXRow {
  //urlkey?: string;
  timestamp?: Date;
  original?: URL;
  //mimetype?: string;
  statuscode?: number;
  //digest?: string;
  //redirect?: string;
  //metatags?: string;
  //file_size?: string;
  //offset?: string;
  //warc_filename?: string;
  raw: CDXRowRaw;
}

interface CDXRowRaw {
  timestamp?: number;
  original?: string;
}

/**
 * https://www.loc.gov/preservation/digital/formats/fdd/fdd000590.shtml
 *
 * CDX files have at least two versions consisting of 9 or 11 defined fields.
 * According to the 2006 version of the CDX specification,
 * "the first line in the file is a legend for interpreting the data, and the
 * following lines contain the data for referencing the corresponding pages within the host.
 * The first character of the file is the field delimiter used in the rest of the file.
 * This is followed by the literal "CDX" and then individual field markers" which are defined in the specification.
 * The default first line of CDX files is "CDX A b e a m s c k r V v D d g M n."
 *
 * The 2015 version of the CDX specification defines the 11 field version which includes:
 *
 * - urlkey (N): the URL of the captured web object, without the protocol (http://) or the leading www and in SURT format.
 * - timestamp (b): timestamp in the form YYYYMMDDhhmmss. The time represents
 * the point at which the web object was captured, measured in GMT, as recorded in the CDX index file.
 * - original (a): the URL of the captured web object, including the protocol (http://) and the leading www, if applicable, extracted from the CDX index file.
 * - mimetype (m): the IANA media type as recorded in the CDX.
 * - statuscode (s): the HTTP response code received from the server at the time of capture, e.g., 200, 404.
 * - digest (k): a unique, cryptographic hash of the web object's payload at the time of the crawl.
 * This provides a distinct fingerprint for the object; it is a Base32 encoded SHA-1 hash, derived from the CDX index file.
 * - redirect (r): likely blank or recorded with a "-"
 * - metatags (M): likely blank or recorded with a "-"
 * - file_size (S): the size of the web object, in bytes, derived from the CDX index file
 * - offset (V): the location of the resource in the compressed Web Archive (WARC) file which stores the full archived object
 * - WARC filename (g) - name of the compressed Web Archive (WARC) file which stores the full archived object
 *
 * The 2006 version of the CDX specification which defined the 9 field implementation
 * (which is considered legacy as of this writing in 2024) includes the same
 * fields as the 2015 version with the exception of the fields for metatags (M) and file_size (S)
 *
 * The wayback CDX API (https://github.com/internetarchive/wayback/tree/master/wayback-cdx-server)
 * returns the following: N b a m s k S
 *
 * https://iipc.github.io/warc-specifications/specifications/cdx-format/cdx-2015/
 *
 * With all that being said, for now I'm ignoring all this and using the CDX API's spec
 */
export function parseCdx(cdx: string, legend: string[] = []): void {
  let initial = cdx.split("\n").map((l) => l.split(" "));
  if (initial.length > 0 && initial[0][0] === "CDX") {
    legend = initial.shift()!;
    legend.pop();
  }
  let rows: CDXRow[] = [];
  for (const row of initial) {
    let obj: CDXRow = { raw: {} };
    obj.timestamp = new Date(
      row[1].replace(
        /^(\d{4})(\d\d)(\d\d)(\d\d)(\d\d)(\d\d)$/,
        "$4:$5:$6 $2/$3/$1"
      )
    );
    obj.original = new URL(row[2]);
    obj.raw = { timestamp: parseInt(row[1]), original: row[2] };
    obj.statuscode = parseInt(row[4]);
  }
}

export function getWaybackCdxUrl(
  url: string | URL,
  options: {
    /**
     * reduces length searched of parameter
     */
    collapse?: {
      /**
       * timestamp.
       * @example <caption>Limit results to 1 per hour</caption>
       * 10
       */
      tz: number;
    };
  } = {}
) {
  let urlObj = new URL("https://web.archive.org/cdx/search/cdx");
  urlObj.searchParams.set("url", url.toString());
  if (options.collapse?.tz) {
    urlObj.searchParams.set("collapse", `timestamp:${options.collapse.tz}`);
  }
  return urlObj;
}
