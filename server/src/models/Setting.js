const mongoose = require('mongoose');

/** Simple key/value store for app-wide settings (e.g. Google Calendar tokens). */
const settingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    value: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

settingSchema.statics.get = async function get(key, fallback = null) {
  const doc = await this.findOne({ key }).lean();
  return doc ? doc.value : fallback;
};

settingSchema.statics.set = function set(key, value) {
  return this.findOneAndUpdate({ key }, { value }, { upsert: true, new: true });
};

module.exports = mongoose.model('Setting', settingSchema);
