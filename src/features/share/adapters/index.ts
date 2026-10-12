export interface ShareAdapter {
  name: string;
  publish(payload: unknown): Promise<void>;
}
