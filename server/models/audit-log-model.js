import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  userRole: {
    type: String,
    enum: ['BUYER', 'SELLER', 'VERIFICATION_OFFICER', 'MUNICIPAL_OFFICER', 'ADMIN', 'SYSTEM_ADMIN'],
    required: true
  },
  action: {
    type: String,
    required: true,
    index: true
  },
  actionCategory: {
    type: String,
    enum: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'VERIFY', 'OVERRIDE'],
    required: true
  },
  resourceType: {
    type: String,
    enum: ['LAND', 'USER', 'DOCUMENT', 'AUTHORITY_RECORD', 'AUDIT_LOG', 'SETTING'],
    required: true
  },
  resourceId: String,
  resourceName: String,
  changes: {
    before: mongoose.Schema.Types.Mixed,
    after: mongoose.Schema.Types.Mixed
  },
  reason: String,
  ipAddress: String,
  userAgent: String,
  status: {
    type: String,
    enum: ['SUCCESS', 'FAILED', 'PENDING'],
    default: 'SUCCESS'
  },
  errorMessage: String,
  metadata: mongoose.Schema.Types.Mixed,

  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
    expire: 90 * 24 * 60 * 60
  }
});

auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ resourceType: 1, resourceId: 1 });

auditLogSchema.statics.log = async function(logData) {
  try {
    const log = new this(logData);
    await log.save();
    return log;
  } catch (error) {
    console.error('Error creating audit log:', error);
  }
};

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
