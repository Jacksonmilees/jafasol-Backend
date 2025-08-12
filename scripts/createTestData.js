const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import models (adjust paths as needed)
const User = require('../models/User');
const Teacher = require('../models/Teacher');
const SchoolClass = require('../models/SchoolClass');
const Subject = require('../models/Subject');
const SchoolDay = require('../models/SchoolDay');
const TimetableConstraint = require('../models/TimetableConstraint');

async function createTestData() {
    console.log('🏗️ Creating comprehensive test data for Jafasol Timetabling System...\n');

    try {
        // Clear existing data
        console.log('🧹 Clearing existing test data...');
        await User.deleteMany({ email: { $regex: /test.*@jesus\.jafasol\.com/ } });
        await Teacher.deleteMany({ email: { $regex: /test.*@jesus\.jafasol\.com/ } });
        await Subject.deleteMany({ name: { $regex: /Test/ } });
        await SchoolClass.deleteMany({ name: { $regex: /Test/ } });
        await SchoolDay.deleteMany({ academicYear: '2024-2025' });
        await TimetableConstraint.deleteMany({ academicYear: '2024-2025' });

        // 1. GET EXISTING ROLES
        console.log('🔑 Getting existing roles...');
        const Role = require('../models/Role');
        const adminRole = await Role.findOne({ name: 'Admin' });
        if (!adminRole) {
            throw new Error('Admin role not found. Please ensure roles are created first.');
        }
        console.log(`✅ Found Admin role: ${adminRole._id}`);

        // 2. CREATE TEST USERS & TEACHERS
        console.log('👥 Creating test users and teachers...');
        
        const hashedPassword = await bcrypt.hash('test123', 10);
        
        const testTeachers = [
            // Class Teachers
            {
                user: {
                    name: 'Sister Mary Catherine',
                    email: 'test.mary@jesus.jafasol.com',
                    password: hashedPassword,
                    roleId: adminRole._id
                },
                teacher: {
                    firstName: 'Mary',
                    lastName: 'Catherine',
                    email: 'test.mary@jesus.jafasol.com',
                    phoneNumber: '+1234567001',
                    subjects: ['Mathematics', 'Religious Studies'],
                    isClassTeacher: true,
                    isSubjectTeacher: true,
                    status: 'Active'
                }
            },
            {
                user: {
                    name: 'Brother John Paul',
                    email: 'test.john@jesus.jafasol.com',
                    password: hashedPassword,
                    roleId: adminRole._id
                },
                teacher: {
                    firstName: 'John',
                    lastName: 'Paul',
                    email: 'test.john@jesus.jafasol.com',
                    phoneNumber: '+1234567002',
                    subjects: ['English', 'Literature'],
                    isClassTeacher: true,
                    isSubjectTeacher: true,
                    status: 'Active'
                }
            },
            // Subject Teachers
            {
                user: {
                    name: 'Dr. Grace Emmanuel',
                    email: 'test.grace@jesus.jafasol.com',
                    password: hashedPassword,
                    roleId: adminRole._id
                },
                teacher: {
                    firstName: 'Grace',
                    lastName: 'Emmanuel',
                    email: 'test.grace@jesus.jafasol.com',
                    phoneNumber: '+1234567003',
                    subjects: ['Chemistry', 'Biology'],
                    isClassTeacher: false,
                    isSubjectTeacher: true,
                    status: 'Active'
                }
            },
            {
                user: {
                    name: 'Father Michael Joseph',
                    email: 'test.michael@jesus.jafasol.com',
                    password: hashedPassword,
                    roleId: adminRole._id
                },
                teacher: {
                    firstName: 'Michael',
                    lastName: 'Joseph',
                    email: 'test.michael@jesus.jafasol.com',
                    phoneNumber: '+1234567004',
                    subjects: ['History', 'Religious Studies'],
                    isClassTeacher: false,
                    isSubjectTeacher: true,
                    status: 'Active'
                }
            },
            {
                user: {
                    name: 'Mrs. Ruth David',
                    email: 'test.ruth@jesus.jafasol.com',
                    password: hashedPassword,
                    roleId: adminRole._id
                },
                teacher: {
                    firstName: 'Ruth',
                    lastName: 'David',
                    email: 'test.ruth@jesus.jafasol.com',
                    phoneNumber: '+1234567005',
                    subjects: ['French', 'Music'],
                    isClassTeacher: false,
                    isSubjectTeacher: true,
                    status: 'Active'
                }
            }
        ];

        const createdTeachers = [];
        for (const teacherData of testTeachers) {
            const user = await User.create(teacherData.user);
            const teacher = await Teacher.create({
                ...teacherData.teacher,
                userId: user._id
            });
            createdTeachers.push(teacher);
            console.log(`✅ Created teacher: ${teacher.firstName} ${teacher.lastName}`);
        }

        // 2. CREATE TEST SUBJECTS
        console.log('\n📚 Creating test subjects...');
        
        const testSubjects = [
            {
                name: 'Religious Studies',
                code: 'REL101',
                subjectCategory: 'Core',
                formLevels: ['Form 1', 'Form 2', 'Form 3', 'Form 4'],
                periodsPerWeek: 3,
                periodDuration: 40,
                difficultyLevel: 'Medium',
                requiresLab: false,
                canBeDoublePeriod: false,
                examDuration: 90,
                preferredTimeSlots: ['Morning (8:00-12:00)'],
                status: 'Active',
                description: 'Christian Religious Education and Biblical Studies'
            },
            {
                name: 'Mathematics',
                code: 'MATH101',
                subjectCategory: 'Core',
                formLevels: ['Form 1', 'Form 2', 'Form 3', 'Form 4'],
                periodsPerWeek: 5,
                periodDuration: 40,
                difficultyLevel: 'High',
                requiresLab: false,
                canBeDoublePeriod: true,
                examDuration: 120,
                preferredTimeSlots: ['Morning (8:00-12:00)', 'Mid-Morning (9:00-11:00)'],
                status: 'Active'
            },
            {
                name: 'English',
                code: 'ENG101',
                subjectCategory: 'Core',
                formLevels: ['Form 1', 'Form 2', 'Form 3', 'Form 4'],
                periodsPerWeek: 4,
                periodDuration: 40,
                difficultyLevel: 'Medium',
                requiresLab: false,
                canBeDoublePeriod: false,
                examDuration: 90,
                preferredTimeSlots: ['Morning (8:00-12:00)'],
                status: 'Active'
            },
            {
                name: 'Physics',
                code: 'PHY101',
                subjectCategory: 'Sciences',
                formLevels: ['Form 3', 'Form 4'],
                periodsPerWeek: 4,
                periodDuration: 40,
                difficultyLevel: 'High',
                requiresLab: true,
                canBeDoublePeriod: true,
                examDuration: 120,
                preferredTimeSlots: ['Morning (8:00-12:00)'],
                requiredEquipment: ['Laboratory', 'Projector'],
                status: 'Active'
            },
            {
                name: 'Chemistry',
                code: 'CHEM101',
                subjectCategory: 'Sciences',
                formLevels: ['Form 3', 'Form 4'],
                periodsPerWeek: 4,
                periodDuration: 40,
                difficultyLevel: 'High',
                requiresLab: true,
                canBeDoublePeriod: true,
                examDuration: 120,
                preferredTimeSlots: ['Morning (8:00-12:00)', 'Early Afternoon (12:00-14:00)'],
                requiredEquipment: ['Laboratory', 'Safety Equipment'],
                status: 'Active'
            },
            {
                name: 'Biology',
                code: 'BIO101',
                subjectCategory: 'Sciences',
                formLevels: ['Form 1', 'Form 2', 'Form 3', 'Form 4'],
                periodsPerWeek: 3,
                periodDuration: 40,
                difficultyLevel: 'Medium',
                requiresLab: true,
                canBeDoublePeriod: false,
                examDuration: 90,
                preferredTimeSlots: ['Morning (8:00-12:00)', 'Afternoon (12:00-16:00)'],
                requiredEquipment: ['Laboratory', 'Microscopes'],
                status: 'Active'
            },
            {
                name: 'History',
                code: 'HIST101',
                subjectCategory: 'Arts',
                formLevels: ['Form 1', 'Form 2', 'Form 3', 'Form 4'],
                periodsPerWeek: 3,
                periodDuration: 40,
                difficultyLevel: 'Low',
                requiresLab: false,
                canBeDoublePeriod: false,
                examDuration: 90,
                preferredTimeSlots: ['Afternoon (12:00-16:00)'],
                status: 'Active'
            },
            {
                name: 'Geography',
                code: 'GEO101',
                subjectCategory: 'Arts',
                formLevels: ['Form 1', 'Form 2', 'Form 3', 'Form 4'],
                periodsPerWeek: 3,
                periodDuration: 40,
                difficultyLevel: 'Low',
                requiresLab: false,
                canBeDoublePeriod: false,
                examDuration: 90,
                preferredTimeSlots: ['Afternoon (12:00-16:00)'],
                status: 'Active'
            },
            {
                name: 'French',
                code: 'FR101',
                subjectCategory: 'Languages',
                formLevels: ['Form 1', 'Form 2'],
                periodsPerWeek: 3,
                periodDuration: 40,
                difficultyLevel: 'Medium',
                requiresLab: false,
                canBeDoublePeriod: false,
                examDuration: 90,
                preferredTimeSlots: ['Morning (8:00-12:00)', 'Afternoon (12:00-16:00)'],
                requiredEquipment: ['Audio System'],
                status: 'Active'
            },
            {
                name: 'Physical Education',
                code: 'PE101',
                subjectCategory: 'Sports',
                formLevels: ['Form 1', 'Form 2', 'Form 3', 'Form 4'],
                periodsPerWeek: 2,
                periodDuration: 40,
                difficultyLevel: 'Low',
                requiresLab: false,
                canBeDoublePeriod: true,
                examDuration: 60,
                preferredTimeSlots: ['Afternoon (12:00-16:00)', 'Late Afternoon (14:00-16:00)'],
                requiredEquipment: ['Sports Equipment'],
                status: 'Active'
            },
            {
                name: 'Music',
                code: 'MUS101',
                subjectCategory: 'Arts',
                formLevels: ['Form 1', 'Form 2', 'Form 3', 'Form 4'],
                periodsPerWeek: 2,
                periodDuration: 40,
                difficultyLevel: 'Low',
                requiresLab: false,
                canBeDoublePeriod: false,
                examDuration: 60,
                preferredTimeSlots: ['Afternoon (12:00-16:00)'],
                requiredEquipment: ['Audio System', 'Musical Instruments'],
                status: 'Active',
                description: 'Music education including hymns and Christian songs'
            }
        ];

        const createdSubjects = [];
        for (const subjectData of testSubjects) {
            const subject = await Subject.create(subjectData);
            createdSubjects.push(subject);
            console.log(`✅ Created subject: ${subject.name} (${subject.code})`);
        }

        // 3. CREATE TEST CLASSES
        console.log('\n🏫 Creating test classes...');
        
        const testClasses = [
            {
                name: 'Form 1A',
                formLevel: 'Form 1',
                stream: 'A',
                capacity: 30,
                classTeacher: createdTeachers[0]._id, // Sarah Johnson
                status: 'Active'
            },
            {
                name: 'Form 1B',
                formLevel: 'Form 1',
                stream: 'B',
                capacity: 28,
                classTeacher: createdTeachers[1]._id, // Michael Chen
                status: 'Active'
            },
            {
                name: 'Form 2A',
                formLevel: 'Form 2',
                stream: 'A',
                capacity: 32,
                status: 'Active'
            },
            {
                name: 'Form 3A',
                formLevel: 'Form 3',
                stream: 'A',
                capacity: 35,
                status: 'Active'
            },
            {
                name: 'Form 4A',
                formLevel: 'Form 4',
                stream: 'A',
                capacity: 28,
                status: 'Active'
            }
        ];

        const createdClasses = [];
        for (const classData of testClasses) {
            const schoolClass = await SchoolClass.create(classData);
            createdClasses.push(schoolClass);
            console.log(`✅ Created class: ${schoolClass.name}`);
        }

        // 4. CREATE SCHOOL DAY STRUCTURE
        console.log('\n⏰ Creating school day structure...');
        
        const schoolDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        const periods = [
            { name: 'Period 1', startTime: '08:00', endTime: '08:40', duration: 40, type: 'Teaching' },
            { name: 'Period 2', startTime: '08:40', endTime: '09:20', duration: 40, type: 'Teaching' },
            { name: 'Break', startTime: '09:20', endTime: '09:40', duration: 20, type: 'Break' },
            { name: 'Period 3', startTime: '09:40', endTime: '10:20', duration: 40, type: 'Teaching' },
            { name: 'Period 4', startTime: '10:20', endTime: '11:00', duration: 40, type: 'Teaching' },
            { name: 'Period 5', startTime: '11:00', endTime: '11:40', duration: 40, type: 'Teaching' },
            { name: 'Lunch', startTime: '11:40', endTime: '12:40', duration: 60, type: 'Lunch' },
            { name: 'Period 6', startTime: '12:40', endTime: '13:20', duration: 40, type: 'Teaching' },
            { name: 'Period 7', startTime: '13:20', endTime: '14:00', duration: 40, type: 'Teaching' },
            { name: 'Period 8', startTime: '14:00', endTime: '14:40', duration: 40, type: 'Teaching' }
        ];

        for (const day of schoolDays) {
            const schoolDay = await SchoolDay.create({
                day,
                periods,
                isActive: true,
                academicYear: '2024-2025',
                term: 'Term 1'
            });
            console.log(`✅ Created school day: ${day}`);
        }

        // 5. CREATE SAMPLE CONSTRAINTS
        console.log('\n🔒 Creating sample timetable constraints...');
        
        const sampleConstraints = [
            {
                name: 'No Double Difficult Subjects',
                type: 'NoConsecutiveDifficult',
                description: 'Avoid scheduling two difficult subjects consecutively',
                severity: 'Soft',
                weight: 8,
                isActive: true,
                academicYear: '2024-2025',
                term: 'Term 1'
            },
            {
                name: 'Physics Lab Constraint',
                type: 'LabRequired',
                description: 'Physics double periods must be in laboratory',
                severity: 'Hard',
                weight: 10,
                isActive: true,
                academicYear: '2024-2025',
                term: 'Term 1',
                params: {
                    subjectId: createdSubjects.find(s => s.name === 'Physics')?._id,
                    equipment: ['Laboratory']
                }
            },
            {
                name: 'Morning Math Preference',
                type: 'PreferredTimeSlot',
                description: 'Mathematics should be scheduled in morning periods',
                severity: 'Soft',
                weight: 7,
                isActive: true,
                academicYear: '2024-2025',
                term: 'Term 1',
                params: {
                    subjectId: createdSubjects.find(s => s.name === 'Mathematics')?._id,
                    preferredPeriods: ['Period 1', 'Period 2', 'Period 3', 'Period 4', 'Period 5']
                }
            }
        ];

        for (const constraintData of sampleConstraints) {
            const constraint = await TimetableConstraint.create(constraintData);
            console.log(`✅ Created constraint: ${constraint.name}`);
        }

        console.log('\n🎉 Test data creation completed successfully!\n');
        
        // Print summary
        console.log('📊 SUMMARY:');
        console.log(`👥 Teachers: ${createdTeachers.length}`);
        console.log(`📚 Subjects: ${createdSubjects.length}`);
        console.log(`🏫 Classes: ${createdClasses.length}`);
        console.log(`📅 School Days: ${schoolDays.length}`);
        console.log(`🔒 Constraints: ${sampleConstraints.length}`);
        
        console.log('\n🔑 TEST LOGIN CREDENTIALS for Jesus School:');
        console.log('✝️  Class Teacher: test.mary@jesus.jafasol.com (Sister Mary Catherine)');
        console.log('✝️  Class Teacher: test.john@jesus.jafasol.com (Brother John Paul)'); 
        console.log('👩‍🏫 Subject Teacher: test.grace@jesus.jafasol.com (Dr. Grace Emmanuel)');
        console.log('👨‍🏫 Subject Teacher: test.michael@jesus.jafasol.com (Father Michael Joseph)');
        console.log('🎵  Subject Teacher: test.ruth@jesus.jafasol.com (Mrs. Ruth David)');
        console.log('🔐 Password: test123');
        console.log('\n📍 Database: Local MongoDB Docker (127.0.0.1:27017/jafasol)');

    } catch (error) {
        console.error('❌ Error creating test data:', error);
        throw error;
    }
}

module.exports = { createTestData };

// Run if called directly
if (require.main === module) {
    // Local MongoDB connection (Docker container)
    const dbConnection = 'mongodb://127.0.0.1:27017/jafasol';
    
    // MongoDB connection options
    const mongoOptions = {
        useNewUrlParser: true,
        useUnifiedTopology: true
    };
    
    mongoose.connect(dbConnection, mongoOptions)
        .then(() => {
            console.log('🔗 Connected to local MongoDB (Docker)');
            console.log('🏫 Creating test data for Jesus school in Jafasol database...');
            return createTestData();
        })
        .then(() => {
            console.log('✅ Test data creation completed for Jesus school');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Error connecting to local MongoDB:', error);
            console.error('Please check:');
            console.error('1. Database server is running');
            console.error('2. Credentials are correct');
            console.error('3. Network connectivity');
            process.exit(1);
        });
}
