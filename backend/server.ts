import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// TODO: Add API routes
// - /retention/*
// - /admin/*

app.listen(PORT, () => {
  console.log(`RetentionOS Backend running on port ${PORT}`);
});

