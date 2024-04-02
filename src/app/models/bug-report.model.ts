
export interface BugReport  {
  action: string;
  caption: string;
  createdAt: string;
  description: string;
  id: number;
  localDBCopy: string;
  localStorageCopy:  string;
  proposal: string;
  updatedAt: string;
  url?: string;
}
