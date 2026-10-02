export function eventStatus(event, now = new Date()) {
  if (event.status === 'cancelled' || event.status === 'postponed') return event.status;
  if (event.endAt && now.getTime() >= Date.parse(event.endAt)) return 'ended';
  // A confirmed zone permits an editorial end-of-day rule for date-only endings.
  if (!event.endAt && event.timeZone) {
    const day = new Intl.DateTimeFormat('en-CA', {timeZone: event.timeZone,year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
    if (day > event.lastDate) return 'ended';
  }
  // Unknown time zones require review; never claim the actual ending is known.
  if (!event.timeZone && now.toISOString().slice(0,10) > event.lastDate) return 'review';
  if (event.startAt && now.getTime() >= Date.parse(event.startAt)) return 'in_progress';
  return 'upcoming';
}
export function verificationStale(event, now = new Date()) {
  return now.getTime() - Date.parse(event.checked+'T00:00:00Z') > 7*86400000;
}
