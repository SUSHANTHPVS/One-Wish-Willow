import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  key: { type: String, required: true },
  kind: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  href: { type: String, required: true },
  readAt: { type: Date, default: null },
  dismissedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});

NotificationSchema.index({ user: 1, key: 1 }, { unique: true });
NotificationSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('Notification', NotificationSchema);