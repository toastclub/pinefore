import { AwsClient } from "aws4fetch";
import type {
  StorageGetResponse,
  StorageHeadResponse,
  StorageProvider,
} from "./types";

interface S3Conditional {
  etagMatches?: string;
  etagDoesNotMatch?: string;
  uploadedBefore?: Date;
  uploadedAfter?: Date;
}

type S3StorageClass =
  | "STANDARD"
  | "REDUCED_REDUNDANCY"
  | "STANDARD_IA"
  | "ONEZONE_IA"
  | "INTELLIGENT_TIERING"
  | "GLACIER"
  | "DEEP_ARCHIVE"
  | "OUTPOSTS"
  | "GLACIER_IR"
  | "SNOW"
  | "EXPRESS_ONEZONE";

async function get<M extends "GET" | "HEAD">(
  path: string,
  client: AwsClient,
  endpoint: string,
  method: M,
  options?: {
    onlyIf?: S3Conditional;
    range?: { offset?: number; length?: number };
  }
): Promise<
  M extends "GET" ? StorageGetResponse | null : StorageHeadResponse | null
> {
  let headers: Record<string, string> = {};
  if (options) {
    if (options.onlyIf?.etagMatches)
      headers["If-Match"] = options.onlyIf.etagMatches;
    if (options.onlyIf?.etagDoesNotMatch)
      headers["If-Match"] = options.onlyIf.etagDoesNotMatch;
    if (options.onlyIf?.uploadedAfter)
      headers["If-Modified-Since"] = options.onlyIf.uploadedAfter.toString();
    if (options.onlyIf?.uploadedBefore)
      headers["If-Modified-Since"] = options.onlyIf.uploadedBefore.toString();
    if (options.range?.offset)
      headers["PartNumber"] = options.range.offset.toString();
    if (options.range?.length)
      headers["Range"] = options.range.length.toString();
  }
  const res = await client.fetch(endpoint + path, { headers, method });
  if (res.status == 404) return null;
  let obj = {
    key: path,
    version: res.headers.get("x-amz-version-id") || undefined,
    size: res.headers.get("Content-Length") || undefined,
    etag: res.headers.get("ETag") || undefined,
    httpEtag: res.headers.get("ETag") || undefined,
    checksums: {
      sha1: res.headers.get("x-amz-checksum-sha1") || undefined,
      sha256: res.headers.get("x-amz-checksum-sha256") || undefined,
    },
  };
  if (method == "GET") {
    return {
      ...obj,
      body: res.body,
      arrayBuffer: res.arrayBuffer,
      text: res.text,
      json: res.json,
      blob: res.blob,
    };
  }
  return obj;
}

/**
 * A subset of the R2 worker API
 */
export class S3Provider implements StorageProvider {
  client: AwsClient;
  endpoint: string;
  constructor(init: {
    accessKeyId: string;
    secretAccessKey: string;
    endpoint: string;
  }) {
    this.client = new AwsClient(init);
    this.endpoint = init.endpoint;
  }
  async get(
    path: string,
    options?: {
      onlyIf?: S3Conditional;
      range?: {
        /**
         *  for cf compat. offset == PartNumber
         */
        offset?: number;
        /**
         *  for cf compat. length == Range
         */
        length?: number;
      };
    }
  ) {
    return get(path, this.client, this.endpoint, "GET", options);
  }
  async head(
    path: string,
    options?: {
      onlyIf?: S3Conditional;
      range?: {
        /**
         *  for cf compat. offset == PartNumber
         */
        offset?: number;
        /**
         *  for cf compat. length == Range
         */
        length?: number;
      };
    }
  ) {
    return await get(path, this.client, this.endpoint, "HEAD", options);
  }
  async put(
    path: string,
    value:
      | ReadableStream
      | ArrayBuffer
      | ArrayBufferView
      | string
      | null
      | Blob,
    options?: {
      md5?: string;
      sha1?: string;
      sha256?: string;
      storageClass?: string;
    }
  ) {
    let headers: Record<string, string> = {};
    if (options?.md5) headers["Content-MD5"] = options.md5;
    if (options?.sha1) headers["x-amz-content-sha1"] = options.sha1;
    if (options?.sha256) headers["x-amz-content-sha256"] = options.sha256;
    if (options?.storageClass)
      headers["x-amz-storage-class"] = options.storageClass;
    const res = await this.client.fetch(this.endpoint + path, {
      method: "PUT",
      body: value,
      headers,
    });
    return res;
  }
  async delete(path: string) {
    return await this.client.fetch(this.endpoint + path, { method: "DELETE" });
  }
}
