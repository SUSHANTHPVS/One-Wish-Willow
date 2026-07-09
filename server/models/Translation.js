import mongoose from 'mongoose';

const TranslationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sourceLanguage: { type: String, default: 'English' },
  targetLanguage: { type: String, default: 'Hindi' },
  phrase: { type: String, default: '' },
  translation: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.model('Translation', TranslationSchema);
