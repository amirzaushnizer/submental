# Research behind SubMental

[← Project overview](../README.md) · [Open the live demo](https://orbit-crewpulse.modernmimosa8.chatgpt.site/)

This guide collects the papers and public resources consulted as the project evolved from the ORBIT/CrewPulse concept into SubMental, a multimodal astronaut mental-health and cognitive-load self-monitoring concept demonstrated through Neil Armstrong’s mission. Links were reviewed on **15 November 2026**. Research descriptions and standards can change; a roadmap entry is not evidence of operational deployment.

Our five communication measures are **research-informed product proposals**. None of the sources below validates those exact KPIs, example ranges, daily load bands or recovery recommendations.

## 1. Communication, team functioning and workload

| Source | What we took from it | Important boundary |
| --- | --- | --- |
| [NASA Team Evidence Report (2022), NTRS 20220007465](https://ntrs.nasa.gov/citations/20220007465) | A foundation for studying cooperation, coordination, communication and support in teams | Team outcomes and individual clinical status are different targets |
| [Predicting Team Functioning in Long Term Space Missions Using Acoustic and Linguistic Measures (2026), NTRS 20260005849](https://ntrs.nasa.gov/citations/20260005849) | HERA research that combines acoustic, linguistic and semantic information | Analog team results do not validate transcript-only individual overload detection; we did not reproduce its experiments |
| [Supporting Exploration Missions by Enabling Exploration Mission System Software (2023), NTRS 20230006625](https://ntrs.nasa.gov/citations/20230006625) | CODA provides a useful precedent for connecting timestamped transcripts to mission evidence | A transcript-review system does not imply access to every crew conversation |
| [Pilot Workload and Speech Analysis: A Preliminary Investigation (2013), NTRS 20130013791](https://ntrs.nasa.gov/citations/20130013791) | Speech responses to workload can depend on the speaker; simple acoustic rules need caution | A preliminary aviation part-task study is not an astronaut-day validation |
| [Characterization of ISS Crew Members’ Workload Contributing to Fatigue, Sleep Disruption and Circadian De-synchronization (2020), NTRS 20205006969](https://ntrs.nasa.gov/citations/20205006969) | Work demands and recovery opportunity belong beside communication findings | Planned activity and actual work are not interchangeable |
| [The main phenomena of space crews’ communication as a rationale for the modification of mission control communicative style (2023)](https://doi.org/10.3389/fpsyg.2023.1169606) | Crew–ground content analysis motivates looking beyond word counts toward requests, coping and support | Its roughly 164,658 statements came from open Roscosmos transcripts involving Russian cosmonauts—not a NASA corpus of all onboard social conversations |
| [Predicting Fatigue and Psychophysiological Test Performance from Speech for Safety-Critical Environments (2015)](https://doi.org/10.3389/fbioe.2015.00124) | Speech can be studied alongside independent performance measures | Controlled speech and prolonged wakefulness differ from spontaneous, noisy mission radio |
| [External Communication of Autonomous Crews Under Simulation of Interplanetary Missions (2021)](https://doi.org/10.3389/fphys.2021.751170) | Isolation analogs offer context for studying changes in external communication | Analog findings and tentative interpretations are not universal fatigue thresholds |
| [Crew Roles and Interactions in Scientific Space Exploration (2013), NTRS 20130014888](https://ntrs.nasa.gov/citations/20130014888) | Role clarity and effective interaction matter in scientific operations | This informed early operational-assistance ideas; it is not the source of our final KPI algorithm |

**Design consequence:** extract observable communication cues and retain their source words. Do not silently turn repetition into confusion, coordination trouble into interpersonal conflict, or a team-level result into an individual diagnosis.

## 2. NASA measurement and behavioral-health resources

| Resource | How it informed the design |
| --- | --- |
| [Human Performance, NASA-STD-3001 reference](https://www.nasa.gov/reference/4-0-human-performance/) | Workload, task performance and cognitive assessment need appropriate definitions and measurement |
| [Cognitive Workload Assessment Methods, OCHMO-TB-032 Rev C](https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-032-cognitive-workload.pdf) | Distinguish task exposure from perceived mental effort; established assessments are different from our text-based cues |
| [NASA Behavioral Health Evidence Report (2025)](https://humanresearchroadmap.nasa.gov/evidence/reports/HRP-ER-BMED-HFBP-20250210.pdf) | Behavioral-health risk and monitoring need a broader evidence base than one transcript or face image |
| [Standardized Behavioral Measures for Detecting Behavioral Health Risks during Exploration Missions](https://humanresearchroadmap.nasa.gov/Tasks/task.aspx?i=1623) | Self-report, cognition, sleep/activity and other observations can provide complementary information |
| [Speech-Based AI for Predicting Team Functioning Degradation in HERA Missions](https://humanresearchroadmap.nasa.gov/Tasks/task.aspx?i=2812) | A NASA research direction involving acoustic and linguistic features from task and meal interactions |
| [Team-102 research gap](https://humanresearchroadmap.nasa.gov/gaps/gap.aspx?i=747) | Validated team indicators and meaningful ranges are research questions, not ready-made app thresholds |
| [BMed-102 research gap and related camera-monitoring work](https://humanresearchroadmap.nasa.gov/Gaps/gap.aspx?i=701) | Image quality, visibility and measurement feasibility must be assessed before interpretation |

We did not administer NASA-TLX, Bedford, Cognition or another validated assessment to Armstrong. The demo’s three-option check-in is a product interaction, not a validated NASA scale. Physiological data are invented scenario values, not an evaluation dataset from these studies.

## 3. Schedules, access and privacy

Earlier research explored a broader schedule-aware crew tool. The current showcase is a simpler personal demonstration of the wider self-monitoring concept; the resources below remain useful context for future work.

- [NASA Crew Interfaces](https://www.nasa.gov/reference/10-0-crew-interfaces-vol-2/): communication capabilities and private channels. A channel’s existence does not authorize recording or secondary analysis.
- [NASA Medical Operations](https://www.nasa.gov/reference/6-0-medical-operations/): health support and private communication. We used no private medical, psychological or family conversations.
- [HERA Facility and Capabilities Information (2019)](https://www.nasa.gov/wp-content/uploads/2016/05/2019_hera_facility_capabilities_information.pdf): analog monitoring has specific scope and exclusions; it does not establish routine comprehensive ISS cabin surveillance.
- [Schedule and Planning Interface for Exploration (SPIFe)](https://www.nasa.gov/human-systems-integration-division/human-computer-interaction/schedule-and-planning-interface-for-exploration/): activities, constraints and replanning are richer than a simple appointment calendar.
- [NASA Life Sciences Portal](https://www.nasa.gov/hrp/nlsp/) and [prospective-researcher guidance](https://www.nasa.gov/hrp/for-prospective-researchers/): research-data descriptions do not automatically grant access to identifiable crew records.

No live NASA crew-schedule API or approved data integration is implemented here. Scheduling code under `research-models/` is historical prototype work. It is not loaded by Neil’s current HUD.

## 4. Historical mission evidence

The project uses contemporaneous mission communications rather than retrospective oral-history interviews.

| Resource | Use in the repository |
| --- | --- |
| [NASA Technical Air-to-Ground Transcript](https://www.nasa.gov/wp-content/uploads/static/history/alsj/a11/a11transcript_tec.html) | Original text for the three day extracts and quoted turns |
| [NASA transcript archive and source note](https://www.nasa.gov/wp-content/uploads/static/history/alsj/a11/a11trans.html) | Source context and distinction from corrected journal material |
| [Apollo 11 Mission Overview](https://www.nasa.gov/missions/apollo/apollo-11/apollo-11-mission-overview/) | Mission-day context |
| [Flight Journal: Entering Eagle](https://www.apollojournals.org/afj/ap11fj/09day3-entering-eagle.html) | July 18 broadcast and checked spoken examples |
| [Flight Journal: Television and Food Demonstrations](https://www.apollojournals.org/afj/ap11fj/23day7-tv-food-prep.html) | Return-broadcast reference clip; its sample presentation falls on July 23 UTC |
| [Apollo 11 video index](https://www.apollojournals.org/afj/ap11fj/videoindex.html) | Onboard film, including magazine 1118-B, plus media notes |
| [NASA: Neil A. Armstrong](https://www.nasa.gov/people/neil-a-armstrong/) | Identity portrait and credit |

Caption wording comes from the NASA technical transcript. Local ASR helps locate exchanges but can mishear radio speech. We retained both the raw outputs and the checked source links instead of replacing NASA’s words with ASR guesses.

## 5. Model and software resources

- [Google Gemma 4 model card](https://ai.google.dev/gemma/docs/core/model_card_4): multimodal capabilities and image/video input considerations. The text pipeline actually used E2B; E4B was considered but not used.
- [Ollama structured outputs](https://docs.ollama.com/capabilities/structured-outputs): constrained JSON outputs used by the local pipelines.
- [Ollama Qwen 3.6 library](https://ollama.com/library/qwen3.6): the local vision/fusion model family. The exact installed digest is recorded in [model-manifest.json](model-manifest.json); mutable tags can change.
- [faster-whisper](https://github.com/SYSTRAN/faster-whisper): the local transcription runtime used with Whisper tiny.en and base.en.
- [ImageIO FFmpeg](https://github.com/imageio/imageio-ffmpeg): FFmpeg access for clip extraction, audio decoding and sampled frames.
- [NVIDIA Jetson Orin reference](https://developer.nvidia.com/blog/delivering-server-class-performance-at-the-edge-with-nvidia-jetson-orin): a concrete embedded-hardware direction considered during architecture discussion, not hardware tested or certified by this project.

The local-model choice demonstrates that inference can run without sending mission material to a cloud model. It does not establish flight readiness, clinical validity, power consumption aboard a spacecraft or reliable performance on future crews.

## What these sources support—and what remains open

**Supported direction:** source-linked communication review, task context, multiple complementary observations and careful attention to missing data.

**Not established by this demo:** validated overload detection, a clinical mental-health score, emotion inference from appearance, a causal link between the simulated body curves and the historical dialogue, or improved recovery outcomes.

A stronger study would need independent annotations, consented data, ground-truth workload measures, person/task-held-out evaluation and a test of whether the interface helps the astronaut.
