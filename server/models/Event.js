import mongoose from 'mongoose';

const EventSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  date: { type: String, required: true },
  deadline: { type: String, default: '' },
  notes: { type: String, default: '' },
  category: { type: String, default: 'Dreams' },
  priority: { type: String, default: 'Medium' },
  completed: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model('Event', EventSchema);
