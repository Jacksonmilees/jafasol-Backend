const Subject = require('../models/Subject');
const SchoolClass = require('../models/SchoolClass');
const Teacher = require('../models/Teacher');
const SchoolDay = require('../models/SchoolDay');
const Timetable = require('../models/Timetable');
const TimetableConstraint = require('../models/TimetableConstraint');

class TimetableGenerator {
  constructor(academicYear, term, schoolDb) {
    this.academicYear = academicYear;
    this.term = term;
    this.schoolDb = schoolDb;
    this.constraints = [];
    this.subjects = [];
    this.classes = [];
    this.teachers = [];
    this.schoolDays = [];
    this.conflicts = [];
  }

  async initialize() {
    // Load all necessary data
    await this.loadData();
    await this.loadConstraints();
  }

  async loadData() {
    try {
      this.subjects = await this.schoolDb.model('Subject').find({ status: 'Active' }).lean();
      this.classes = await this.schoolDb.model('SchoolClass').find({ status: 'Active' }).lean();
      this.teachers = await this.schoolDb.model('Teacher').find({ status: 'Active' }).lean();
      this.schoolDays = await this.schoolDb.model('SchoolDay').find({ 
        academicYear: this.academicYear, 
        term: this.term, 
        isActive: true 
      }).lean();
    } catch (error) {
      console.error('Error loading timetable data:', error);
      throw error;
    }
  }

  async loadConstraints() {
    try {
      this.constraints = await this.schoolDb.model('TimetableConstraint').find({
        academicYear: this.academicYear,
        term: this.term,
        isActive: true
      }).lean();
    } catch (error) {
      console.error('Error loading constraints:', error);
      throw error;
    }
  }

  async generateTeachingTimetable(options = {}) {
    const {
      optimizeFor = 'BalancedWorkload',
      allowBackToBackDifficult = false,
      maxPeriodsPerDayPerTeacher = 6,
      preferMorningForDifficult = true
    } = options;

    const timetable = new (this.schoolDb.model('Timetable'))({
      name: `Teaching Timetable - ${this.term} ${this.academicYear}`,
      academicYear: this.academicYear,
      term: this.term,
      type: 'Teaching',
      status: 'Draft',
      generatedBy: 'Auto',
      generationSettings: {
        optimizeFor,
        allowBackToBackDifficult,
        maxPeriodsPerDayPerTeacher,
        preferMorningForDifficult
      },
      slots: []
    });

    try {
      // Step 1: Create assignment requirements
      const requirements = this.createAssignmentRequirements();
      
      // Step 2: Generate time slots using constraint satisfaction
      const slots = await this.generateSlots(requirements, options);
      
      // Step 3: Optimize the timetable
      const optimizedSlots = this.optimizeTimetable(slots, options);
      
      timetable.slots = optimizedSlots;
      
      // Step 4: Detect and log conflicts
      const conflicts = timetable.detectConflicts();
      timetable.conflicts = conflicts;
      
      // Step 5: Calculate statistics
      await timetable.save();
      
      return timetable;
    } catch (error) {
      console.error('Error generating teaching timetable:', error);
      throw error;
    }
  }

  createAssignmentRequirements() {
    const requirements = [];
    
    for (const subject of this.subjects) {
      for (const classItem of this.classes) {
        // Check if subject applies to this class level
        if (subject.formLevels.includes(classItem.formLevel)) {
          // Find qualified teachers for this subject
          const qualifiedTeachers = this.teachers.filter(teacher => 
            teacher.assignedSubjects && 
            teacher.assignedSubjects.includes(subject._id.toString()) &&
            teacher.status === 'Active'
          );

          if (qualifiedTeachers.length > 0) {
            // Create assignment requirement
            for (let period = 0; period < subject.periodsPerWeek; period++) {
              requirements.push({
                id: `${subject._id}-${classItem._id}-${period}`,
                subjectId: subject._id,
                classId: classItem._id,
                teacherIds: qualifiedTeachers.map(t => t._id),
                duration: subject.periodDuration,
                difficulty: subject.difficultyLevel,
                requiresLab: subject.requiresLab,
                canBeDoublePeriod: subject.canBeDoublePeriod,
                preferredTimeSlots: subject.preferredTimeSlots || [],
                priority: this.calculatePriority(subject, classItem)
              });
            }
          }
        }
      }
    }

    return requirements.sort((a, b) => b.priority - a.priority);
  }

