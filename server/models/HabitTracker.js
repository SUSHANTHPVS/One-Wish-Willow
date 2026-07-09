import mongoose from 'mongoose';

const habitTrackerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  emoji: String,
  description: String,
  frequency: {
    type: String,
    enum: ['daily', 'weekly'],
    default: 'daily',
  },
  completionDates: [Date],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('HabitTracker', habitTrackerSchema);
