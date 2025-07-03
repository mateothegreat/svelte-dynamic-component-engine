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

export const getVersion = (): Version => {
  const version = JSON.parse(import.meta.env.VERSION);
  return version;
};
