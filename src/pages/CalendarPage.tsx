import { useEffect, useMemo, useState } from 'react';

const categories = ['Personal', 'Work', 'Health', 'Study', 'Dreams'] as const;
const priorities = ['Low', 'Medium', 'High'] as const;

type EventCategory = (typeof categories)[number];
type EventPriority = (typeof priorities)[number];

interface EventItem {
  id: string;
  title: string;
  date: string;
  notes: string;
  deadline: string;
  category: EventCategory;
  priority: EventPriority;
  completed: boolean;
}

function storageKey(user: string) {
  return `one-wish-${user}-events`;
}

function loadEvents(user: string): EventItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = window.localStorage.getItem(storageKey(user));
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

interface CalendarPageProps {
  currentUser: string;
}

function generateMonthGrid(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const weekdayStart = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: Array<Date | null> = [];
  for (let empty = 0; empty < weekdayStart; empty += 1) {
    cells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(year, month, day));
  }

  return cells;
}

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateTimeInput(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  const hours = `${date.getHours()}`.padStart(2, '0');
  const minutes = `${date.getMinutes()}`.padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function parseDateOnly(value: string) {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function formatDeadline(value: string) {
  if (!value) return 'No deadline';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) return 'No deadline';
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsed);
}

function formatEventDate(value: string) {
  const parsed = parseDateOnly(value);
  if (!parsed) return 'No date';
  return parsed.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function isOverdue(deadline: string, now: Date) {
  if (!deadline) return false;
  const parsed = new Date(deadline);
  return !Number.isNaN(parsed.valueOf()) && parsed.getTime() < now.getTime();
}

function isDueSoon(deadline: string, now: Date) {
  if (!deadline) return false;
  const parsed = new Date(deadline);
  if (Number.isNaN(parsed.valueOf())) return false;
  const hoursLeft = (parsed.getTime() - now.getTime()) / (1000 * 60 * 60);
  return hoursLeft <= 24 && hoursLeft > 0;
}

function getDeadlineStatus(eventItem: EventItem, now: Date) {
  if (eventItem.completed) {
    return { label: 'Completed', tone: 'complete' };
  }
  if (isOverdue(eventItem.deadline, now)) {
    return { label: 'Overdue', tone: 'overdue' };
  }
  if (isDueSoon(eventItem.deadline, now)) {
    return { label: 'Due soon', tone: 'soon' };
  }
  return { label: 'On track', tone: 'scheduled' };
}

export default function CalendarPage({ currentUser }: CalendarPageProps) {
  const [events, setEvents] = useState<EventItem[]>(() => loadEvents(currentUser));
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [category, setCategory] = useState<EventCategory>('Dreams');
  const [priority, setPriority] = useState<EventPriority>('Medium');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [deadline, setDeadline] = useState('');
  const [now, setNow] = useState(() => new Date());
  const [celebration, setCelebration] = useState<string | null>(null);

  useEffect(() => {
    window.localStorage.setItem(storageKey(currentUser), JSON.stringify(events));
  }, [events, currentUser]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!celebration) return;
    const timer = window.setTimeout(() => setCelebration(null), 4000);
    return () => window.clearTimeout(timer);
  }, [celebration]);

  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => a.date.localeCompare(b.date)),
    [events]
  );

  const groupedByMonth = useMemo(() => {
    return sortedEvents.reduce<Record<string, EventItem[]>>((groups, eventItem) => {
      const parsedDate = parseDateOnly(eventItem.date);
      const month = parsedDate ? parsedDate.toLocaleDateString(undefined, {
        month: 'long',
        year: 'numeric',
      }) : 'Upcoming';
      groups[month] = groups[month] ? [...groups[month], eventItem] : [eventItem];
      return groups;
    }, {});
  }, [sortedEvents]);

  const monthGrid = useMemo(() => generateMonthGrid(currentMonth), [currentMonth]);
  const currentMonthEvents = useMemo(
    () => events.filter((eventItem) => {
      const eventDate = parseDateOnly(eventItem.date);
      return eventDate && eventDate.getFullYear() === currentMonth.getFullYear() && eventDate.getMonth() === currentMonth.getMonth();
    }),
    [events, currentMonth]
  );
  const todayEvents = useMemo(
    () => events.filter((eventItem) => {
      const eventDate = parseDateOnly(eventItem.date);
      return eventDate && eventDate.toDateString() === now.toDateString();
    }),
    [events, now]
  );
  const prioritizedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      if (isOverdue(a.deadline, now) !== isOverdue(b.deadline, now)) return isOverdue(a.deadline, now) ? -1 : 1;
      if (isDueSoon(a.deadline, now) !== isDueSoon(b.deadline, now)) return isDueSoon(a.deadline, now) ? -1 : 1;
      const priorityValues: Record<EventPriority, number> = { High: 0, Medium: 1, Low: 2 };
      if (priorityValues[a.priority] !== priorityValues[b.priority]) {
        return priorityValues[a.priority] - priorityValues[b.priority];
      }
      return a.date.localeCompare(b.date);
    });
  }, [events, now]);
  const progressPercent = Math.min(100, Math.round((currentMonthEvents.length / 5) * 100));
  const dueSoonEvents = useMemo(
    () => events.filter((eventItem) => !eventItem.completed && eventItem.deadline && isDueSoon(eventItem.deadline, now)),
    [events, now]
  );
  const overdueEvents = useMemo(
    () => events.filter((eventItem) => !eventItem.completed && eventItem.deadline && isOverdue(eventItem.deadline, now)),
    [events, now]
  );

  function addEvent() {
    const trimmedTitle = title.trim();
    const eventDate = date || (deadline ? deadline.slice(0, 10) : '');
    const eventDeadline = deadline || formatDateTimeInput(new Date());

    if (!trimmedTitle || !eventDate || !eventDeadline) return;

    const eventPayload = {
      title: trimmedTitle,
      date: eventDate,
      notes: notes.trim(),
      deadline: eventDeadline,
      category,
      priority,
    };

    if (editingId) {
      setEvents((prev) => prev.map((eventItem) =>
        eventItem.id === editingId ? { ...eventItem, ...eventPayload, completed: eventItem.completed } : eventItem
      ));
      setEditingId(null);
    } else {
      setEvents((prev) => [
        { id: crypto.randomUUID(), ...eventPayload, completed: false },
        ...prev,
      ]);
    }

    setTitle('');
    setDate('');
    setNotes('');
    setDeadline('');
    setCategory('Dreams');
    setPriority('Medium');
  }

  function removeEvent(id: string) {
    setEvents((prev) => prev.filter((eventItem) => eventItem.id !== id));
    if (editingId === id) {
      setEditingId(null);
      setTitle('');
      setDate('');
      setNotes('');
      setDeadline('');
    }
  }

  function editEvent(eventItem: EventItem) {
    setEditingId(eventItem.id);
    setTitle(eventItem.title);
    setDate(eventItem.date);
    setNotes(eventItem.notes);
    setCategory(eventItem.category);
    setPriority(eventItem.priority);
    setDeadline(eventItem.deadline);
    setSelectedDate(eventItem.date);
  }

  function cancelEdit() {
    setEditingId(null);
    setTitle('');
    setDate('');
    setNotes('');
    setDeadline('');
  }

  function toggleComplete(id: string) {
    const target = events.find((eventItem) => eventItem.id === id);
    if (!target) return;

    const willComplete = !target.completed;
    setEvents((prev) => prev.map((eventItem) => eventItem.id === id ? { ...eventItem, completed: willComplete } : eventItem));

    if (willComplete) {
      const deadlineTime = target.deadline ? new Date(target.deadline).getTime() : null;
      if (deadlineTime && deadlineTime > Date.now()) {
        setCelebration(`Amazing! You finished “${target.title}” before the deadline.`);
      } else {
        setCelebration(`Nice work — “${target.title}” is now complete.`);
      }
    }
  }

  function selectDay(day: Date | null) {
    if (!day) return;
    const localDate = formatDateInput(day);
    setSelectedDate(localDate);
    setDate(localDate);
    setCurrentMonth(day);
  }

  return (
    <section className="page-card calendar-page">
      <div className="page-header">
        <div>
          <h2>Calendar & Reminders</h2>
          <p>Schedule events, set reminders, and keep your wishes on track.</p>
        </div>
        <img src="/calendar-illustration.svg" alt="Calendar illustration" className="page-illustration" />
      </div>

      <div className="calendar-progress-card">
        <div className="progress-ring" style={{ background: `conic-gradient(#ff9f1c ${progressPercent}%, rgba(255, 255, 255, 0.16) ${progressPercent}% 100%)` }}>
          <span>{progressPercent}%</span>
        </div>
        <div className="calendar-progress-copy">
          <h3>Month plan progress</h3>
          <p>{currentMonthEvents.length} planned reminder{currentMonthEvents.length === 1 ? '' : 's'} this month.</p>
          <div className="progress-track" aria-label="Monthly planning progress">
            <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      </div>

      <div className="deadline-alerts">
        {celebration && <div className="success-banner">🎉 {celebration}</div>}
        {todayEvents.length > 0 && (
          <div className="info-banner">
            📅 Today's agenda: {todayEvents.map((eventItem) => eventItem.title).join(', ')}
          </div>
        )}
        {dueSoonEvents.length > 0 && (
          <div className="warning-banner">
            ⚠️ Upcoming deadlines: {dueSoonEvents.map((eventItem) => eventItem.title).join(', ')}
          </div>
        )}
        {overdueEvents.length > 0 && (
          <div className="danger-banner">
            ⏰ Not finished on time: {overdueEvents.map((eventItem) => eventItem.title).join(', ')}
          </div>
        )}
      </div>

      <div className="calendar-form">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Task title"
        />
        <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        <select value={category} onChange={(event) => setCategory(event.target.value as EventCategory)}>
          {categories.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        <select value={priority} onChange={(event) => setPriority(event.target.value as EventPriority)}>
          {priorities.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        <input
          type="datetime-local"
          value={deadline}
          onChange={(event) => setDeadline(event.target.value)}
          placeholder="Deadline"
        />
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Notes or reminder"
          rows={3}
        />
        <button className="full-width" onClick={addEvent}>{editingId ? 'Update Task' : 'Add Task'}</button>
      </div>

      {editingId && (
        <div className="edit-banner">
          Editing event — <button className="text-button" onClick={cancelEdit}>Cancel</button>
        </div>
      )}

      <div className="calendar-grid-wrapper">
        <div className="month-header">
          <button onClick={() => setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}>
            Prev
          </button>
          <strong>{currentMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</strong>
          <button onClick={() => setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}>
            Next
          </button>
        </div>
        <div className="calendar-grid">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((weekday) => (
            <div key={weekday} className="calendar-cell calendar-cell-header">{weekday}</div>
          ))}
          {monthGrid.map((day, index) => {
            const iso = day ? formatDateInput(day) : '';
            const hasEvents = day ? events.some((eventItem) => eventItem.date === iso) : false;
            const selected = day && iso === selectedDate;
            return (
              <button
                type="button"
                key={`${day?.toString() ?? 'empty'}-${index}`}
                onClick={() => selectDay(day)}
                className={`calendar-cell ${day ? '' : 'calendar-cell-empty'} ${hasEvents ? 'calendar-cell-event' : ''} ${selected ? 'calendar-cell-selected' : ''}`}
              >
                {day?.getDate() ?? ''}
              </button>
            );
          })}
        </div>
      </div>

      <div className="event-list">
        {sortedEvents.length ? (
          Object.entries(groupedByMonth).map(([month, monthEvents]) => (
            <div key={month} className="month-group">
              <h3 className="month-heading">{month}</h3>
              <div className="month-events">
                {monthEvents.map((eventItem) => (
                  <article key={eventItem.id} className="event-card">
                    <div className="event-card-heading">
                      <div>
                        <h4>{eventItem.title}</h4>
                        <p>{formatEventDate(eventItem.date)}</p>
                      </div>
                      <div className="event-actions">
                        <button className="text-button" onClick={() => editEvent(eventItem)}>
                          Edit
                        </button>
                        <button className="delete-button" onClick={() => removeEvent(eventItem.id)}>
                          Delete
                        </button>
                      </div>
                    </div>
                    <div className="event-meta-row">
                      <span className={`status-pill ${getDeadlineStatus(eventItem, now).tone}`}>
                        {getDeadlineStatus(eventItem, now).label}
                      </span>
                      <span className="event-pill category-pill">{eventItem.category}</span>
                      <span className="event-pill priority-pill">{eventItem.priority}</span>
                      <span className="deadline-label">Deadline: {formatDeadline(eventItem.deadline)}</span>
                    </div>
                    {eventItem.notes && <p className="event-notes">{eventItem.notes}</p>}
                    <button className="complete-button" onClick={() => toggleComplete(eventItem.id)}>
                      {eventItem.completed ? 'Undo completion' : 'Mark complete'}
                    </button>
                  </article>
                ))}
              </div>
            </div>
          ))
        ) : (
          <p className="empty-state">No calendar events yet. Add one to stay reminded.</p>
        )}
      </div>
    </section>
  );
}
