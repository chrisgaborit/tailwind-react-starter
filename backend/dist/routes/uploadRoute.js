"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const pdf_parse_1 = __importDefault(require("pdf-parse"));
const mammoth_1 = __importDefault(require("mammoth"));
// Since pptx-parser caused Cloud Run issues, we safely removed it
// And switched to a pure backend-safe solution
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path_1.default.join(__dirname, '../../uploads');
        if (!fs_1.default.existsSync(uploadPath)) {
            fs_1.default.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    },
});
const upload = (0, multer_1.default)({ storage });
const router = express_1.default.Router();
router.post('/', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        const filePath = req.file.path;
        const ext = path_1.default.extname(req.file.originalname).toLowerCase();
        let extractedText = '';
        if (ext === '.pdf') {
            const dataBuffer = fs_1.default.readFileSync(filePath);
            const parsed = await (0, pdf_parse_1.default)(dataBuffer);
            extractedText = parsed.text;
        }
        else if (ext === '.docx') {
            const data = fs_1.default.readFileSync(filePath);
            const result = await mammoth_1.default.extractRawText({ buffer: data });
            extractedText = result.value;
        }
        else if (ext === '.pptx') {
            // TEMP: No pptx extraction implemented (safe for deployment)
            extractedText = 'PPTX parsing not implemented in current version.';
        }
        else {
            return res.status(400).json({ error: 'Unsupported file type' });
        }
        fs_1.default.unlinkSync(filePath);
        res.json({ content: extractedText });
    }
    catch (err) {
        console.error('File processing error:', err);
        res.status(500).json({ error: 'Failed to process file' });
    }
});
exports.default = router;
