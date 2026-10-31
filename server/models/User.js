import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  googleId: { type: String, unique: true, sparse: true },
  bio: { type: String, default: '' },
  profilePicture: { type: String, default: null },
  languagePreference: { type: String, default: 'English' },
  lastActive: { type: Date, default: null },
  sessionTime: { type: Number, default: 0 },
  sessionVersion: { type: Number, default: 0 },
  deletionRequestedAt: { type: Date, default: null },
  deletionDueAt: { type: Date, default: null, index: true },
  deletionReason: { type: String, enum: ['delete', 'terminate', null], default: null },
  deletionInProgress: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model('User', UserSchema);
