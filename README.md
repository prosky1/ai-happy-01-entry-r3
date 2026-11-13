# A baby's first puppy lick

make.fun `ai-happy-01` ("Make the AI judge happy") — round 3 entry.

A baby girl bursts into her biggest laugh as a golden retriever puppy
gives her cheek its very first lick. Both faces are huge in the frame
and looking straight at the viewer; one warm golden mood, plain cream
background, nothing competing with the laugh.

## Run

```sh
node main.ts
# writes entry.png to $MAKEFUN_OUTPUT_DIR (default /output)
```

Node 22, stdlib only, no network. The program validates the bundled
image against the competition gate (JPEG, ≤1 MiB, ≤1024×1024), copies it
to the output directory, then re-reads the written file from disk and
re-verifies format, dimensions, size and sha256 byte for byte.

## Files

- `main.ts` — entrypoint (Node 22)
- `entry.png` — the entry image (1024×1024 JPEG bytes, 335,259 bytes)
- `LICENSE` — MIT
- `.makefun/owner.json` — account wallet claim
