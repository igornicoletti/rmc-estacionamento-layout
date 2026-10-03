# Local security fork of `braces`

This is a project-maintained fork of upstream `braces` 3.0.3 (MIT license),
packaged locally as version 3.0.4. **3.0.4 is this project's version, not an
upstream release.** It addresses the recursive stack exhaustion described in
[GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).
The advisory lists no patched upstream version as of 2026-10-02.

Changes from 3.0.3 are limited to a maximum nesting depth of 100 for parsing,
AST compilation, expansion, stringification, and array flattening, plus removal
of a stray debug `console.log` in `compile.js`. Inputs over the bound throw a
`RangeError`. `tests/scripts/braces-fork.test.mjs` covers ordinary use and
adversarial nested patterns, direct ASTs, and arrays.

The source in this directory is the reviewable source of the tarball committed
beside it. Rebuild after any source change with
`npm pack ./vendor/braces --pack-destination ./vendor/braces`, then update the
root lockfile with `npm install --package-lock-only` and verify `npm ci`,
`npm audit`, and the full project gate. Replace this fork with an upstream
patched release when one exists and passes the same tests.