  calculatePriority(subject, classItem) {
    let priority = 5; // Base priority
    
    // Core subjects get higher priority
    if (subject.subjectCategory === 'Core' || subject.subjectCategory === 'Mathematics') {
      priority += 3;
    }
    
    // Difficult subjects get higher priority (to be scheduled first)
    if (subject.difficultyLevel === 'High') {
      priority += 2;
    } else if (subject.difficultyLevel === 'Medium') {
      priority += 1;
    }
    
    // Lab subjects get higher priority (limited resources)
    if (subject.requiresLab) {
      priority += 2;
    }
    
    return priority;
  }

  async generateSlots(requirements, options) {
    const slots = [];
    const teachingPeriods = this.getTeachingPeriods();
    
    for (const requirement of requirements) {
      const bestSlot = this.findBestSlot(requirement, slots, teachingPeriods, options);
      
      if (bestSlot) {
        // Select best teacher for this slot
        const teacher = this.selectBestTeacher(requirement, bestSlot, slots);
        
        if (teacher) {
          slots.push({
            classId: requirement.classId,
            subjectId: requirement.subjectId,
            teacherId: teacher._id,
            day: bestSlot.day,
            periodId: bestSlot.period._id || bestSlot.period.name,
            startTime: bestSlot.period.startTime,
            endTime: bestSlot.period.endTime,
            isDoublePeriod: requirement.canBeDoublePeriod && bestSlot.isDouble,
            notes: `Auto-generated: ${requirement.difficulty} difficulty`
          });
        }
      }
    }
    
    return slots;
  }

  getTeachingPeriods() {
    const periods = [];
    
    for (const day of this.schoolDays) {
      const teachingPeriods = day.periods.filter(p => p.type === 'Teaching');
      for (const period of teachingPeriods) {
        periods.push({
          day: day.day,
          period: period
        });
      }
    }
    
    return periods;
  }

  findBestSlot(requirement, existingSlots, availablePeriods, options) {
    const candidates = [];
    
    for (const periodSlot of availablePeriods) {
      const score = this.scoreSlot(requirement, periodSlot, existingSlots, options);
      
      if (score > 0) { // Only consider valid slots
        candidates.push({
          ...periodSlot,
          score,
          isDouble: false // For now, simple single periods
        });
      }
    }
    
    // Sort by score (highest first) and return best candidate
    candidates.sort((a, b) => b.score - a.score);
    return candidates[0] || null;
  }

  scoreSlot(requirement, periodSlot, existingSlots, options) {
    let score = 100; // Base score
    
    // Check hard constraints first
    if (this.violatesHardConstraints(requirement, periodSlot, existingSlots)) {
      return 0; // Invalid slot
    }
    
    // Prefer morning for difficult subjects
    if (options.preferMorningForDifficult && requirement.difficulty === 'High') {
      const periodHour = parseInt(periodSlot.period.startTime.split(':')[0]);
      if (periodHour < 12) {
        score += 20;
      } else {
        score -= 10;
      }
    }
    
    // Check preferred time slots
    if (requirement.preferredTimeSlots.length > 0) {
      const hasPreferred = requirement.preferredTimeSlots.some(pref => 
        pref.day === periodSlot.day && 
        this.isInPeriod(periodSlot.period.startTime, pref.period)
      );
      
      if (hasPreferred) {
        score += 15;
      } else {
        score -= 5;
      }
    }
    
    // Avoid back-to-back difficult subjects for same class
    if (!options.allowBackToBackDifficult && requirement.difficulty === 'High') {
      const adjacentDifficult = this.hasAdjacentDifficultSubject(
        requirement.classId, 
        periodSlot, 
        existingSlots
      );
      
      if (adjacentDifficult) {
        score -= 25;
      }
    }
    
    // Balance teacher workload
    const teacherLoad = this.getTeacherDailyLoad(
      requirement.teacherIds[0], 
      periodSlot.day, 
      existingSlots
    );
    
    if (teacherLoad >= options.maxPeriodsPerDayPerTeacher) {
      return 0; // Teacher overloaded
    } else if (teacherLoad > options.maxPeriodsPerDayPerTeacher * 0.75) {
      score -= 10;
    }
    
    return score;
  }

