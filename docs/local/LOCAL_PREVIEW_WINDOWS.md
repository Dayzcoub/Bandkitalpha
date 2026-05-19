# BandKit local preview on Windows

This package includes one-click Windows launchers for local review.

## Recommended preview

Double-click:

```txt
START_BANDKIT_PREVIEW.bat
```

It uses the fixed BandKit preview address:

```txt
http://127.0.0.1:5199
```

The preview launcher:

1. opens the project folder;
2. checks that Node.js exists;
3. builds the project if `dist/index.html` is missing;
4. starts `scripts/serve-dist.mjs` on port `5199`;
5. opens the browser.

## Development mode

Double-click:

```txt
START_BANDKIT_DEV.bat
```

Current MVP shell does not use Vite. The dev launcher installs dependencies, rebuilds, and serves `dist` through the same local preview server.

## Checks

Double-click:

```txt
CHECK_BANDKIT.bat
```

This runs:

```txt
npm install
npm run check
npm run build
node --check dist/js/main.js
```

## Build only

Double-click:

```txt
BUILD_BANDKIT.bat
```

## When another project appears in the browser

This is usually caused by an old local server, old browser tab, or service worker from another project.

Use:

```txt
RESET_CACHE_AND_START.bat
```

Then open:

```txt
http://127.0.0.1:5199
```

If Chrome still shows the wrong project:

1. open DevTools with `F12`;
2. go to `Application`;
3. unregister service workers;
4. clear site data;
5. reload `http://127.0.0.1:5199`.

## Node.js

Recommended: Node.js LTS 22.x. Node 24 may also work, but LTS is safer for development.
