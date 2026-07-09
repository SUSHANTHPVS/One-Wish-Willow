import mongoose from 'mongoose';

const FitnessEntrySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  activity: { type: String, required: true },
  duration: { type: Number, default: 0 },
  intensity: { type: String, default: 'Medium' },
  mood: { type: String, default: '' },
  date: { type: String, default: () => new Date().toLocaleDateString() },
}, { timestamps: true });

export default mongoose.model('FitnessEntry', FitnessEntrySchema);
