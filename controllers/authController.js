import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sql } from '../config/db.js';

// Generates JWT access token and attaches it to response as HTTP-only Cookie
export const sendTokenResponse = (res, userId, statusCode = 200, extraData = {}) => {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });

  const isProd = process.env.NODE_ENV === 'Prod';

  res.cookie('token', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });

  res.status(statusCode).json({ token, ...extraData });
};

// POST /api/auth/register
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name?.trim() || !email?.trim() || !password?.trim()) {
      return res.status(400).json({
        error: 'Name, email, and password are required',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const [existing] = await sql`SELECT id FROM users WHERE email = ${normalizedEmail}`;

    if (existing) {
      return res.status(400).json({ error: 'User with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const storageLimit = Number(process.env.MAX_STORAGE_PER_USER || 1073741824);

    const [user] = await sql`
      INSERT INTO users (name, email, password, storage_limit)
      VALUES (${name.trim()}, ${normalizedEmail}, ${hashedPassword}, ${storageLimit})
      RETURNING id, name, email, storage_used, storage_limit, created_at, updated_at`;

    return sendTokenResponse(res, user.id, 201, { user });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// POST /api/auth/login
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email?.trim() || !password?.trim()) {
      return res.status(400).json({
        error: 'Email and passwored are required',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const [user] =
      await sql`SELECT id, name, email, password, storage_used, storage_limit, created_at, updated_at FROM users WHERE email = ${normalizedEmail}`;

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    delete user.password;
    // user.password = undefined;

    return sendTokenResponse(res, user.id, 200, { user });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Logout user & clear cookies
// POST /api/auth/login
export const logoutUser = async (_req, res) => {
  try {
    const isProd = process.env.NODE_ENV === 'Prod';
    res.clearCookie('token', {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
    });

    res.status(200).json({ message: 'Logged out successfully' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Get current user profile & storage info
// GET /api/auth/me
export const getMe = async (req, res) => {
  try {
    // req.user is already loaded by protect middleware
    return res.status(200).json({ user: req.user });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
