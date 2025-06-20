"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const generateRoute_1 = __importDefault(require("./routes/generateRoute"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 8080;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '5mb' }));
// Routes
app.use('/api/v1/generate-storyboard', generateRoute_1.default);
// Health Check
app.get('/', (req, res) => {
    res.send('eLearning Storyboard Generator API is running.');
});
// Global error handler
app.use((err, req, res, next) => {
    console.error('[API] Unhandled error:', err.stack);
    res.status(500).json({ error: 'Something broke unexpectedly!' });
});
// Start server
app.listen(port, () => {
    console.log(`Backend server is running on http://localhost:${port}`);
    if (!process.env.API_KEY) {
        console.warn('[WARN] API_KEY is not set. Backend Gemini calls will fail if used.');
    }
});