  violatesHardConstraints(requirement, periodSlot, existingSlots) {
    // Check if class is already scheduled at this time
    const classConflict = existingSlots.some(slot => 
      slot.classId.toString() === requirement.classId.toString() &&
      slot.day === periodSlot.day &&
      slot.startTime === periodSlot.period.startTime
    );
    
    if (classConflict) return true;
    
    // Check custom hard constraints
    const hardConstraints = this.constraints.filter(c => c.severity === 'Hard');
    for (const constraint of hardConstraints) {
      const violation = this.checkConstraintViolation(constraint, requirement, periodSlot, existingSlots);
      if (violation.violated) {
        return true;
      }
    }
    
    return false;
  }

  hasAdjacentDifficultSubject(classId, periodSlot, existingSlots) {
    // This would check adjacent time periods for difficult subjects
    // Implementation would look at previous and next periods
    return false; // Simplified for now
  }

  getTeacherDailyLoad(teacherId, day, existingSlots) {
    return existingSlots.filter(slot => 
      slot.teacherId.toString() === teacherId.toString() && 
      slot.day === day
    ).length;
  }

  selectBestTeacher(requirement, periodSlot, existingSlots) {
    const availableTeachers = this.teachers.filter(teacher => 
      requirement.teacherIds.some(id => id.toString() === teacher._id.toString())
    );
    
    let bestTeacher = null;
    let bestScore = -1;
    
    for (const teacher of availableTeachers) {
      // Check if teacher is available at this time
      const isAvailable = !existingSlots.some(slot => 
        slot.teacherId.toString() === teacher._id.toString() &&
        slot.day === periodSlot.day &&
        slot.startTime === periodSlot.period.startTime
      );
      
      if (isAvailable) {
        const score = this.scoreTeacher(teacher, requirement, periodSlot, existingSlots);
        if (score > bestScore) {
          bestScore = score;
          bestTeacher = teacher;
        }
      }
    }
    
    return bestTeacher;
  }

  scoreTeacher(teacher, requirement, periodSlot, existingSlots) {
    let score = 50; // Base score
    
    // Prefer teachers with fewer periods this day
    const dailyLoad = this.getTeacherDailyLoad(teacher._id, periodSlot.day, existingSlots);
    score -= dailyLoad * 5;
    
    // Prefer class teachers for their own classes
    if (teacher.assignedClass && teacher.assignedClass.toString() === requirement.classId.toString()) {
      score += 15;
    }
    
    return score;
  }

  optimizeTimetable(slots, options) {
    // Apply optimization algorithms
    // For now, return as-is, but this could include:
    // - Swapping slots to improve balance
    // - Consolidating double periods
    // - Minimizing teacher movement between rooms
    
    return slots;
  }

