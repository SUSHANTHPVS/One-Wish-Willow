import mongoose from 'mongoose';

const quoteSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
  author: String,
  category: String,
  favorites: [mongoose.Schema.Types.ObjectId],
});

export default mongoose.model('Quote', quoteSchema);
