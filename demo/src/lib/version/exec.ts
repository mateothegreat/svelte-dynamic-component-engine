import { spawnSync } from "node:child_process";

export const exec = (
  command: string
): {
  output: string;
  status: number | null;
} => {
  const result = spawnSync(command, {
    cwd: process.cwd(),
    shell: true
  });
  if (result.status !== 0) {
    return {
      output: result.stderr.toString().trim(),
      status: result.status
    };
  }
  return {
    output: result.stdout.toString().trim(),
    status: result.status
  };
};
