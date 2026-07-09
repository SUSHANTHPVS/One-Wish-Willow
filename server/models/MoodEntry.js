import mongoose from 'mongoose';

const moodEntrySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  mood: {
    type: String,
    enum: ['😭', '😞', '😐', '🙂', '😄', '🤩'],
    required: true,
  },
  intensity: {
    type: Number,
    min: 1,
    max: 10,
    required: true,
  },
  triggers: String,
  notes: String,
  date: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('MoodEntry', moodEntrySchema);
