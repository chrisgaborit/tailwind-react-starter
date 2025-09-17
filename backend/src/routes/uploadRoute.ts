const express, { Request, Response } = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
// Since pptx-parser caused Cloud Run issues, we safely removed it
// And switched to a pure backend-safe solution

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({ storage });
const router = express.Router();

router.post('/', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const ext = path.extname(req.file.originalname).toLowerCase();
    let extractedText = '';

    if (ext === '.pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const parsed = await pdfParse(dataBuffer);
      extractedText = parsed.text;
    } else if (ext === '.docx') {
      const data = fs.readFileSync(filePath);
      const result = await mammoth.extractRawText({ buffer: data });
      extractedText = result.value;
    } else if (ext === '.pptx') {
      // TEMP: No pptx extraction implemented (safe for deployment)
      extractedText = 'PPTX parsing not implemented in current version.';
    } else {
      return res.status(400).json({ error: 'Unsupported file type' });
    }

    fs.unlinkSync(filePath);
    res.json({ content: extractedText });
  } catch (err) {
    console.error('File processing error:', err);
    res.status(500).json({ error: 'Failed to process file' });
  }
});

module.exports = router;
