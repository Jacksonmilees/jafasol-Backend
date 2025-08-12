const User = require('./User');
const Role = require('./Role');
const Student = require('./Student');
const Teacher = require('./Teacher');
const SchoolClass = require('./SchoolClass');
const Subject = require('./Subject');
const Exam = require('./Exam');
const AuditLog = require('./AuditLog');
const { AttendanceRecord } = require('./AttendanceRecord');
const { TimetableEntry } = require('./TimetableEntry');
const { Message } = require('./Message');
const { LearningResource } = require('./LearningResource');
const Vehicle = require('./Vehicle');
const Route = require('./Route');
const { Book } = require('./Book');
const { BookIssue } = require('./BookIssue');
const { FeeStructure } = require('./FeeStructure');
const { FeeInvoice } = require('./FeeInvoice');
const { FeePayment } = require('./FeePayment');

// User - Role relationship
User.belongsTo(Role, { as: 'role', foreignKey: 'roleId' });
Role.hasMany(User, { foreignKey: 'roleId' });

// User - Student relationship (for guardians)
User.belongsTo(Student, { foreignKey: 'studentId' });
Student.hasMany(User, { foreignKey: 'studentId' });

// SchoolClass - User relationship (class teacher)
SchoolClass.belongsTo(User, { as: 'classTeacher', foreignKey: 'classTeacherId' });
User.hasMany(SchoolClass, { as: 'classes', foreignKey: 'classTeacherId' });

// AuditLog - User relationship
AuditLog.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(AuditLog, { foreignKey: 'userId' });

// AttendanceRecord - Student relationship
AttendanceRecord.belongsTo(Student, { foreignKey: 'studentId' });
Student.hasMany(AttendanceRecord, { foreignKey: 'studentId' });

// AttendanceRecord - User relationship (recorded by)
AttendanceRecord.belongsTo(User, { as: 'recordedByUser', foreignKey: 'recordedBy' });
User.hasMany(AttendanceRecord, { as: 'attendanceRecords', foreignKey: 'recordedBy' });

// TimetableEntry relationships
TimetableEntry.belongsTo(SchoolClass, { foreignKey: 'classId' });
SchoolClass.hasMany(TimetableEntry, { foreignKey: 'classId' });
TimetableEntry.belongsTo(User, { as: 'teacher', foreignKey: 'teacherId' });
User.hasMany(TimetableEntry, { as: 'timetableEntries', foreignKey: 'teacherId' });

// Message relationships
Message.belongsTo(User, { as: 'sender', foreignKey: 'senderId' });
User.hasMany(Message, { as: 'sentMessages', foreignKey: 'senderId' });
Message.belongsTo(User, { as: 'recipient', foreignKey: 'recipientId' });
User.hasMany(Message, { as: 'receivedMessages', foreignKey: 'recipientId' });

// LearningResource relationships
LearningResource.belongsTo(User, { as: 'uploader', foreignKey: 'uploadedBy' });
User.hasMany(LearningResource, { as: 'uploadedResources', foreignKey: 'uploadedBy' });

// Transport relationships
Vehicle.belongsTo(Route, { foreignKey: 'route' });
Route.hasMany(Vehicle, { foreignKey: 'route' });

// Book relationships
BookIssue.belongsTo(Book, { foreignKey: 'bookId' });
Book.hasMany(BookIssue, { foreignKey: 'bookId' });
BookIssue.belongsTo(Student, { foreignKey: 'studentId' });
Student.hasMany(BookIssue, { foreignKey: 'studentId' });

// Fee relationships
FeeInvoice.belongsTo(Student, { foreignKey: 'studentId' });
Student.hasMany(FeeInvoice, { foreignKey: 'studentId' });
FeePayment.belongsTo(FeeInvoice, { foreignKey: 'invoiceId' });
FeeInvoice.hasMany(FeePayment, { foreignKey: 'invoiceId' });

module.exports = {
  User,
  Role,
  Student,
  Teacher,
  SchoolClass,
  Subject,
  Exam,
  AuditLog,
  AttendanceRecord,
  TimetableEntry,
  Message,
  LearningResource,
  Vehicle,
  Route,
  Book,
  BookIssue,
  FeeStructure,
  FeeInvoice,
  FeePayment
}; 