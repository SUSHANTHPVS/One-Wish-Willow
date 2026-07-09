import mongoose from 'mongoose';

const MentalHealthEntrySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mood: { type: String, default: '' },
  stressLevel: { type: Number, default: 3 },
  notes: { type: String, default: '' },
  date: { type: String, default: () => new Date().toLocaleDateString() },
}, { timestamps: true });

export default mongoose.model('MentalHealthEntry', MentalHealthEntrySchema);
