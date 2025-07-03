export type Version = {
  tag: string;
  commit: {
    long: string;
    short: string;
  };
  dirty: boolean;
  branch: string;
  date: {
    actual: Date;
    human: string;
  };
};
