export type PtyCreateOptions = {
  cols: number;
  rows: number;
};

export type PtyDataEvent = {
  sessionId: string;
  data: string;
};

export type PtyExitEvent = {
  sessionId: string;
  exitCode: number;
};
