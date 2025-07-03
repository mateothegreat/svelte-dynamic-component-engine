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
  if (!import.meta?.env?.VERSION) {
    console.error("VERSION is not set");
    return {
      tag: "unknown",
      commit: {
        long: "unknown",
        short: "unknown"
      },
      dirty: true,
      branch: "unknown",
      date: {
        actual: new Date(1970, 1, 1),
        human: "unknown"
      }
    };
  }
  return JSON.parse(import.meta.env.VERSION) as Version;
};
