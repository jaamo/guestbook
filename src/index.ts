import express from 'express';
import cors from 'cors';
import { initDatabase } from './database';
import guestbookRoutes from './routes/guestbook';
import authRoutes from './routes/auth';

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database
await initDatabase();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Routes
app.use('/api/guestbook', guestbookRoutes);
app.use('/api/auth', authRoutes);

// Serve admin dashboard
app.get('/admin', (req, res) => {
  res.sendFile('admin.html', { root: './public' });
});

// Serve embeddable widget script
app.get('/widget.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile('widget.js', { root: './public' });
});

app.listen(PORT, () => {
  console.log(`Guestbook server running on http://localhost:${PORT}`);
});

