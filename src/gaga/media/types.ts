export type GagaMediaType = 'image' | 'video' | 'audio' | 'embed';

export type GagaMediaIntent = 'hero' | 'content' | 'reference' | 'gallery';

export interface GagaMedia {
  id?: string;
  type: GagaMediaType;
  src: string;
  alt?: string;
  caption?: string;
  credit?: string;
  intent?: GagaMediaIntent;
}
