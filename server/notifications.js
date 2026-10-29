const DAY = 24 * 60 * 60 * 1000;

export function buildNotifications({ wishes, events, now = new Date(), timeZone = 'UTC' }) {
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now);
  const notifications = wishes.filter(wish => wish.progress >= 100).map(wish => ({
    key: `wish:${wish._id}:completed`,
    kind: 'wish-completed',
    title: 'Wish completed',
    message: `You reached 100% on "${wish.title}".`,
    href: '/wish-list',
    createdAt: wish.updatedAt || wish.createdAt || now,
  }));

  for (const event of events) {
    if (event.completed) continue;
    const deadline = event.deadline ? new Date(event.deadline) : null;
    const remaining = deadline ? deadline.getTime() - now.getTime() : NaN;
    let kind;
    let title;
    let message;
    if (remaining <= 0 && remaining >= -7 * DAY) {
      kind = 'event-overdue';
      title = 'Deadline missed';
      message = `"${event.title}" is overdue and still incomplete.`;
    } else if (remaining > 0 && remaining <= DAY) {
      kind = 'event-due';
      title = 'Deadline approaching';
      message = `"${event.title}" is due within the next 24 hours.`;
    } else if (event.date === today && !Number.isFinite(remaining)) {
      kind = 'event-today';
      title = "On today's calendar";
      message = `"${event.title}" is scheduled for today.`;
    }
    if (!kind) continue;
    notifications.push({
      key: `event:${event._id}:${kind}:${event.deadline || event.date}`,
      kind,
      title,
      message,
      href: '/calendar',
      createdAt: now,
    });
  }
  return notifications;
}