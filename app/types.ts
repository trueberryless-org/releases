export interface ReleaseInfo {
  id: string;
  type: string;
  repo: string;
  package: string;
  title: string;
  commit: string;
  created_at: number;
  version: string;
  isOrg: boolean;
  payload?: any;
}
