import mongoose from 'mongoose';

const sleepEntrySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  duration: {
    type: Number,
    required: true,
  },
  quality: {
    type: Number,
    min: 1,
    max: 5,
    required: true,
  },
  notes: String,
  date: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('SleepEntry', sleepEntrySchema);
