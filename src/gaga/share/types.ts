export interface GagaShareMetadata {
  title: string;
  description?: string;
  url: string;
  author?: string;
  image?: string;
  section?: string;
}

export interface GagaShareChannel {
  id: string;
  execute(metadata: GagaShareMetadata): Promise<boolean>;
}

export interface GagaShareContext {
  metadata: GagaShareMetadata;
  channels: GagaShareChannel[];
}
