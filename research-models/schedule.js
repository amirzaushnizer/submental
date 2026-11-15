const CREW_IDS = ['AC', 'MP', 'LR', 'SR', 'NH', 'EB', 'YT', 'SF'];
const CATEGORIES = ['joint', 'solo', 'exercise', 'off-duty', 'sleep', 'private', 'available'];
const MISSION_START = Date.parse('2026-11-02T00:00:00Z');
const DAY_MS = 86400000;

function makeDemoSchedule() {
  const events = [];
  const add = (sol, id, start, end, participants, category, title, visibility = 'crew') => {
    const stamp = time => new Date(MISSION_START + (sol - 1) * DAY_MS + time * 60000).toISOString();
    events.push({ id: `${sol}-${id}`, start: stamp(start), end: stamp(end), participants, category, title, visibility, status: 'planned', revision: 3 });
  };
  for (let sol = 1; sol <= 14; sol++) {
    add(sol, 'sleep', 0, 420, CREW_IDS, 'sleep', 'Protected rest');
    add(sol, 'brief', 450, 480, CREW_IDS, 'joint', 'Daily planning conference');
    for (const [i, person] of CREW_IDS.entries()) {
      const start = 510 + (i % 3) * 5;
      add(sol, `solo-${person}`, start, start + (sol > 7 ? 160 : 100), [person], 'solo', 'Individual science / maintenance');
      add(sol, `exercise-${person}`, 750 + (i % 2) * 120, 870 + (i % 2) * 120, [person], 'exercise', 'Protected exercise');
      add(sol, `busy-${person}`, 1020 + (i % 2) * 30, 1050 + (i % 2) * 30, [person], 'private', 'Busy', 'private');
    }
    add(sol, 'filter', 690, 735, ['AC', 'LR'], 'joint', 'Air filtration maintenance');
    add(sol, 'science', 690, 735, ['NH', 'YT'], 'joint', 'Growth sample review');
    add(sol, 'handover', 990, 1020, ['AC', 'EB'], 'joint', 'Systems handover');
    add(sol, 'discretionary', 1080, 1110, CREW_IDS, 'available', 'Crew-approved flexible window');
    add(sol, 'dinner', 1110, 1155, CREW_IDS, 'off-duty', 'Protected meal / personal time');
    add(sol, 'rest', 1320, 1440, CREW_IDS, 'sleep', 'Protected rest');
  }
  return { schemaVersion: 1, source: 'Synthetic ARES timeline', updatedAt: '2026-11-15T07:00:00Z', events };
}

function validateSchedule(data) {
  if (!data || data.schemaVersion !== 1 || typeof data.source !== 'string' || !data.source.trim() || !validDate(data.updatedAt)) throw new Error('Provide schemaVersion 1, a source name, and an updatedAt timestamp with a timezone.');
  if (!Array.isArray(data.events) || !data.events.length || data.events.length > 1000) throw new Error('The schedule must contain between 1 and 1,000 events.');
  const ids = new Set();
  const events = data.events.map((event, i) => {
    const prefix = `Event ${i + 1}: `;
    if (!event || typeof event.id !== 'string' || !event.id || ids.has(event.id)) throw new Error(prefix + 'id must be unique and nonempty.');
    ids.add(event.id);
    if (!validDate(event.start) || !validDate(event.end) || Date.parse(event.start) >= Date.parse(event.end)) throw new Error(prefix + 'start and end must be ordered ISO timestamps with timezones.');
    if (!Array.isArray(event.participants) || !event.participants.length || event.participants.some(id => !CREW_IDS.includes(id)) || new Set(event.participants).size !== event.participants.length) throw new Error(prefix + 'participants must be unique supported crew IDs.');
    if (!CATEGORIES.includes(event.category) || !['crew', 'private'].includes(event.visibility) || !['planned', 'completed', 'cancelled'].includes(event.status)) throw new Error(prefix + 'category, visibility, or status is invalid.');
    if (typeof event.title !== 'string' || !event.title.trim() || !Number.isInteger(event.revision) || event.revision < 1) throw new Error(prefix + 'provide a title and positive integer revision.');
    if ((event.actualStart !== undefined || event.actualEnd !== undefined) && (!validDate(event.actualStart) || !validDate(event.actualEnd) || Date.parse(event.actualStart) >= Date.parse(event.actualEnd))) throw new Error(prefix + 'actualStart and actualEnd must both be ordered timestamps when supplied.');
    const actual = event.actualStart ? { actualStart: event.actualStart, actualEnd: event.actualEnd } : {};
    const hidden = event.visibility === 'private' || event.category === 'private';
    return { ...actual, id: event.id, start: event.start, end: event.end, participants: event.participants, category: hidden ? 'private' : event.category, title: hidden ? 'Busy' : event.title, visibility: hidden ? 'private' : 'crew', status: event.status, revision: event.revision };
  });
  return { schemaVersion: 1, source: data.source, updatedAt: data.updatedAt, events };
}
function validDate(value) { return typeof value === 'string' && /T.*(?:Z|[+-]\d{2}:\d{2})$/.test(value) && Number.isFinite(Date.parse(value)); }
function dayBounds(date) { const start = Date.parse(`${date}T00:00:00Z`); return [start, start + DAY_MS]; }
function eventsFor(schedule, date, crewId) {
  const [start, end] = dayBounds(date);
  return schedule.events.filter(event => event.status !== 'cancelled' && event.participants.includes(crewId) && Date.parse(event.start) < end && Date.parse(event.end) > start).sort((a,b) => Date.parse(a.start) - Date.parse(b.start));
}
function sharedWindow(schedule, date, ids, duration = 10) {
  const [dayStart, dayEnd] = dayBounds(date);
  let windows = [[dayStart, dayEnd]];
  for (const id of ids) {
    const events = eventsFor(schedule, date, id);
    const allowed = events.filter(e => e.category === 'available').map(e => [Math.max(dayStart, Date.parse(e.start)), Math.min(dayEnd, Date.parse(e.end))]);
    windows = windows.flatMap(([a,b]) => allowed.map(([c,d]) => [Math.max(a,c), Math.min(b,d)]).filter(([start,end]) => end - start >= duration * 60000));
    for (const event of events.filter(e => e.category !== 'available')) {
      const start = Date.parse(event.start), end = Date.parse(event.end);
      windows = windows.flatMap(([a,b]) => [[a, Math.min(b,start)], [Math.max(a,end),b]].filter(([c,d]) => d - c >= duration * 60000));
    }
  }
  windows.sort((a,b) => a[0]-b[0]);
  return windows.length ? { start: windows[0][0], end: windows[0][0] + duration * 60000 } : { unavailable: true };
}
function plannedMinutes(schedule, crewId, date, days, category) {
  const [,end] = dayBounds(date), start = end - days * DAY_MS;
  const events = schedule.events.filter(e=>e.status!=='cancelled' && e.participants.includes(crewId) && e.category===category && Date.parse(e.start)<end && Date.parse(e.end)>start);
  return events.reduce((sum,e)=>sum+Math.max(0,Math.min(end,Date.parse(e.end))-Math.max(start,Date.parse(e.start)))/60000,0);
}
if (typeof module !== 'undefined') module.exports = { makeDemoSchedule, validateSchedule, eventsFor, sharedWindow, plannedMinutes };
