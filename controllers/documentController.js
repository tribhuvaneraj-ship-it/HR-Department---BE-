const Document = require('../models/Document');
const Employee = require('../models/Employee');
const path = require('path');
const fs = require('fs');

exports.uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a file' });
    }

    const { title, description, category, employeeId, isConfidential, tags } = req.body;

    const tempPath = req.file.path;
    const ext = path.extname(req.file.originalname);
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
    const uploadDir = category === 'contract' || category === 'offer-letter'
      ? path.join(__dirname, '../uploads/documents')
      : path.join(__dirname, '../uploads/documents');

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const newPath = path.join(uploadDir, fileName);
    fs.renameSync(tempPath, newPath);

    const document = await Document.create({
      employee: employeeId || undefined,
      uploadedBy: req.user._id,
      title,
      description,
      category,
      fileName,
      originalName: req.file.originalname,
      filePath: `/uploads/documents/${fileName}`,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      isConfidential: isConfidential === 'true',
      tags: tags ? tags.split(',').map(t => t.trim()) : []
    });

    res.status(201).json(document);
  } catch (error) {
    next(error);
  }
};

exports.getAllDocuments = async (req, res, next) => {
  try {
    const { category, employeeId, search, page = 1, limit = 10 } = req.query;

    const query = {};
    if (category) query.category = category;
    if (employeeId) query.employee = employeeId;

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await Document.countDocuments(query);
    const documents = await Document.find(query)
      .populate('uploadedBy', 'firstName lastName')
      .populate({
        path: 'employee',
        populate: { path: 'user', select: 'firstName lastName' }
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ documents, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
};

exports.getMyDocuments = async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) {
      return res.status(404).json({ error: 'Employee profile not found' });
    }

    const documents = await Document.find({
      $or: [
        { employee: employee._id },
        { isConfidential: false }
      ]
    })
      .populate('uploadedBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.json(documents);
  } catch (error) {
    next(error);
  }
};

exports.getDocument = async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate('uploadedBy', 'firstName lastName')
      .populate({
        path: 'employee',
        populate: { path: 'user', select: 'firstName lastName email' }
      });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json(document);
  } catch (error) {
    next(error);
  }
};

exports.downloadDocument = async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const filePath = path.join(__dirname, '..', document.filePath);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found on server' });
    }

    res.download(filePath, document.originalName);
  } catch (error) {
    next(error);
  }
};

exports.deleteDocument = async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const filePath = path.join(__dirname, '..', document.filePath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await Document.findByIdAndDelete(req.params.id);

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    next(error);
  }
};

exports.getDocumentStats = async (req, res, next) => {
  try {
    const stats = await Document.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 }, totalSize: { $sum: '$fileSize' } } },
      { $sort: { count: -1 } }
    ]);

    const total = await Document.countDocuments();
    const confidential = await Document.countDocuments({ isConfidential: true });

    res.json({ stats, total, confidential });
  } catch (error) {
    next(error);
  }
};
