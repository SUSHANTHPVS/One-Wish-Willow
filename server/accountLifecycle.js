export const RECOVERY_PERIOD_MS = 7 * 24 * 60 * 60 * 1000;

export class AccountLifecycleError extends Error {
  constructor(message, status = 403) {
    super(message);
    this.status = status;
  }
}

export function createAccountLifecycle({ userModel, ownedModels, now = () => new Date() }) {
  async function deleteAccount(userId) {
    for (const { model, field } of ownedModels) {
      await model.deleteMany({ [field]: userId });
    }
    await userModel.deleteOne({ _id: userId, deletionInProgress: true });
  }

  async function deleteExpiredAccount(userId) {
    const user = await userModel.findOneAndUpdate({
      _id: userId,
      $or: [{ deletionDueAt: { $lte: now() } }, { deletionInProgress: true }],
    }, { $set: { deletionInProgress: true } }, { new: true });
    if (user) await deleteAccount(user._id);
  }

  async function deleteExpiredAccounts() {
    const users = await userModel.find({
      $or: [{ deletionDueAt: { $lte: now() } }, { deletionInProgress: true }],
    }).select('_id').limit(100).lean();
    const errors = [];
    for (const user of users) {
      try {
        await deleteExpiredAccount(user._id);
      } catch (error) {
        errors.push(error);
      }
    }
    if (errors.length) throw new AggregateError(errors, 'Some expired accounts could not be deleted.');
  }

  async function deleteImmediately(userId) {
    const user = await userModel.findOneAndUpdate({ _id: userId }, {
      $set: { deletionInProgress: true }, $inc: { sessionVersion: 1 },
    }, { new: true });
    if (!user) throw new AccountLifecycleError('User not found.', 404);
    await deleteAccount(user._id);
  }

  async function schedule(userId, action, confirmed) {
    if (!['delete', 'terminate'].includes(action) || confirmed !== true) {
      throw new AccountLifecycleError('Choose an account action and explicitly confirm it.', 400);
    }
    const requestedAt = now();
    const deletionDueAt = new Date(requestedAt.getTime() + RECOVERY_PERIOD_MS);
    const user = await userModel.findOneAndUpdate({
      _id: userId,
      deletionDueAt: null,
      deletionInProgress: { $ne: true },
    }, {
      $set: { deletionRequestedAt: requestedAt, deletionDueAt, deletionReason: action },
      $inc: { sessionVersion: 1 },
    }, { new: true });
    if (!user) throw new AccountLifecycleError('This account is unavailable or already scheduled for deletion.');
    return {
      deletionDueAt: deletionDueAt.toISOString(),
      message: `${action === 'terminate' ? 'Your account has been temporarily terminated.' : 'Your account deletion has been scheduled.'} Log in within 7 days, before ${deletionDueAt.toISOString()}, to cancel deletion and use your account normally. Otherwise, your account and server-side data will be permanently deleted. You have been signed out.`,
    };
  }

  async function login(userId) {
    const user = await userModel.findOneAndUpdate({
      _id: userId,
      deletionInProgress: { $ne: true },
      $or: [{ deletionDueAt: null }, { deletionDueAt: { $gt: now() } }],
    }, {
      $set: { deletionRequestedAt: null, deletionDueAt: null, deletionReason: null, lastActive: now() },
    }, { new: false });
    if (!user) {
      await deleteExpiredAccount(userId);
      throw new AccountLifecycleError('The 7-day recovery period has ended. This account can no longer be restored.', 410);
    }
    return { user, restored: Boolean(user.deletionDueAt) };
  }

  async function verifySession(payload) {
    if (!payload.id || payload.role === 'admin') {
      throw new AccountLifecycleError('A user account is required.', 401);
    }
    const user = await userModel.findById(payload.id);
    if (!user || user.deletionDueAt || user.deletionInProgress ||
        (payload.sessionVersion || 0) !== (user.sessionVersion || 0)) {
      throw new AccountLifecycleError('Your session has ended. Please sign in again.', 401);
    }
  }

  return { schedule, login, verifySession, deleteExpiredAccounts, deleteExpiredAccount, deleteImmediately };
}
