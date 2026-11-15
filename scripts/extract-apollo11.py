"""Extract one UTC day from NASA's uncorrected Apollo 11 radio transcript."""
import hashlib
import json
import re
from datetime import datetime, timedelta, timezone
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE_URL = 'https://www.nasa.gov/wp-content/uploads/static/history/alsj/a11/a11transcript_tec.html'
RAW = ROOT / 'data/nasa/apollo11-technical-original.html'
LAUNCH = datetime(1969, 7, 16, 13, 32, tzinfo=timezone.utc)
DAY_START = datetime(1969, 7, 20, tzinfo=timezone.utc)
DAY_END = DAY_START + timedelta(days=1)


class TranscriptText(HTMLParser):
    def __init__(self):
        super().__init__()
        self.parts = []
        self.in_script = False

    def handle_starttag(self, tag, attrs):
        if tag == 'script':
            self.in_script = True
        if tag in {'br', 'tr', 'hr'}:
            self.parts.append('\n')

    def handle_endtag(self, tag):
        if tag == 'script':
            self.in_script = False
        if tag == 'td':
            self.parts.append(' ')

    def handle_data(self, data):
        if not self.in_script:
            self.parts.append(data)


def extract(raw):
    parser = TranscriptText()
    parser.feed(raw)
    lines = [re.sub(r'\s+', ' ', line).strip() for line in ''.join(parser.parts).splitlines()]
    timestamp = re.compile(r'^([0-9OIl]{2}) ([0-9OIl]{2}) ([0-9OIl]{2}) ([0-9OIl]{2}) (CDR|CMP|LMP|CC|SC|MS|CT|F|HORNET|R|AB|LCC)\b(.*)$')
    records = []
    page = ''
    current = None
    invalid = []
    for line in lines:
        if not line:
            continue
        if line == 'END OF TAPE' or 'BEGIN LUNAR REV' in line or 'END LUNAR REV' in line:
            if current:
                current.setdefault('editorialNotes', []).append(line)
            continue
        if '(GOSS NET' in line:
            page = line
            continue
        if re.search(r'\(REV [^)]*\)', line) or line.startswith('APOLLO 11 AIR-TO-GROUND'):
            current = None
            continue
        match = timestamp.match(line)
        if match:
            groups = match.groups()
            values = [int(value.replace('O', '0').replace('I', '1').replace('l', '1')) for value in groups[:4]]
            d, h, m, s = values
            if h > 23 or m > 59 or s > 59:
                invalid.append(line)
                current = None
                continue
            elapsed = ((d * 24 + h) * 60 + m) * 60 + s
            utc = LAUNCH + timedelta(seconds=elapsed)
            current = {
                'id': f'a11-{len(records):05d}', 'sourceOrder': len(records),
                'rawHeader': line, 'elapsedSeconds': elapsed,
                'get': f'{d * 24 + h:03d}:{m:02d}:{s:02d}',
                'utc': utc.isoformat().replace('+00:00', 'Z'),
                'speaker': groups[4], 'channel': groups[5].strip(),
                'sourcePage': page, 'sourcePages': [page], 'text': '',
                'timestampNormalized': bool(re.search(r'[^0-9]', ''.join(groups[:4]))),
            }
            records.append(current)
        elif re.match(r'^[0-9OIl]{2} [0-9OIl]{1,2} [0-9OIl]{1,2} [0-9OIl]{1,2}\b', line):
            invalid.append(line)
            current = None
        elif current:
            if page not in current['sourcePages']:
                current['sourcePages'].append(page)
            current['text'] = (current['text'] + ' ' + line).strip()
    selected = [r for r in records if DAY_START <= datetime.fromisoformat(r['utc'].replace('Z', '+00:00')) < DAY_END and r['text']]
    selected.sort(key=lambda r: (r['elapsedSeconds'], r['sourceOrder']))
    return selected, invalid


if __name__ == '__main__':
    source_bytes = RAW.read_bytes()
    rows, invalid = extract(source_bytes.decode('utf-8', errors='replace'))
    result = {
        'schemaVersion': 1, 'mission': 'Apollo 11', 'astronaut': 'Neil Armstrong',
        'targetSpeaker': 'CDR', 'date': '1969-07-20',
        'dayStartUtc': DAY_START.isoformat().replace('+00:00', 'Z'),
        'dayEndUtc': DAY_END.isoformat().replace('+00:00', 'Z'),
        'launchUtc': LAUNCH.isoformat().replace('+00:00', 'Z'),
        'sourceUrl': SOURCE_URL,
        'sourceIndexUrl': 'https://www.nasa.gov/wp-content/uploads/static/history/alsj/a11/a11trans.html',
        'launchSourceUrl': 'https://www.nasa.gov/missions/apollo/apollo-11-mission-overview/',
        'sourceSha256': hashlib.sha256(source_bytes).hexdigest(),
        'extractedAt': '2026-11-15',
        'sourceDescription': 'NASA-hosted OCR of the uncorrected Technical Air-to-Ground Voice Transcription (GOSS NET 1). NASA states no copyright is asserted for these raw transcripts.',
        'limitations': [
            'One UTC calendar day, not a wake-to-sleep day. The moonwalk occurs on the following UTC date and is outside this dataset.',
            'Only CDR labels are attributed to Armstrong. SC and MS are not assigned to him. Ground and other crew speech is retained as context.',
            'OCR and the original transcription may contain timing, word and speaker errors. The source is uncorrected.',
            'Recorded turns do not establish recording coverage, actual silence, task duration or response latency.',
            'No health signals, voice acoustics, personal baseline or cognitive-overload labels accompany this transcript.',
        ],
        'extractionAudit': {'unparseableTimestampHeadersAcrossMission': invalid, 'selectedRows': len(rows), 'armstrongRows': sum(r['speaker'] == 'CDR' for r in rows)},
        'utterances': rows,
    }
    out = ROOT / 'data/nasa/armstrong-1969-07-20.json'
    out.write_text(json.dumps(result, indent=2, ensure_ascii=False) + '\n')
    print(json.dumps({'output': str(out), **result['extractionAudit']}, indent=2))
