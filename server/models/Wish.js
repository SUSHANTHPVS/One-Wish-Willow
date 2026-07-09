import mongoose from 'mongoose';

const WishSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  progress: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model('Wish', WishSchema);
