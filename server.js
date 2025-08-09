      Exam: schoolConnection.model('Exam', require('./models/Exam').schema),
      FeePayment: schoolConnection.model('FeePayment', require('./models/FeePayment').schema),
      FeeStructure: schoolConnection.model('FeeStructure', require('./models/FeeStructure').schema),
      FeeInvoice: schoolConnection.model('FeeInvoice', require('./models/FeeInvoice').schema),

// Exams endpoints
app.get('/api/exams', authenticateSchoolUser, async (req, res) => {
  try {
    const exams = await req.schoolModels.Exam?.find() || [];
    res.json({ message: 'Exams retrieved successfully', exams });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch exams' });
  }
});

// Fees endpoints
app.get('/api/fees/payments', authenticateSchoolUser, async (req, res) => {
  try {
    const payments = await req.schoolModels.FeePayment?.find() || [];
    res.json({ message: 'Fee payments retrieved successfully', payments });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch fee payments' });
  }
});

app.get('/api/fees/structures', authenticateSchoolUser, async (req, res) => {
  try {
    const feeStructures = await req.schoolModels.FeeStructure?.find() || [];
    res.json({ message: 'Fee structures retrieved successfully', feeStructures });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch fee structures' });
  }
});

app.get('/api/fees/invoices', authenticateSchoolUser, async (req, res) => {
  try {
    const invoices = await req.schoolModels.FeeInvoice?.find() || [];
    res.json({ message: 'Fee invoices retrieved successfully', invoices });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch fee invoices' });
  }
});