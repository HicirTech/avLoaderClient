# avLoaderClient

A command-line program that tidies the names of downloaded videos and writes a `.nfo` sidecar for
each one, so Kodi or Emby can identify them.

It is one part of a three-piece pipeline. A Chrome extension puts downloads into aria2;
`avloaderServer` answers metadata lookups against javdb; this reads the finished files and writes
the sidecars. Each piece runs on its own and knows nothing about the others.

## What it does

Point it at the folder your downloads land in and run it. For every file of the configured
extension it:

1. Cleans up the name. Releases arrive named after wherever they came from -- `hhd800.com@ABC-123`,
   `[javdb.com]ABC-123`, or with the domain spaced out to dodge filters as `h h d 8 0 0 . c o m`.
   The library only wants `ABC-123`.
2. Asks `avloaderServer` about the resulting code.
3. Writes `ABC-123.nfo` into the output folder.

Files are renamed **inside** the folder they are already in. Nothing is moved anywhere else.

## What it does not do

- It does not download anything, and it does not talk to javdb. Only `avloaderServer` does that.
- It does not overwrite a video. A rename whose target already exists is skipped and reported.
- It does not retry within a run. A name that failed is left without a `.nfo` and picked up next
  time, which is the whole retry mechanism.
- It does not touch files whose name contains CJK characters. Those have either been through here
  already or were labelled by hand.

## Setting it up

```sh
cp .env.example .env    # then edit it
deno task start
```

`.env.example` documents every setting. The two that matter most are `TARGET_PATH`, the folder to
work on, and `JAVDB_COOKIE`, the whole Cookie header from a browser that loads javdb.com without a
challenge. Without a valid cookie the server refuses every lookup, and this reports each one and
writes nothing.

## Reading the output

```
3 mp4 file(s) to process
renamed [javdb.com]GHI-789.mp4 -> GHI-789.mp4
left ABC-123-C.mp4 alone: ABC-123.mp4 already exists
GHI-789: wrote GHI-789.nfo
ZZZZ-999: 404 not_found: javdb search returned no results for ZZZZ-999
1 failed and will be retried next run: ZZZZ-999
```

A failure never produces a file. That matters more than it looks: a `.nfo` on disk is what marks a
name as finished, so writing one from a failed lookup would retire that name for good.

## Development

```sh
deno task test     # unit tests
deno task check    # type check
```

```
main.ts                     entry point
src/
  app.ts                    the pipeline, in order
  config.ts                 settings and their defaults
  files/
    find.ts                 which files are candidates
    nameRules.ts            every filename rule, pure and testable
    rename.ts               the only code here that touches the disk
  metadata/
    doFetch.ts              talks to avloaderServer, writes the sidecars
    movie.ts                the server's response shape, validated at the boundary
    convertToNfo.ts         a movie as nfo tags
  nfo/
    template.ts             the surrounding XML document
```

The split between `nameRules.ts` and `rename.ts` is deliberate: renaming is the only thing in this
program that can lose data, so every rule that decides a new name is a pure function with tests,
and the part that calls `Deno.rename` is small enough to read in one go.

Two rules are worth knowing before changing them. A leading `source@` or `[source]` marker is only
stripped when it sits tight against the text, because matching the last `@` anywhere in a name
turned `DEF-456 @ 4K rip` into `4K rip` and lost the video code. And the release-cut suffixes
`-C`, `-U`, `-CU` and `-UC` are dropped on the assumption that only one cut of any movie is kept;
if that assumption ever breaks, `renameInPlace` refuses to overwrite rather than silently
destroying the other file.
