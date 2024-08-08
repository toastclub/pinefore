interface Conditional {
  etagMatches?: string;
  etagDoesNotMatch?: string;
  uploadedBefore?: Date;
  uploadedAfter?: Date;
}

export type StorageHeadResponse = {
  key?: string;
  version?: string;
  size?: string;
  etag?: string;
  httpEtag?: string;
  checksums: {
    sha1?: string;
    sha256?: string;
  };
};

export type StorageGetResponse = StorageHeadResponse & {
  body: ReadableStream<Uint8Array>;
  json: () => Promise<any>;
  text: () => Promise<string>;
  arrayBuffer: () => Promise<ArrayBuffer>;
  blob: () => Promise<Blob>;
};

export interface StorageProvider {
  head(
    path: string,
    options?: {
      onlyIf?: Conditional;
    }
  ): Promise<StorageHeadResponse | null>;
  get(
    path: string,
    options?: {
      onlyIf?: Conditional;
      range?: {
        offset?: number;
        length?: number;
      };
    }
  ): Promise<StorageGetResponse | null>;
  put(
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
  ): Promise<Response>;
  delete(path: string): Promise<Response>;
}
