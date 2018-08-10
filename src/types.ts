
export type Logger = (message: string, ...details: any[]) => void;

export type RepoStatus = {
  branch: string;
  reported?: string;
}
