import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disambiguate the workspace root (a stray lockfile above the repo would
  // otherwise make Next.js guess incorrectly).
  turbopack: {
    root: __dirname,
  },
  // NOTE: this app reads `../templates/*.md` (outside the project root) via
  // `fs.readFile` at request time — see lib/loadTemplates.ts. That's fine
  // for `next dev` / `next build` locally, but Turbopack's output file
  // tracing refuses `outputFileTracingIncludes` globs that navigate outside
  // the project root ("prefix that navigates out of the project root"), so
  // there's no supported way to force-include those files in a serverless
  // deploy bundle today. A real deploy of this app would need the two
  // template files copied into `frontend/` (or fetched from a service)
  // instead of read from the sibling directory.
};

export default nextConfig;
