import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AccountLifecycleError } from './accountLifecycle.js';

export function createGoogleAuthHandler({ userModel, googleClient, clientId, jwtSecret, resolveAccountLogin }) {
  return async (req, res) => {
    if (!clientId) {
      return res.status(503).json({ message: 'Google sign-in is not configured on the server.' });
    }
    const { credential, termsAccepted } = req.body || {};
    if (typeof credential !== 'string' || !credential || credential.length > 20000) {
      return res.status(400).json({ message: 'A Google sign-in credential is required.' });
    }

    let profile;
    try {
      const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: clientId });
      profile = ticket.getPayload();
      if (!profile?.sub || !profile.email || profile.email_verified !== true) {
        return res.status(401).json({ message: 'A verified Google email address is required.' });
      }
    } catch {
      return res.status(401).json({ message: 'Google sign-in expired or could not be verified. Please try again.' });
    }

    try {
      const email = profile.email.trim().toLowerCase();
      let user = await userModel.findOne({ googleId: profile.sub });
      if (!user) {
        user = await userModel.findOne({ email }).collation({ locale: 'en', strength: 2 });
        if (user) {
          const googleOwnsEmail = email.endsWith('@gmail.com') || Boolean(profile.hd);
          if ((user.googleId && user.googleId !== profile.sub) || !googleOwnsEmail) {
            return res.status(409).json({ message: 'This email already has an account. Please sign in with your password.' });
          }
          user.googleId = profile.sub;
        } else {
          if (termsAccepted !== true) {
            return res.status(403).json({ message: 'To create your Google account, choose Register and accept the Terms and Conditions first.' });
          }
          const name = (profile.given_name || profile.name || email.split('@')[0])
            .replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 20) || 'willow';
          user = new userModel({
            username: `${name}_${randomBytes(6).toString('hex')}`,
            email,
            googleId: profile.sub,
            password: await bcrypt.hash(randomBytes(32).toString('hex'), 10),
          });
        }
      }
      user.lastActive = new Date();
      await user.save();
      const account = resolveAccountLogin ? await resolveAccountLogin(user._id) : { user, restored: false };
      user = account.user;
      const token = jwt.sign({
        id: user._id.toString(), username: user.username, sessionVersion: user.sessionVersion || 0,
      }, jwtSecret, { expiresIn: '7d' });
      return res.json({
        token,
        user: { username: user.username, email: user.email, bio: user.bio || '' },
        message: account.restored ? 'Welcome back! Account deletion has been cancelled. You can use your account normally.' : null,
      });
    } catch (error) {
      if (error instanceof AccountLifecycleError) return res.status(error.status).json({ message: error.message });
      if (error.code === 11000) {
        return res.status(409).json({ message: 'An account already exists. Please try signing in again.' });
      }
      console.error('Unable to complete Google sign-in', error);
      return res.status(500).json({ message: 'Unable to complete Google sign-in. Please try again.' });
    }
  };
}