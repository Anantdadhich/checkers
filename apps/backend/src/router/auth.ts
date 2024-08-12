import { Request, Response, Router } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { v4 as uuidv4 } from 'uuid';
import { COOKIE_MAX_AGE } from '../consts';

const router = Router();

const CLIENT_URL = process.env.AUTH_REDIRECT_URL ?? 'http://localhost:5173/game/random';
const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

interface UserJwtClaims {
  userId: string;
  name: string;
  isGuest?: boolean;
}

interface UserDetails {
  id: string;
  token?: string;
  name: string;
  isGuest?: boolean;
}

router.post('/guest', async (req: Request, res: Response) => {
  const { name } = req.body;
  const guestUUID = `guest-${uuidv4()}`;

  try {
    const user = await db.user.create({
      data: {
        username: guestUUID,
        email: `${guestUUID}@checkers`,
        name: name || guestUUID,
        provider: 'EMAIL',
      },
    });

    const token = jwt.sign(
      { userId: user.id, name: user.name, isGuest: true },
      JWT_SECRET
    );

    const userDetails: UserDetails = {
      id: user.id,
      name: user.name!,
      token,
      isGuest: true,
    };

    res.cookie('guest', token, { maxAge: COOKIE_MAX_AGE, httpOnly: true, secure: process.env.NODE_ENV === 'production' });
    res.json(userDetails);
  } catch (error) {
    console.error('Error creating guest user:', error);
    res.status(500).json({ success: false, message: 'Failed to create guest user' });
  }
});

router.get('/refresh', async (req: Request, res: Response) => {
  if (req.user) {
    const user = req.user as UserDetails;

    try {
      const userDb = await db.user.findUnique({
        where: { id: user.id },
        select: { name: true },
      });

      if (!userDb) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const token = jwt.sign({ userId: user.id, name: userDb.name }, JWT_SECRET);
      res.json({ token, id: user.id, name: userDb.name });
    } catch (error) {
      console.error('Error refreshing token:', error);
      res.status(500).json({ success: false, message: 'Failed to refresh token' });
    }
  } else if (req.cookies?.guest) {
    try {
      const decoded = jwt.verify(req.cookies.guest, JWT_SECRET) as UserJwtClaims;
      const token = jwt.sign(
        { userId: decoded.userId, name: decoded.name, isGuest: true },
        JWT_SECRET
      );
      const user: UserDetails = {
        id: decoded.userId,
        name: decoded.name,
        token,
        isGuest: true,
      };
      res.cookie('guest', token, { maxAge: COOKIE_MAX_AGE, httpOnly: true, secure: process.env.NODE_ENV === 'production' });
      res.json(user);
    } catch (error) {
      console.error('Error verifying guest token:', error);
      res.status(401).json({ success: false, message: 'Invalid guest token' });
    }
  } else {
    res.status(401).json({ success: false, message: 'Unauthorized' });
  }
});

router.get('/login/failed', (req: Request, res: Response) => {
  res.status(401).json({ success: false, message: 'Authentication failed' });
});

router.get('/logout', (req: Request, res: Response) => {
  res.clearCookie('guest');
  req.logout((err) => {
    if (err) {
      console.error('Error logging out:', err);
      res.status(500).json({ success: false, message: 'Failed to log out' });
    } else {
      res.clearCookie('jwt');
      res.redirect('http://localhost:5173/');
    }
  });
});

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback',
  passport.authenticate('google', {
    successRedirect: CLIENT_URL,
    failureRedirect: '/login/failed',
  })
);

router.get('/github', passport.authenticate('github', { scope: ['read:user', 'user:email'] }));

router.get('/github/callback',
  passport.authenticate('github', {
    successRedirect: CLIENT_URL,
    failureRedirect: '/login/failed',
  })
);

export default router;