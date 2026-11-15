# Data provenance and demo boundaries

[← Project overview](../README.md) · [Research guide](RESEARCH.md)

## Source layers

| Layer | Files | Provenance |
| --- | --- | --- |
| Original transcript snapshot | `data/nasa/apollo11-technical-original.html` | NASA’s uncorrected Apollo 11 Technical Air-to-Ground transcript |
| Current day extracts | `data/days/1969-07-{18,20,22}.json` | Extracted UTC dates, source-order IDs, speaker labels, original words and page/tape references |
| Text analysis | `data/runs/` | Actual local Gemma E2B outputs, source checks and raw responses |
| Portrait | `assets/neil-armstrong.jpg` | NASA image S64-31452; identity illustration only |
| Camera sources and audio links | `data/camera/catalog.json` | Archive URLs, source offsets, cue times and explicit source-turn links |
| Camera model inputs | `assets/camera/*-{0,1,2}.jpg` | Three frames per clip, with hashes retained in the observation receipt |
| Camera observations | `data/camera/observations.json` | Actual local Qwen responses, including mistakes and visibility limits |
| Preparation review | `data/camera/review.json` | Scene descriptions checked against the extracted images; not a clinical review |
| Audio checks | `data/camera/audio-alignment.json` | Local Whisper base.en segments, selected source turns and exact video-file hashes |
| Combined readings | `data/camera/combined.json` | Actual local Qwen outputs from small per-turn evidence packets |
| Body curves and usual ranges | `src/scenarios.cjs` | Invented demonstration data; no real Armstrong biometrics |

The raw technical transcript can contain OCR, timing and speaker-attribution errors. `CDR` is treated as Neil by the extraction pipeline, but automated source checks do not establish perfect historical speaker accuracy. This is a selected operational record, not a complete account of crew interaction or well-being.

## The three UTC days

Launch is represented as 16 July 1969 at 13:32 UTC. Mission elapsed time is converted to UTC for the calendar-day extracts. We do not silently equate these dates with full waking shifts.

The July 20 extract includes preparation and landing. The first moonwalk falls after midnight on July 21 UTC, despite its familiar July 20 date in US local time. Similarly, the return broadcast often described as July 22 includes the sample presentation on July 23 UTC. Those clips must not be presented as simultaneous observations of the selected July 22 turns.

## Checked KPI audio examples

| Source turn | UTC | Clip | Spoken cue |
| --- | --- | --- | --- |
| `a11-02130` | 18 July, 21:05:24 | `july18-tunnel.mp4` | About +9.4 seconds |
| `a11-02371` | 18 July, 22:11:34 | `july18-tour.mp4` | About +13.8 seconds |

These explicit source IDs, unchanged quote text and timestamps qualify the links. A nearby clock time alone does not. The former short question and ticket-price joke links were removed from the checked KPI examples. A lighting comment in `july18-probe.mp4` remains available as a separate reference demonstration.

Source clips can have timing shifts. Radio audio and the picture are not assumed to represent the same instant. Whisper output can be noisy; NASA’s wording supplies captions, while dialogue and neighboring replies establish correspondence. No audio was synthesized or dubbed to manufacture a match.

## Camera scope

All five clip files are genuine historical footage. Some show equipment or Earth; the undated cabin film includes crew members but has limited detail and variable original capture speed. There is no reliable face-based health assessment in this demo.

A matching spoken turn can provide relevant scene context without providing a clear face view. Reference-only clips do not enter that turn’s combined model packet. Sparse stills do not support blink-rate estimates, and an image’s existence is not evidence of fatigue, distress or recovery.

## Simulated supporting values

Pulse, blood pressure, felt tension and example personal ranges are constructed for the three scenarios. Their alignment with demanding operations is deliberate. They are not recorded medical facts, and their agreement with conversation cues is not independent scientific confirmation.

The curve is evaluated at the selected turn’s UTC timestamp. Switching turns changes the values. Combined model packets label those values as simulated. Communication KPI counts stay text-based.

## Retained research artifacts

Earlier landing-day snapshots and `research-models/` support historical tests and the project’s development record. They do not power the current personal HUD. Old fictional multi-crew concepts are not the data source for Neil’s active screens.

## Credits and terms

- Transcript source: [NASA technical transcript](https://www.nasa.gov/wp-content/uploads/static/history/alsj/a11/a11transcript_tec.html); [archive context](https://www.nasa.gov/wp-content/uploads/static/history/alsj/a11/a11trans.html).
- Footage: NASA, supplied through the [Apollo Flight Journal](https://www.apollojournals.org/afj/ap11fj/videoindex.html); individual source URLs are preserved in the catalog.
- Portrait: [NASA / Neil A. Armstrong](https://www.nasa.gov/people/neil-a-armstrong/), image S64-31452.

The Flight Journal’s corrected transcripts and commentary are distinct from the uncorrected NASA transcript used as this project’s dataset. Archive annotations and other third-party elements may carry their own terms. See [NOTICE.md](../NOTICE.md). No NASA affiliation or endorsement is implied.
