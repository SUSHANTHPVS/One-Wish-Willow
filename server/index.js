import path from 'path';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import { OAuth2Client } from 'google-auth-library';

import User from './models/User.js';
import Notification from './models/Notification.js';
import Wish from './models/Wish.js';
import Event from './models/Event.js';
import FitnessEntry from './models/FitnessEntry.js';
import MusicItem from './models/MusicItem.js';
import MentalHealthEntry from './models/MentalHealthEntry.js';
import AddictionEntry from './models/AddictionEntry.js';
import Translation from './models/Translation.js';
import MoodEntry from './models/MoodEntry.js';
import JournalEntry from './models/JournalEntry.js';
import GratitudeEntry from './models/GratitudeEntry.js';
import MeditationSession from './models/MeditationSession.js';
import HabitTracker from './models/HabitTracker.js';
import WaterIntake from './models/WaterIntake.js';
import SleepEntry from './models/SleepEntry.js';
import Quote from './models/Quote.js';
import SelfCareTip from './models/SelfCareTip.js';
import { generateLocalReply } from './assistantReply.js';
import { buildStatistics } from './statistics.js';
import { createGoogleAuthHandler } from './googleAuth.js';
import { buildNotifications } from './notifications.js';
import { normalizeProfilePicture } from './profilePicture.js';

dotenv.config();

const app = express();
const requestedPort = Number(process.env.PORT) || 4000;
const PORT = Number.isNaN(requestedPort) ? 4000 : requestedPort;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/one-wish-willow';
const JWT_SECRET = process.env.JWT_SECRET || 'one-wish-secret';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_TRANSLATE_API_KEY = process.env.GOOGLE_TRANSLATE_API_KEY || null;
const GOOGLE_TRANSLATE_PROJECT_ID = process.env.GOOGLE_TRANSLATE_PROJECT_ID || null;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb' }));
app.use(express.static(path.resolve(process.cwd(), 'public')));
app.use(express.static(path.resolve(process.cwd(), 'dist')));

// Create uploads directory if it doesn't exist
const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

mongoose.set('bufferCommands', false);

mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
})
  .then(() => {
    console.log('MongoDB connected');
    startServer();
  })
  .catch((error) => {
    console.error('MongoDB connection error', error);
    startServer();
  });

