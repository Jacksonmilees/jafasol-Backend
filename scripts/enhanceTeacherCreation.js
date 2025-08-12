const mongoose = require('mongoose');

// Enhanced Teacher Creation Features
const enhanceTeacherCreation = {
    // Generate unique teacher ID with year prefix
    generateTeacherId: () => {
        const prefix = 'TCH';
        const year = new Date().getFullYear().toString().slice(-2);
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `${prefix}${year}${random}`;
    },

    // Enhanced validation for teacher data
    validateTeacherData: (teacherData) => {
        const errors = [];

        // Required fields validation
        if (!teacherData.firstName?.trim()) errors.push('First name is required');
        if (!teacherData.lastName?.trim()) errors.push('Last name is required');
        if (!teacherData.email?.trim()) errors.push('Email is required');
        if (!teacherData.phone?.trim()) errors.push('Phone number is required');
        if (!teacherData.dateOfBirth) errors.push('Date of birth is required');
        if (!teacherData.qualification?.trim()) errors.push('Qualification is required');
        if (!teacherData.experience) errors.push('Experience is required');
        if (!teacherData.address?.trim()) errors.push('Address is required');

        // Email format validation
        if (teacherData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(teacherData.email)) {
            errors.push('Invalid email format');
        }

        // Age validation (must be at least 21 years old)
        if (teacherData.dateOfBirth) {
            const age = calculateAge(teacherData.dateOfBirth);
            if (age < 21) errors.push('Teacher must be at least 21 years old');
            if (age > 70) errors.push('Teacher age seems unrealistic');
        }

        // Experience validation
        if (teacherData.experience && (teacherData.experience < 0 || teacherData.experience > 50)) {
            errors.push('Experience must be between 0 and 50 years');
        }

        // Role validation
        if (!teacherData.isClassTeacher && !teacherData.isSubjectTeacher) {
            errors.push('Teacher must have at least one role (Class Teacher or Subject Teacher)');
        }

        // Class teacher validation
        if (teacherData.isClassTeacher && !teacherData.assignedClass) {
            errors.push('Class teacher must be assigned to a class');
        }

        // Subject teacher validation
        if (teacherData.isSubjectTeacher && (!teacherData.subjects || teacherData.subjects.length === 0)) {
            errors.push('Subject teacher must be assigned at least one subject');
        }

        return errors;
    },

    // Calculate age from date of birth
    calculateAge: (birthDate) => {
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    },

    // Enhanced teacher data preparation
    prepareTeacherData: (rawData) => {
        return {
            teacherId: rawData.teacherId || enhanceTeacherCreation.generateTeacherId(),
            firstName: rawData.firstName?.trim(),
            lastName: rawData.lastName?.trim(),
            email: rawData.email?.trim().toLowerCase(),
            phone: rawData.phone?.trim(),
            dateOfBirth: new Date(rawData.dateOfBirth),
            gender: rawData.gender,
            qualification: rawData.qualification?.trim(),
            experience: parseInt(rawData.experience),
            address: rawData.address?.trim(),
            specialization: rawData.specialization?.trim() || undefined,
            emergencyContact: rawData.emergencyContact?.trim() || undefined,
            isClassTeacher: rawData.isClassTeacher || false,
            assignedClass: rawData.isClassTeacher ? rawData.assignedClass : undefined,
            isSubjectTeacher: rawData.isSubjectTeacher || false,
            subjects: rawData.isSubjectTeacher ? (rawData.subjects || []) : [],
            classes: rawData.isSubjectTeacher ? (rawData.classes || []) : [],
            status: 'Active',
            hireDate: new Date()
        };
    },

    // Create both User and Teacher records
    createTeacherWithUser: async (teacherData, User, Teacher, Role) => {
        try {
            // Find or create Teacher role
            let teacherRole = await Role.findOne({ name: 'Teacher' });
            if (!teacherRole) {
                teacherRole = new Role({
                    name: 'Teacher',
                    description: 'School Teacher',
                    permissions: {
                        Dashboard: ['view'],
                        Students: ['view'],
                        Attendance: ['view', 'create', 'edit'],
                        Timetable: ['view'],
                        Exams: ['view', 'create', 'edit'],
                        Communication: ['view', 'create'],
                        Library: ['view'],
                        'Learning Resources': ['view', 'create', 'edit'],
                        Reports: ['view']
                    }
                });
                await teacherRole.save();
            }

            // Generate teacher password
            const teacherPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4);

            // Create teacher user
            const teacherUser = new User({
                name: `${teacherData.firstName} ${teacherData.lastName}`,
                email: teacherData.email,
                password: teacherPassword, // Note: This should be hashed in production
                roleId: teacherRole._id,
                status: 'Active'
            });

            await teacherUser.save();

            // Create teacher record
            const teacher = new Teacher({
                ...teacherData,
                userId: teacherUser._id
            });

            await teacher.save();

            return {
                teacher,
                user: teacherUser,
                credentials: {
                    username: teacherData.email,
                    password: teacherPassword
                }
            };
        } catch (error) {
            throw error;
        }
    }
};

// Helper function for age calculation
function calculateAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
}

module.exports = enhanceTeacherCreation;



