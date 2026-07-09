import mongoose from 'mongoose';

const AddictionEntrySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  habit: { type: String, required: true },
  trigger: { type: String, default: '' },
  progress: { type: String, default: '' },
  date: { type: String, default: () => new Date().toLocaleDateString() },
}, { timestamps: true });

export default mongoose.model('AddictionEntry', AddictionEntrySchema);