  async generateExamTimetable(baseTeachingTimetable, examSettings = {}) {
    const {
      examDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      maxExamsPerDay = 3,
      minTimeBetweenExams = 60, // minutes
      prioritizeCore = true
    } = examSettings;

    const examTimetable = new (this.schoolDb.model('Timetable'))({
      name: `Exam Timetable - ${this.term} ${this.academicYear}`,
      academicYear: this.academicYear,
      term: this.term,
      type: 'Exam',
      status: 'Draft',
      generatedBy: 'Auto',
      slots: []
    });

    try {
      // Get unique subjects from teaching timetable
      const examSubjects = this.getExamSubjects(baseTeachingTimetable);
      
      // Sort by priority (core subjects first)
      if (prioritizeCore) {
        examSubjects.sort((a, b) => {
          if (a.subjectCategory === 'Core' && b.subjectCategory !== 'Core') return -1;
          if (a.subjectCategory !== 'Core' && b.subjectCategory === 'Core') return 1;
          return 0;
        });
      }
      
      // Generate exam slots
      const examSlots = this.scheduleExams(examSubjects, examDays, examSettings);
      
      examTimetable.slots = examSlots;
      examTimetable.detectConflicts();
      
      await examTimetable.save();
      return examTimetable;
      
    } catch (error) {
      console.error('Error generating exam timetable:', error);
      throw error;
    }
  }

  getExamSubjects(teachingTimetable) {
    const subjectClassPairs = new Map();
    
    // Extract unique subject-class combinations
    for (const slot of teachingTimetable.slots) {
      const key = `${slot.subjectId}-${slot.classId}`;
      if (!subjectClassPairs.has(key)) {
        const subject = this.subjects.find(s => s._id.toString() === slot.subjectId.toString());
        const classItem = this.classes.find(c => c._id.toString() === slot.classId.toString());
        
        if (subject && classItem) {
          subjectClassPairs.set(key, {
            subjectId: slot.subjectId,
            classId: slot.classId,
            subject: subject,
            class: classItem,
            examDuration: subject.examDuration || 60
          });
        }
      }
    }
    
    return Array.from(subjectClassPairs.values());
  }

  scheduleExams(examSubjects, examDays, settings) {
    const slots = [];
    const examPeriods = this.getExamPeriods(examDays);
    
    for (const examSubject of examSubjects) {
      const bestPeriod = this.findBestExamSlot(examSubject, slots, examPeriods, settings);
      
      if (bestPeriod) {
        slots.push({
          classId: examSubject.classId,
          subjectId: examSubject.subjectId,
          teacherId: null, // Will be assigned later
          day: bestPeriod.day,
          periodId: bestPeriod.period._id || bestPeriod.period.name,
          startTime: bestPeriod.period.startTime,
          endTime: bestPeriod.period.endTime,
          isExam: true,
          examType: 'Final',
          notes: `Exam duration: ${examSubject.examDuration} minutes`
        });
      }
    }
    
    return slots;
  }

  getExamPeriods(examDays) {
    const periods = [];
    
    for (const day of this.schoolDays) {
      if (examDays.includes(day.day)) {
        // For exams, we can use longer periods or combine teaching periods
        const teachingPeriods = day.periods.filter(p => p.type === 'Teaching');
        for (const period of teachingPeriods) {
          periods.push({
            day: day.day,
            period: period
          });
        }
      }
    }
    
    return periods;
  }

  findBestExamSlot(examSubject, existingExams, availablePeriods, settings) {
    for (const periodSlot of availablePeriods) {
      // Check if this slot is already taken
      const conflict = existingExams.some(exam => 
        exam.day === periodSlot.day && 
        exam.startTime === periodSlot.period.startTime
      );
      
      if (!conflict) {
        // Check daily exam limit
        const dailyExams = existingExams.filter(exam => exam.day === periodSlot.day).length;
        if (dailyExams < settings.maxExamsPerDay) {
          return periodSlot;
        }
      }
    }
    
    return null;
  }

  isInPeriod(time, period) {
    const hour = parseInt(time.split(':')[0]);
    
    switch (period) {
      case 'Morning':
        return hour >= 8 && hour < 12;
      case 'Afternoon':
        return hour >= 12 && hour < 17;
      case 'Evening':
        return hour >= 17 && hour < 20;
      default:
        return false;
    }
  }

  checkConstraintViolation(constraint, requirement, periodSlot, existingSlots) {
    // Simplified constraint checking
    // In a real implementation, this would use the constraint model's methods
    return { violated: false, message: '' };
  }
}

module.exports = TimetableGenerator;



