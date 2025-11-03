interface JiraIssueUser {
  self: string;
  accountId: string;
  emailAddress?: string;
  avatarUrls: {
    '48x48': string;
    '24x24': string;
    '16x16': string;
    '32x32': string;
  };
  displayName: string;
  active: boolean;
  timeZone: string;
  accountType: string;
}

interface JiraIssueType {
  self: string;
  id: string;
  description: string;
  iconUrl: string;
  name: string;
  subtask: boolean;
  avatarId: number;
  hierarchyLevel: number;
}

interface JiraProject {
  self: string;
  id: string;
  key: string;
  name: string;
  projectTypeKey: string;
  simplified: boolean;
  avatarUrls: {
    '48x48': string;
    '24x24': string;
    '16x16': string;
    '32x32': string;
  };
  projectCategory: {
    self: string;
    id: string;
    description: string;
    name: string;
  };
}

interface JiraWorklogComment {
  type: string;
  version: number;
  content: Array<{
    type: string;
    content: Array<{
      type: string;
      text: string;
    }>;
  }>;
}

interface JiraWorklogEntry {
  self: string;
  author: JiraIssueUser;
  updateAuthor: JiraIssueUser;
  comment?: JiraWorklogComment;
  created: string;
  updated: string;
  started: string;
  timeSpent: string;
  timeSpentSeconds: number;
  id: string;
  issueId: string;
}

interface JiraWorklog {
  startAt: number;
  maxResults: number;
  total: number;
  worklogs: JiraWorklogEntry[];
}

interface JiraPriority {
  self: string;
  iconUrl: string;
  name: string;
  id: string;
}

interface JiraStatusCategory {
  self: string;
  id: number;
  key: string;
  colorName: string;
  name: string;
}

interface JiraStatus {
  self: string;
  description: string;
  iconUrl: string;
  name: string;
  id: string;
  statusCategory: JiraStatusCategory;
}

interface JiraIssueFields {
  summary: string;
  issuetype: JiraIssueType;
  creator: JiraIssueUser;
  project: JiraProject;
  reporter: JiraIssueUser;
  worklog: JiraWorklog;
  assignee: JiraIssueUser;
  priority: JiraPriority;
  status: JiraStatus;
}

export interface JiraIssueResponse {
  expand: string;
  id: string;
  self: string;
  key: string;
  fields: JiraIssueFields;
}