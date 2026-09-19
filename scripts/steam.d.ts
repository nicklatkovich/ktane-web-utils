export {};

declare global {
  interface Window {
    g_sessionID?: string;
    RemoveChildFromCollection?: (id: string) => void;
  }
}
