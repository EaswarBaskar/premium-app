export const EVENTS = {
  engagement: {
    date: new Date('2026-10-30T10:00:00'),
    journeyStart: new Date(), 
    label: 'Engagement Day',
    title: 'Easwar & Pavithra — Engagement'
  },
  wedding: {
    date: new Date('2027-02-26T10:00:00'),
    journeyStart: new Date('2026-10-30T10:00:00'),
    label: 'Wedding Day',
    title: 'Easwar & Pavithra — Wedding'
  }
} as const;

export type EventKey = keyof typeof EVENTS;

export function formatDate(d: Date) {
  return d.toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' });
}

function toICSDate(d: Date) {
  return d.toISOString().replace(/[-:]/g,'').split('.')[0] + 'Z';
}

export function addToCalendar(key: EventKey) {
  const ev = EVENTS[key];
  const start = toICSDate(ev.date);
  const endDate = new Date(ev.date.getTime() + 2*60*60*1000);
  const end = toICSDate(endDate);
  const ics = [
    'BEGIN:VCALENDAR','VERSION:2.0','BEGIN:VEVENT',
    'SUMMARY:' + ev.title,
    'DTSTART:' + start,
    'DTEND:' + end,
    'DESCRIPTION:Save the date!',
    'END:VEVENT','END:VCALENDAR'
  ].join('\r\n');
  const blob = new Blob([ics], {type:'text/calendar'});
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = key + '.ics';
  link.click();
}

export function shareEvent(key: EventKey) {
  const ev = EVENTS[key];
  const text = `${ev.title} — ${formatDate(ev.date)}`;
  if (navigator.share) {
    navigator.share({ title: ev.title, text: text, url: window.location.href }).catch(()=>{});
  } else {
    navigator.clipboard.writeText(text + ' ' + window.location.href);
  }
}
