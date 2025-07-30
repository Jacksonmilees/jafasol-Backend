const User = require('./User');
const Role = require('./Role');
const Student = require('./Student');
const Teacher = require('./Teacher');
const SchoolClass = require('./SchoolClass');
const Subject = require('./Subject');
const Exam = require('./Exam');
const FeeStructure = require('./FeeStructure');
const FeeInvoice = require('./FeeInvoice');
const FeePayment = require('./FeePayment');
const AuditLog = require('./AuditLog');
const { AttendanceRecord } = require('./AttendanceRecord');
const { TimetableEntry } = require('./TimetableEntry');
const { Message } = require('./Message');
const { Book } = require('./Book');
const { BookIssue } = require('./BookIssue');
const { LearningResource } = require('./LearningResource');

// User - Role relationship
User.belongsTo(Role, { as: 'role', foreignKey: 'roleId' });
Role.hasMany(User, { foreignKey: 'roleId' });

// User - Student relationship (for guardians)
User.belongsTo(Student, { foreignKey: 'studentId' });
Student.hasMany(User, { foreignKey: 'studentId' });

// Student - FeeInvoice relationship
Student.hasMany(FeeInvoice, { foreignKey: 'studentId' });
FeeInvoice.belongsTo(Student, { foreignKey: 'studentId' });

// Student - FeePayment relationship
Student.hasMany(FeePayment, { foreignKey: 'studentId' });
FeePayment.belongsTo(Student, { foreignKey: 'studentId' });

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

// Book relationships
BookIssue.belongsTo(Book, { foreignKey: 'bookId' });
Book.hasMany(BookIssue, { foreignKey: 'bookId' });
BookIssue.belongsTo(Student, { foreignKey: 'studentId' });
Student.hasMany(BookIssue, { foreignKey: 'studentId' });
BookIssue.belongsTo(User, { as: 'issuedByUser', foreignKey: 'issuedBy' });
User.hasMany(BookIssue, { as: 'issuedBooks', foreignKey: 'issuedBy' });
BookIssue.belongsTo(User, { as: 'returnedToUser', foreignKey: 'returnedTo' });
User.hasMany(BookIssue, { as: 'returnedBooks', foreignKey: 'returnedTo' });

// LearningResource relationships
LearningResource.belongsTo(User, { as: 'uploader', foreignKey: 'uploadedBy' });
User.hasMany(LearningResource, { as: 'uploadedResources', foreignKey: 'uploadedBy' });

module.exports = {
  User,
  Role,
  Student,
  Teacher,
  SchoolClass,
  Subject,
  Exam,
  FeeStructure,
  FeeInvoice,
  FeePayment,
  AuditLog,
  AttendanceRecord,
  TimetableEntry,
  Message,
  Book,
  BookIssue,
  LearningResource
}; 