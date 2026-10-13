const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const addressSchema = new mongoose.Schema(
  {
    line1: { type: String, trim: true, maxlength: 160 },
    city: { type: String, trim: true, maxlength: 80 },
    district: { type: String, trim: true, maxlength: 80 },
    postalCode: { type: String, trim: true, maxlength: 20 },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 80 },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: { type: String, select: false, minlength: 8 },
    hasPassword: { type: Boolean, default: false },
    role: { type: String, enum: ['customer', 'admin'], default: 'customer', index: true },
    whatsapp: { type: String, trim: true, maxlength: 20 },
    companyName: { type: String, trim: true, maxlength: 120 },
    bio: { type: String, trim: true, maxlength: 500 },
    address: { type: addressSchema, default: () => ({}) },

    authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
    googleId: { type: String, index: true, sparse: true },
    googleAvatar: { type: String },
    avatar: { type: String, default: '' },

    isEmailVerified: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },

    emailVerifyToken: { type: String, select: false },
    emailVerifyExpires: { type: Date, select: false },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },

    // Incremented to invalidate all existing JWTs (password change, block, etc.)
    tokenVersion: { type: Number, default: 0 },
    lastLoginAt: Date,
  },
  { timestamps: true }
);

userSchema.index({ name: 'text', email: 'text' });

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.hasPassword = true;
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

userSchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.password;
    delete ret.emailVerifyToken;
    delete ret.emailVerifyExpires;
    delete ret.resetPasswordToken;
    delete ret.resetPasswordExpires;
    delete ret.tokenVersion;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);
