import mongoose from 'mongoose';

const meditationSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  duration: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    enum: ['breathing', 'body-scan', 'mindfulness', 'visualization'],
    required: true,
  },
  completedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('MeditationSession', meditationSessionSchema);
