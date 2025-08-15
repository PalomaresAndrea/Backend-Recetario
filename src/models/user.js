// src/models/User.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true, maxlength: 80 },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  password: { type: String, required: true, minlength: 6, select: false },
  role:     { type: String, enum: ['user', 'admin'], default: 'user' },
  favorites:[{ type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' }],
  emailVerified: { type: Boolean, default: false },
  otpCodeHash:   { type: String, select: false },
  otpExpiresAt:  { type: Date,   select: false },
  otpAttempts:   { type: Number, default: 0, select: false },
  otpLastSentAt: { type: Date,   select: false },
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function(pwd) {
  return bcrypt.compare(pwd, this.password);
};

userSchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.password;
    delete ret.otpCodeHash;
    return ret;
  }
});

export default mongoose.models.User || mongoose.model('User', userSchema);
