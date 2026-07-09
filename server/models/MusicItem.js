import mongoose from 'mongoose';

const MusicItemSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  provider: { type: String, required: true },
  title: { type: String, required: true },
  mood: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.model('MusicItem', MusicItemSchema);