function startServer() {
  console.log(`Attempting to start server on port ${PORT}`);
  const server = app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Stop the other process or set a different PORT in .env.`);
    } else {
      console.error('Server error', error);
    }
    process.exit(1);
  });
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
}

// Admin credentials
const ADMIN_USERNAME = 'lokesh123';
const ADMIN_EMAIL = 'lokesh123@gmail.com';
const ADMIN_PASSWORD = 'lokesh123@'; // Direct password for easier testing
function adminMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden - Admin access required' });
    }
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
}
app.post('/api/auth/register', async (req, res) => {
  const { username, password, email, bio } = req.body;
  
  if (!username || !password || !email) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }
  
  // Check if username exists
  const existingUsername = await User.findOne({ username });
  if (existingUsername) {
    return res.status(400).json({ message: 'Username already exists' });
  }
  
  // Check if email exists
  const existingEmail = await User.findOne({ email });
  if (existingEmail) {
    return res.status(400).json({ message: 'Email already registered' });
  }
  
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ username, password: hashedPassword, email, bio });
  await user.save();
  const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { username: user.username, email: user.email, bio: user.bio } });
});

app.post('/api/auth/google', createGoogleAuthHandler({
  userModel: User,
  googleClient: new OAuth2Client(GOOGLE_CLIENT_ID),
  clientId: GOOGLE_CLIENT_ID,
  jwtSecret: JWT_SECRET,
}));

app.post('/api/auth/login', async (req, res) => {
  const { usernameOrEmail, password } = req.body;
  
  if (!usernameOrEmail || !password) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  
  // Find user by username or email
  const user = await User.findOne({
    $or: [
      { username: usernameOrEmail },
      { email: usernameOrEmail }
    ]
  });
  
  if (!user) {
    return res.status(400).json({ message: 'Invalid credentials' });
  }
  
  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    return res.status(400).json({ message: 'Invalid credentials' });
  }
  
  const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { username: user.username, email: user.email, bio: user.bio } });
});

// Admin Login Endpoint
app.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  
  // Check admin credentials
  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ message: 'Invalid admin credentials' });
  }
  
  const token = jwt.sign(
    { id: 'admin', username: ADMIN_USERNAME, role: 'admin' },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  
  res.json({
    token,
    user: {
      username: ADMIN_USERNAME,
      email: ADMIN_EMAIL,
      role: 'admin'
    }
  });
});

app.get('/api/statistics', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('createdAt').lean();
    if (!user) return res.status(404).json({ message: 'User not found' });
    const definitions = [
      { model: Wish, name: 'Wish List', icon: '\u2728' },
      { model: Event, name: 'Calendar', icon: '\ud83d\udcc5' },
      { model: FitnessEntry, name: 'Fitness', icon: '\ud83d\udcaa' },
      { model: MusicItem, name: 'Music', icon: '\ud83c\udfb5' },
      { model: MentalHealthEntry, name: 'Mental Health', icon: '\ud83c\udf3f' },
      { model: AddictionEntry, name: 'Addiction Help', icon: '\ud83e\udd1d' },
      { model: Translation, name: 'Translate', icon: '\ud83c\udf10' },
      { model: MeditationSession, name: 'Meditation', icon: '\ud83e\uddd8', owner: 'userId' },
      { model: MoodEntry, name: 'Mood', icon: '\ud83d\ude42', owner: 'userId' },
      { model: JournalEntry, name: 'Journal', icon: '\ud83d\udcd3', owner: 'userId' },
      { model: GratitudeEntry, name: 'Gratitude', icon: '\ud83d\ude4f', owner: 'userId' },
      { model: HabitTracker, name: 'Habits', icon: '\u2705', owner: 'userId' },
      { model: WaterIntake, name: 'Water', icon: '\ud83d\udca7', owner: 'userId' },
      { model: SleepEntry, name: 'Sleep', icon: '\ud83d\ude34', owner: 'userId' },
    ];
    const sources = await Promise.all(definitions.map(async ({ model, name, icon, owner = 'user' }) => ({
      name,
      icon,
      records: await model.find({ [owner]: req.user.id }).select('createdAt completedAt date progress duration').lean(),
    })));
    res.set('Cache-Control', 'no-store');
    res.json(buildStatistics(user, sources));
  } catch (error) {
    res.status(500).json({ message: 'Unable to load statistics. Please try again.' });
  }
});

app.get('/api/profile', authMiddleware, async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.set('Cache-Control', 'no-store');
  res.json({ username: user.username, email: user.email, bio: user.bio, profilePicture: user.profilePicture, languagePreference: user.languagePreference });
});

app.post('/api/profile/picture', authMiddleware, async (req, res) => {
  let picture;
  try {
    const { fileData, fileName } = req.body;
    picture = normalizeProfilePicture(fileData, fileName);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
  try {
    const user = await User.findByIdAndUpdate(req.user.id, { $set: { profilePicture: picture } }, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.set('Cache-Control', 'no-store');
    res.json({ username: user.username, email: user.email, bio: user.bio, profilePicture: user.profilePicture, languagePreference: user.languagePreference });
  } catch {
    res.status(500).json({ message: 'Unable to save profile picture. Please try again.' });
  }
});

app.delete('/api/profile/picture', authMiddleware, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.user.id, { $set: { profilePicture: null } }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ username: user.username, email: user.email, bio: user.bio, profilePicture: null, languagePreference: user.languagePreference });
  } catch (error) {
    res.status(500).json({ message: 'Unable to remove profile picture. Please try again.' });
  }
});

app.put('/api/profile', authMiddleware, async (req, res) => {
  const { email, bio, languagePreference } = req.body;
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  user.email = email ?? user.email;
  user.bio = bio ?? user.bio;
  user.languagePreference = languagePreference ?? user.languagePreference;
  await user.save();
  res.json({ username: user.username, email: user.email, bio: user.bio, profilePicture: user.profilePicture, languagePreference: user.languagePreference });
});

app.get('/api/wishes', authMiddleware, async (req, res) => {
  const wishes = await Wish.find({ user: req.user.id });
  res.json(wishes);
});

app.post('/api/wishes', authMiddleware, async (req, res) => {
  const { title, progress } = req.body;
  const wish = new Wish({ user: req.user.id, title, progress: progress || 0 });
  await wish.save();
  res.json(wish);
});

app.put('/api/wishes/:id', authMiddleware, async (req, res) => {
  const wish = await Wish.findOne({ _id: req.params.id, user: req.user.id });
  if (!wish) return res.status(404).json({ message: 'Wish not found' });
  wish.title = req.body.title ?? wish.title;
  wish.progress = req.body.progress ?? wish.progress;
  await wish.save();
  res.json(wish);
});

app.delete('/api/wishes/:id', authMiddleware, async (req, res) => {
  await Wish.deleteOne({ _id: req.params.id, user: req.user.id });
  res.json({ success: true });
});

app.get('/api/notifications', authMiddleware, async (req, res) => {
  const timeZone = typeof req.query.timeZone === 'string' ? req.query.timeZone : 'UTC';
  try {
    new Intl.DateTimeFormat('en', { timeZone }).format();
  } catch {
    return res.status(400).json({ message: 'Invalid notification timezone.' });
  }
  try {
    const user = req.user.id;
    const [wishes, events] = await Promise.all([
      Wish.find({ user, progress: { $gte: 100 } }).select('title progress createdAt updatedAt').lean(),
      Event.find({ user, completed: { $ne: true } }).select('title date deadline completed').lean(),
    ]);
    const candidates = buildNotifications({ wishes, events, timeZone });
    if (candidates.length) {
      try {
        await Notification.bulkWrite(candidates.map(candidate => ({
          updateOne: {
            filter: { user, key: candidate.key },
            update: {
              $set: { title: candidate.title, message: candidate.message, href: candidate.href, kind: candidate.kind },
              $setOnInsert: { user, key: candidate.key, createdAt: candidate.createdAt },
            },
            upsert: true,
          },
        })), { ordered: false });
      } catch (error) {
        if (!error.writeErrors?.length || error.writeErrors.some(failure => failure.code !== 11000)) throw error;
      }
    }
    const filter = { user, key: { $in: candidates.map(candidate => candidate.key) }, dismissedAt: null };
    const [items, unreadCount] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1, _id: -1 }).limit(50).select('-user -__v').lean(),
      Notification.countDocuments({ ...filter, readAt: null }),
    ]);
    res.set('Cache-Control', 'no-store');
    res.json({ items, unreadCount });
  } catch {
    res.status(500).json({ message: 'Unable to load notifications. Please try again.' });
  }
});

app.put('/api/notifications/read-all', authMiddleware, async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user.id, readAt: null, dismissedAt: null }, { $set: { readAt: new Date() } });
    res.json({ success: true });
  } catch {
    res.status(500).json({ message: 'Unable to mark notifications as read.' });
  }
});

app.put('/api/notifications/:id/read', authMiddleware, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid notification.' });
  try {
    const result = await Notification.updateOne({ _id: req.params.id, user: req.user.id }, { $set: { readAt: new Date() } });
    if (!result.matchedCount) return res.status(404).json({ message: 'Notification not found.' });
    res.json({ success: true });
  } catch {
    res.status(500).json({ message: 'Unable to mark notification as read.' });
  }
});

app.delete('/api/notifications/:id', authMiddleware, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid notification.' });
  try {
    const result = await Notification.updateOne({ _id: req.params.id, user: req.user.id }, { $set: { dismissedAt: new Date() } });
    if (!result.matchedCount) return res.status(404).json({ message: 'Notification not found.' });
    res.json({ success: true });
  } catch {
    res.status(500).json({ message: 'Unable to dismiss notification.' });
  }
});

function calendarFields(body) {
  return Object.fromEntries(['title', 'date', 'deadline', 'notes', 'category', 'priority', 'completed']
    .filter(field => body[field] !== undefined).map(field => [field, body[field]]));
}

app.get('/api/events', authMiddleware, async (req, res) => {
  const events = await Event.find({ user: req.user.id });
  res.json(events);
});

app.post('/api/events', authMiddleware, async (req, res) => {
  const clientId = typeof req.body.clientId === 'string' ? req.body.clientId.slice(0, 100) : null;
  try {
    if (clientId) {
      const event = await Event.findOneAndUpdate(
        { user: req.user.id, clientId },
        { $setOnInsert: { ...calendarFields(req.body), user: req.user.id, clientId } },
        { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
      );
      return res.json(event);
    }
    const event = new Event({ ...calendarFields(req.body), user: req.user.id });
    await event.save();
    res.json(event);
  } catch (error) {
    if (error.code === 11000 && clientId) {
      const existing = await Event.findOne({ user: req.user.id, clientId });
      if (existing) return res.json(existing);
    }
    res.status(400).json({ message: 'Unable to save this calendar event.' });
  }
});

app.put('/api/events/:id', authMiddleware, async (req, res) => {
  const event = await Event.findOne({ _id: req.params.id, user: req.user.id });
  if (!event) return res.status(404).json({ message: 'Event not found' });
  Object.assign(event, calendarFields(req.body));
  await event.save();
  res.json(event);
});

app.delete('/api/events/:id', authMiddleware, async (req, res) => {
  await Event.deleteOne({ _id: req.params.id, user: req.user.id });
  res.json({ success: true });
});

app.get('/api/fitness', authMiddleware, async (req, res) => {
  const entries = await FitnessEntry.find({ user: req.user.id });
  res.json(entries);
});

app.post('/api/fitness', authMiddleware, async (req, res) => {
  const entry = new FitnessEntry({ user: req.user.id, ...req.body });
  await entry.save();
  res.json(entry);
});

app.delete('/api/fitness/:id', authMiddleware, async (req, res) => {
  await FitnessEntry.deleteOne({ _id: req.params.id, user: req.user.id });
  res.json({ success: true });
});

app.get('/api/music', authMiddleware, async (req, res) => {
  const items = await MusicItem.find({ user: req.user.id });
  res.json(items);
});

app.post('/api/music', authMiddleware, async (req, res) => {
  const item = new MusicItem({ user: req.user.id, ...req.body });
  await item.save();
  res.json(item);
});

app.delete('/api/music/:id', authMiddleware, async (req, res) => {
  await MusicItem.deleteOne({ _id: req.params.id, user: req.user.id });
  res.json({ success: true });
});

app.get('/api/mental-health', authMiddleware, async (req, res) => {
  const entries = await MentalHealthEntry.find({ user: req.user.id });
  res.json(entries);
});

app.post('/api/mental-health', authMiddleware, async (req, res) => {
  const entry = new MentalHealthEntry({ user: req.user.id, ...req.body });
  await entry.save();
  res.json(entry);
});

app.delete('/api/mental-health/:id', authMiddleware, async (req, res) => {
  await MentalHealthEntry.deleteOne({ _id: req.params.id, user: req.user.id });
  res.json({ success: true });
});

app.get('/api/addiction-help', authMiddleware, async (req, res) => {
  const entries = await AddictionEntry.find({ user: req.user.id });
  res.json(entries);
});

app.post('/api/addiction-help', authMiddleware, async (req, res) => {
  const entry = new AddictionEntry({ user: req.user.id, ...req.body });
  await entry.save();
  res.json(entry);
});

app.delete('/api/addiction-help/:id', authMiddleware, async (req, res) => {
  await AddictionEntry.deleteOne({ _id: req.params.id, user: req.user.id });
  res.json({ success: true });
});

app.post('/api/translate', authMiddleware, async (req, res) => {
  const entry = new Translation({ user: req.user.id, ...req.body });
  await entry.save();
  res.json(entry);
});

app.get('/api/translate', authMiddleware, async (req, res) => {
  const entries = await Translation.find({ user: req.user.id });
  res.json(entries);
});

app.post('/api/translate/text', authMiddleware, async (req, res) => {
  const { q, source, target } = req.body || {};
  if (!q || !source || !target) {
    return res.status(400).json({ message: 'Missing translation payload' });
  }

  const tryGoogleTranslate = async () => {
    if (!GOOGLE_TRANSLATE_API_KEY) {
      return null;
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const response = await fetch('https://translation.googleapis.com/language/translate/v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q,
          source_language: source,
          target_language: target,
          key: GOOGLE_TRANSLATE_API_KEY,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        console.warn(`Google Translate API error: ${response.status}`);
        return null;
      }

      const data = await response.json();

      if (data.data && data.data.translations && data.data.translations[0]) {
        return data.data.translations[0].translatedText;
      }

      console.warn('Google Translate returned unexpected response format');
      return null;
    } catch (err) {
      console.error('Google Translate error:', err.message);
      return null;
    }
  };

  const tryLibreTranslate = async (maxRetries = 1) => {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        const response = await fetch('https://libretranslate.de/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            q,
            source,
            target,
            format: 'text',
          }),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!response.ok) {
          if (attempt < maxRetries) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
          continue;
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          if (attempt < maxRetries) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
          continue;
        }

        const data = await response.json();
        const translated = data.translatedText || data.translation || null;

        if (translated) {
          return translated;
        }

        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (err) {
        console.error(`LibreTranslate attempt ${attempt + 1} failed:`, err.message);
        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    }
    return null;
  };

  const tryArgosopentech = async (maxRetries = 1) => {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        const response = await fetch('https://translate.argosopentech.com/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            q,
            source,
            target,
            format: 'text',
          }),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!response.ok) {
          if (attempt < maxRetries) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
          continue;
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          if (attempt < maxRetries) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
          continue;
        }

        const data = await response.json();
        const translated = data.translatedText || data.translation || null;

        if (translated) {
          return translated;
        }

        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (err) {
        console.error(`Argosopentech attempt ${attempt + 1} failed:`, err.message);
        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    }
    return null;
  };

  try {
    let result = null;

    // Try Google Translate first (if API key is available)
    if (GOOGLE_TRANSLATE_API_KEY) {
      console.log('Attempting Google Translate...');
      result = await tryGoogleTranslate();
      if (result) {
        console.log('✓ Google Translate succeeded');
        return res.json({ translatedText: result, service: 'google' });
      }
      console.log('✗ Google Translate failed, trying fallback services');
    }

    // Try LibreTranslate
    console.log('Attempting LibreTranslate...');
    result = await tryLibreTranslate(1);
    if (result) {
      console.log('✓ LibreTranslate succeeded');
      return res.json({ translatedText: result, service: 'libretranslate' });
    }
    console.log('✗ LibreTranslate failed, trying Argosopentech');

    // Try Argosopentech
    console.log('Attempting Argosopentech...');
    result = await tryArgosopentech(1);
    if (result) {
      console.log('✓ Argosopentech succeeded');
      return res.json({ translatedText: result, service: 'argosopentech' });
    }

    // All services failed
    console.warn(`All translation services failed: source=${source}, target=${target}, text=${q}`);
    return res.status(503).json({ message: 'All translation services are temporarily unavailable. Please try again in a moment.' });
  } catch (error) {
    console.error('Translation endpoint error:', error);
    res.status(502).json({ message: 'Translation service error. Please try again.' });
  }
});

// Health check endpoint for translation services
app.get('/api/translate/health', authMiddleware, async (req, res) => {
  const testPayload = {
    q: 'hello',
    source: 'en',
    target: 'es',
    format: 'text',
  };

  const checkGoogleTranslate = async () => {
    if (!GOOGLE_TRANSLATE_API_KEY) {
      return 'not_configured';
    }
    try {
      const response = await fetch('https://translation.googleapis.com/language/translate/v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q: testPayload.q,
          source_language: testPayload.source,
          target_language: testPayload.target,
          key: GOOGLE_TRANSLATE_API_KEY,
        }),
        timeout: 5000,
      });
      return response.ok ? 'ok' : 'error';
    } catch {
      return 'down';
    }
  };

  const checkLibreTranslate = async () => {
    try {
      const response = await fetch('https://libretranslate.de/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPayload),
        timeout: 5000,
      });
      return response.ok ? 'ok' : 'error';
    } catch {
      return 'down';
    }
  };

  const checkArgosopentech = async () => {
    try {
      const response = await fetch('https://translate.argosopentech.com/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPayload),
        timeout: 5000,
      });
      return response.ok ? 'ok' : 'error';
    } catch {
      return 'down';
    }
  };

  const [google, libretranslate, argosopentech] = await Promise.all([
    checkGoogleTranslate(),
    checkLibreTranslate(),
    checkArgosopentech(),
  ]);

  const hasGoogleKey = GOOGLE_TRANSLATE_API_KEY ? true : false;
  const status =
    (hasGoogleKey && google === 'ok') || libretranslate === 'ok' || argosopentech === 'ok'
      ? 'available'
      : 'unavailable';

  res.json({
    google: google,
    libretranslate: libretranslate,
    argosopentech: argosopentech,
    status: status,
    hasGoogleApiKey: hasGoogleKey,
  });
});

app.post('/api/assistant/chat', authMiddleware, async (req, res) => {
  const { messages = [] } = req.body;
  const reply = generateLocalReply(messages);
  res.json({ reply });
});

// ========== MOOD TRACKER ROUTES ==========
app.post('/api/mood/entries', authMiddleware, async (req, res) => {
  try {
    const { mood, intensity, triggers, notes } = req.body;
    const entry = await MoodEntry.create({ userId: req.userId, mood, intensity, triggers, notes });
    res.json(entry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/mood/entries', authMiddleware, async (req, res) => {
  try {
    const entries = await MoodEntry.find({ userId: req.userId }).sort({ date: -1 });
    res.json(entries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/mood/trends', authMiddleware, async (req, res) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const entries = await MoodEntry.find({ userId: req.userId, date: { $gte: sevenDaysAgo } });
    res.json(entries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========== JOURNAL ENTRY ROUTES ==========
app.post('/api/journal/entries', authMiddleware, async (req, res) => {
  try {
    const { title, content, tags } = req.body;
    const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
    const entry = await JournalEntry.create({ userId: req.userId, title, content, wordCount, tags });
    res.json(entry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/journal/entries', authMiddleware, async (req, res) => {
  try {
    const entries = await JournalEntry.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(entries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/journal/entries/:id', authMiddleware, async (req, res) => {
  try {
    const entry = await JournalEntry.findOne({ _id: req.params.id, userId: req.userId });
    res.json(entry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/journal/entries/:id', authMiddleware, async (req, res) => {
  try {
    const { title, content, tags } = req.body;
    const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
    const entry = await JournalEntry.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { title, content, wordCount, tags, updatedAt: new Date() },
      { new: true }
    );
    res.json(entry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/journal/entries/:id', authMiddleware, async (req, res) => {
  try {
    await JournalEntry.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========== GRATITUDE LOG ROUTES ==========
app.post('/api/gratitude/entries', authMiddleware, async (req, res) => {
  try {
    const { gratitudes } = req.body;
    const entry = await GratitudeEntry.create({ userId: req.userId, gratitudes });
    res.json(entry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/gratitude/entries', authMiddleware, async (req, res) => {
  try {
    const entries = await GratitudeEntry.find({ userId: req.userId }).sort({ date: -1 });
    res.json(entries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========== MEDITATION SESSION ROUTES ==========
app.post('/api/meditation/sessions', authMiddleware, async (req, res) => {
  try {
    const { duration, type } = req.body;
    const session = await MeditationSession.create({ userId: req.userId, duration, type });
    res.json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/meditation/sessions', authMiddleware, async (req, res) => {
  try {
    const sessions = await MeditationSession.find({ userId: req.userId }).sort({ completedAt: -1 });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========== HABIT TRACKER ROUTES ==========
app.post('/api/habits', authMiddleware, async (req, res) => {
  try {
    const { name, emoji, description, frequency } = req.body;
    const habit = await HabitTracker.create({ userId: req.userId, name, emoji, description, frequency });
    res.json(habit);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/habits', authMiddleware, async (req, res) => {
  try {
    const habits = await HabitTracker.find({ userId: req.userId });
    res.json(habits);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/habits/:id/complete', authMiddleware, async (req, res) => {
  try {
    const habit = await HabitTracker.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { $push: { completionDates: new Date() } },
      { new: true }
    );
    res.json(habit);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/habits/:id', authMiddleware, async (req, res) => {
  try {
    await HabitTracker.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========== WATER INTAKE ROUTES ==========
app.post('/api/water/log', authMiddleware, async (req, res) => {
  try {
    const { amount } = req.body;
    const entry = await WaterIntake.create({ userId: req.userId, amount });
    res.json(entry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/water/today', authMiddleware, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const entries = await WaterIntake.find({
      userId: req.userId,
      date: { $gte: today, $lt: tomorrow }
    });
    const totalAmount = entries.reduce((sum, e) => sum + e.amount, 0);
    res.json({ totalAmount, entries });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========== SLEEP ENTRY ROUTES ==========
app.post('/api/sleep/entries', authMiddleware, async (req, res) => {
  try {
    const { duration, quality, notes } = req.body;
    const entry = await SleepEntry.create({ userId: req.userId, duration, quality, notes });
    res.json(entry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/sleep/entries', authMiddleware, async (req, res) => {
  try {
    const entries = await SleepEntry.find({ userId: req.userId }).sort({ date: -1 });
    res.json(entries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========== QUOTES ROUTES ==========
app.get('/api/quotes/random', authMiddleware, async (req, res) => {
  try {
    const count = await Quote.countDocuments();
    const random = Math.floor(Math.random() * count);
    const quote = await Quote.findOne().skip(random);
    res.json(quote);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/quotes', authMiddleware, async (req, res) => {
  try {
    const quotes = await Quote.find();
    res.json(quotes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========== SELF-CARE TIPS ROUTES ==========
app.get('/api/selfcare/tips', authMiddleware, async (req, res) => {
  try {
    const tips = await SelfCareTip.find();
    res.json(tips);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/selfcare/tips/category/:category', authMiddleware, async (req, res) => {
  try {
    const tips = await SelfCareTip.find({ category: req.params.category });
    res.json(tips);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========== ADMIN ROUTES ==========
// Get admin statistics
app.get('/api/admin/stats', adminMiddleware, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ lastActive: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } });
    const totalWishes = await Wish.countDocuments();
    const allSessions = await User.find({}).select('sessionTime');
    const averageSessionTime = allSessions.length > 0 
      ? Math.round(allSessions.reduce((acc, u) => acc + (u.sessionTime || 0), 0) / allSessions.length / 60)
      : 0;

    res.json({
      totalUsers,
      activeUsers,
      totalWishes,
      averageSessionTime
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all users
app.get('/api/admin/users', adminMiddleware, async (req, res) => {
  try {
    const users = await User.find({}).select('username email createdAt lastActive profilePicture bio').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete user
app.delete('/api/admin/users/:id', adminMiddleware, async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Delete user and all their associated data
    await User.findByIdAndDelete(userId);
    await Notification.deleteMany({ user: userId });
    await Wish.deleteMany({ userId });
    await Event.deleteMany({ userId });
    await FitnessEntry.deleteMany({ userId });
    await MusicItem.deleteMany({ userId });
    await MentalHealthEntry.deleteMany({ userId });
    await AddictionEntry.deleteMany({ userId });
    await Translation.deleteMany({ userId });
    await MoodEntry.deleteMany({ userId });
    await JournalEntry.deleteMany({ userId });
    await GratitudeEntry.deleteMany({ userId });
    await MeditationSession.deleteMany({ userId });
    await HabitTracker.deleteMany({ userId });
    await WaterIntake.deleteMany({ userId });
    await SleepEntry.deleteMany({ userId });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }

  const indexPath = path.resolve(process.cwd(), 'dist', 'index.html');
  res.sendFile(indexPath, (error) => {
    if (error) {
      res.status(404).send('Not found');
    }
  });
});
