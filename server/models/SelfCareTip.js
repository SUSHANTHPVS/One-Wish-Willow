import mongoose from 'mongoose';

const selfCareTipSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: String,
  category: String,
  duration: String,
  icon: String,
});

export default mongoose.model('SelfCareTip', selfCareTipSchema);
