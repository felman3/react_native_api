import express, { Request, Response } from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import crypto from 'crypto'; // Gagamitin natin ito para sa MD5 kapalit ng bcrypt

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3000;

const myIP = '192.168.56.1';

//local database configuration
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'sample_db',
  waitForConnections: true,
  connectionLimit: 10,
});

// Helper function
const md5Hash = (text: string): string => {
  return crypto.createHash('md5').update(text).digest('hex');
};

app.get('/api/test', (req: Request, res: Response) => {
  res.json({
    status: "Buhay ang Node.js backend ko!",
    oras: new Date().toLocaleTimeString()
  });
});

// LOGIN API ENDPOINT
app.post('/api/login', async (req: Request, res: Response): Promise<any> => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const [rows]: any = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'No account found with this email.' });
    }

    const user = rows[0];

    // I-hash ang input password gamit ang MD5 at ikumpara sa nasa database
    const hashedInputPassword = md5Hash(password);

    if (hashedInputPassword !== user.password) {
      return res.status(401).json({ error: 'Incorrect password. Please try again.' });
    }

    return res.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email }
    });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

// REGISTER API ENDPOINT
app.post('/api/register', async (req: Request, res: Response): Promise<any> => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email and password are required.' });
  }

  try {
    // Huwag payagan ang duplicate na email
    const [existing]: any = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'This email is already registered.' });
    }

    // Gagamit na ng MD5 hashing dito
    const hashedPassword = md5Hash(password);

    await pool.query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, hashedPassword]);
    return res.status(201).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

// get all the user from the database
app.get('/api/users', async (req: Request, res: Response): Promise<any> => {
  try {
    // Kukunin lang ang id, name, at email ng mga users
    const [rows]: any = await pool.query('SELECT * FROM users');
    return res.json({ success: true, users: rows });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`API Server running at http://${myIP}:${PORT}`);
});
// app.listen(PORT, () => {
//   console.log(`API Server is successfully running on port ${PORT}`);
// });
