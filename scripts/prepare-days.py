"""Extract three UTC mission days from the saved NASA transcript."""
import importlib.util
import json
import hashlib
from datetime import datetime, timezone, timedelta
from pathlib import Path

root = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('transcript', root / 'scripts/extract-apollo11.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
contexts = [
    ('1969-07-18', 'Outbound flight', 'Coasting toward the Moon, lunar module checks and mission communications.'),
    ('1969-07-20', 'Landing day', 'Lunar module preparation, descent, landing and technical follow-up. EVA preparation starts before this UTC day ends.'),
    ('1969-07-22', 'Homeward bound', 'Return-journey operations, trans-Earth coast, technical follow-up and time to rest.'),
]
for date, title, context in contexts:
    module.DAY_START = datetime.fromisoformat(date).replace(tzinfo=timezone.utc)
    module.DAY_END = module.DAY_START + timedelta(days=1)
    rows, _ = module.extract(module.RAW.read_text(errors='replace'))
    result = {'date': date, 'title': title, 'context': context, 'astronaut': 'Neil Armstrong', 'targetSpeaker': 'CDR',
              'sourceUrl': module.SOURCE_URL, 'sourceIndexUrl': 'https://www.nasa.gov/wp-content/uploads/static/history/alsj/a11/a11trans.html',
              'sourceSha256': hashlib.sha256(module.RAW.read_bytes()).hexdigest(), 'launchUtc': module.LAUNCH.isoformat(),
              'timeBasis': 'UTC calendar day; mission times are from the uncorrected transcript.', 'utterances': rows}
    (root / 'data/days' / f'{date}.json').write_text(json.dumps(result, indent=2, ensure_ascii=False) + '\n')
    print(date, len(rows), sum(row['speaker'] == 'CDR' for row in rows))
