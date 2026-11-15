# SubMental: mental-health and cognitive-load self-monitoring for astronauts

SubMental is a multimodal tool designed to help astronauts assess and monitor their own mental health and cognitive load. It combines the meaning of mission conversations with biofeedback and signals from audio and video, bringing them into one understandable personal view.

Think Garmin-style self-monitoring for mental well-being in space: a daily picture of accumulated demand, evidence explaining that picture and practical recovery suggestions the astronaut can choose to follow.

## What it does and how it works

The system analyzes conversation transcripts for communication demand, effort to understand, coordination problems, expressed pressure and team support. It connects those findings to supporting signals at the relevant time, including physical readings and observations from available mission recordings.

The astronaut sees a simple personal HUD for daily reflection. An explorable backoffice connects findings to source quotes, body readings, original audio, video frames and model outputs. This makes the assessment understandable and lets people inspect the evidence behind an interpretation.

In our showcase, we combined real NASA transcripts with real mission audio and video, plus simulated pulse, blood pressure, felt tension and personal-baseline values. Local models processed the text and sampled images; local transcription helped match spoken exchanges to the source turns. Audio currently supports transcription, alignment and playback, rather than a separate vocal-emotion score.

Neil Armstrong’s Apollo 11 mission is an example used to demonstrate the system. SubMental is intended for astronauts generally. The showcase illustrates the workflow and does not establish Neil’s actual mental-health state.

## Benefits and intended impact

SubMental aims to help astronauts notice accumulated demand, reflect on their mental well-being and cognitive load, protect recovery opportunities and recognize when support may be useful. In a future validated system, these insights could also support conversations with mission planners about workload, breaks and schedule adjustments.

The intended impact is greater personal awareness and agency during demanding missions. The prototype demonstrates the approach; it has not established clinical accuracy or improved health outcomes.

## Tools and technology

We built the iPad-friendly web interface with React, JavaScript, HTML and CSS. Node.js serves the local application, and esbuild creates the static version. Python and FFmpeg prepare the transcript and media inputs.

Gemma 4 E2B extracts conversation cues. Qwen 3.6 describes sampled video frames and generates combined evidence readings. Both run locally through Ollama. Whisper tiny.en and base.en, through faster-whisper, helped locate and check spoken exchanges.

Development and local inference were tested on an Apple M4 Pro with 48 GB unified memory. GitHub hosts the public project and automated checks.

## Creativity and design considerations

The creative idea is to bring multiple signals into a personal mental-health and cognitive-load monitoring experience, while keeping conversations central and each interpretation connected to inspectable evidence.

We considered privacy, local processing, limited computing resources, simple language, task context and astronaut control. Short clips and small evidence packets keep model context manageable. We also considered noisy audio, uncertain timestamps, missing observations and poor camera visibility. The demo clearly separates historical evidence, model interpretations and simulated data; it does not treat a face image or a physical reading alone as proof of mental-health status.
