const express = require('express');
const { body, validationResult, query } = require('express-validator');
const FeeStructure = require('../models/FeeStructure');
const FeeInvoice = require('../models/FeeInvoice');
const FeePayment = require('../models/FeePayment');
const Student = require('../models/Student');
const { requirePermission } = require('../middleware/auth');
const { createAuditLog } = require('../utils/auditLogger');
const { Op } = require('sequelize');

const router = express.Router();

// Get all fee structures
router.get('/structures', async (req, res) => {
  try {
    const feeStructures = await FeeStructure.findAll({
      order: [['formLevel', 'ASC'], ['type', 'ASC']]
    });

    res.json({
      feeStructures: feeStructures.map(structure => ({
        id: structure.id,
        formLevel: structure.formLevel,
        amount: structure.amount,
        type: structure.type,
        term: structure.term,
        dueDate: structure.dueDate,
        createdAt: structure.createdAt
      }))
    });

  } catch (error) {
    console.error('Get fee structures error:', error);
    res.status(500).json({
      error: 'Failed to fetch fee structures',
      message: 'An error occurred while fetching fee structures'
    });
  }
});

// Create fee structure
router.post('/structures', requirePermission('Fees', 'create'), async (req, res) => {
  try {
    const { formLevel, amount, type, term, dueDate } = req.body;

    const feeStructure = await FeeStructure.create({
      formLevel,
      amount,
      type,
      term,
      dueDate
    });

    res.status(201).json({
      message: 'Fee structure created successfully',
      feeStructure: {
        id: feeStructure.id,
        formLevel: feeStructure.formLevel,
        amount: feeStructure.amount,
        type: feeStructure.type,
        term: feeStructure.term,
        dueDate: feeStructure.dueDate,
        createdAt: feeStructure.createdAt
      }
    });

  } catch (error) {
    console.error('Create fee structure error:', error);
    res.status(500).json({
      error: 'Failed to create fee structure',
      message: 'An error occurred while creating fee structure'
    });
  }
});

// Get all fee invoices
router.get('/invoices', async (req, res) => {
  try {
    const invoices = await FeeInvoice.findAll({
      include: [{
        model: Student,
        as: 'student',
        attributes: ['firstName', 'lastName', 'admissionNumber']
      }],
      order: [['date', 'DESC']]
    });

    res.json({
      invoices: invoices.map(invoice => ({
        id: invoice.id,
        studentId: invoice.studentId,
        studentName: `${invoice.student.firstName} ${invoice.student.lastName}`,
        admissionNumber: invoice.student.admissionNumber,
        description: invoice.description,
        amount: invoice.amount,
        date: invoice.date
      }))
    });

  } catch (error) {
    console.error('Get fee invoices error:', error);
    res.status(500).json({
      error: 'Failed to fetch fee invoices',
      message: 'An error occurred while fetching fee invoices'
    });
  }
});

// Get all fee payments
router.get('/payments', async (req, res) => {
  try {
    const payments = await FeePayment.findAll({
      include: [{
        model: Student,
        as: 'student',
        attributes: ['firstName', 'lastName', 'admissionNumber']
      }],
      order: [['date', 'DESC']]
    });

    res.json({
      payments: payments.map(payment => ({
        id: payment.id,
        studentId: payment.studentId,
        studentName: `${payment.student.firstName} ${payment.student.lastName}`,
        admissionNumber: payment.student.admissionNumber,
        amount: payment.amount,
        date: payment.date,
        method: payment.method,
        reference: payment.reference,
        createdAt: payment.createdAt
      }))
    });

  } catch (error) {
    console.error('Get fee payments error:', error);
    res.status(500).json({
      error: 'Failed to fetch fee payments',
      message: 'An error occurred while fetching fee payments'
    });
  }
});

// Record payment
router.post('/payments', requirePermission('Fees', 'create'), async (req, res) => {
  try {
    const { studentId, amount, method, date, reference } = req.body;

    const payment = await FeePayment.create({
      studentId,
      amount,
      method,
      date,
      reference
    });

    res.status(201).json({
      message: 'Payment recorded successfully',
      payment: {
        id: payment.id,
        studentId: payment.studentId,
        amount: payment.amount,
        method: payment.method,
        date: payment.date,
        reference: payment.reference,
        createdAt: payment.createdAt
      }
    });

  } catch (error) {
    console.error('Record payment error:', error);
    res.status(500).json({
      error: 'Failed to record payment',
      message: 'An error occurred while recording payment'
    });
  }
});

// Get fee balance summary
router.get('/balance-summary', async (req, res) => {
  try {
    const students = await Student.findAll({
      where: { status: 'Active' },
      attributes: ['id', 'firstName', 'lastName', 'admissionNumber', 'formClass']
    });

    const summary = await Promise.all(students.map(async (student) => {
      const invoices = await FeeInvoice.findAll({
        where: { studentId: student.id },
        attributes: ['amount']
      });

      const payments = await FeePayment.findAll({
        where: { studentId: student.id },
        attributes: ['amount']
      });

      const totalInvoiced = invoices.reduce((sum, invoice) => sum + invoice.amount, 0);
      const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
      const balance = totalInvoiced - totalPaid;

      return {
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName}`,
        admissionNumber: student.admissionNumber,
        formClass: student.formClass,
        totalInvoiced,
        totalPaid,
        balance
      };
    }));

    const totalSummary = {
      totalStudents: summary.length,
      totalInvoiced: summary.reduce((sum, item) => sum + item.totalInvoiced, 0),
      totalPaid: summary.reduce((sum, item) => sum + item.totalPaid, 0),
      totalBalance: summary.reduce((sum, item) => sum + item.balance, 0)
    };

    res.json({
      summary,
      totalSummary
    });

  } catch (error) {
    console.error('Get fee balance summary error:', error);
    res.status(500).json({
      error: 'Failed to fetch fee balance summary',
      message: 'An error occurred while fetching fee balance summary'
    });
  }
});

module.exports = router; 