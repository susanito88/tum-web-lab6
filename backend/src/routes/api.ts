import { Router, Request, Response } from 'express';
import { generateToken, getDefaultPermissions } from '../utils/jwt';
import { authenticateToken, authorize, authorizeRole } from '../middleware/auth';
import { WordService } from '../services/wordService';
import { GameHistoryService } from '../services/gameHistoryService';
import { ApiResponse, PaginationParams } from '../types';

const router = Router();

// ============= TOKEN ENDPOINT =============
/**
 * @swagger
 * /token:
 *   post:
 *     summary: Generate JWT token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [ADMIN, WRITER, VISITOR]
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Token generated successfully
 *       400:
 *         description: Invalid role
 */
router.post('/token', (req: Request, res: Response) => {
  const { role, permissions } = req.body;

  if (!['ADMIN', 'WRITER', 'VISITOR'].includes(role)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid role. Must be ADMIN, WRITER, or VISITOR',
    });
  }

  const userId = `user_${Date.now()}`;
  const token = generateToken(userId, { role, permissions });

  res.json({
    success: true,
    data: {
      token,
      role,
      permissions: permissions || getDefaultPermissions(role),
      expiresIn: 60, // 1 minute
    },
  });
});

// ============= WORDS ENDPOINTS =============

/**
 * @swagger
 * /words:
 *   get:
 *     summary: Get all words with pagination
 *     tags: [Words]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: List of words
 *       401:
 *         description: Unauthorized
 */
router.get('/words', authenticateToken, authorize(['READ']), async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    const { words, total } = await WordService.getAllWords({ limit, offset });

    res.json({
      success: true,
      data: words,
      pagination: { limit, offset, total },
    } as ApiResponse<any>);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch words',
    });
  }
});

/**
 * @swagger
 * /words:
 *   post:
 *     summary: Create a new word
 *     tags: [Words]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - word
 *               - language
 *               - difficulty
 *             properties:
 *               word:
 *                 type: string
 *               language:
 *                 type: string
 *               difficulty:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Word created
 *       403:
 *         description: Forbidden
 */
router.post('/words', authenticateToken, authorize(['WRITE']), async (req: Request, res: Response) => {
  try {
    const { word, language, difficulty } = req.body;

    if (!word || !language || difficulty === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
    }

    const existingWord = await WordService.getWordByName(word);
    if (existingWord) {
      return res.status(409).json({
        success: false,
        error: 'Word already exists',
      });
    }

    const newWord = await WordService.createWord(word, language, difficulty);

    res.status(201).json({
      success: true,
      data: newWord,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create word',
    });
  }
});

/**
 * @swagger
 * /words/{id}:
 *   get:
 *     summary: Get a specific word
 *     tags: [Words]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Word found
 *       404:
 *         description: Word not found
 */
router.get('/words/:id', authenticateToken, authorize(['READ']), async (req: Request, res: Response) => {
  try {
    const word = await WordService.getWord(req.params.id);

    if (!word) {
      return res.status(404).json({
        success: false,
        error: 'Word not found',
      });
    }

    res.json({
      success: true,
      data: word,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch word',
    });
  }
});

/**
 * @swagger
 * /words/{id}:
 *   put:
 *     summary: Update a word
 *     tags: [Words]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Word updated
 *       404:
 *         description: Word not found
 */
router.put('/words/:id', authenticateToken, authorize(['WRITE']), async (req: Request, res: Response) => {
  try {
    const updatedWord = await WordService.updateWord(req.params.id, req.body);

    if (!updatedWord) {
      return res.status(404).json({
        success: false,
        error: 'Word not found',
      });
    }

    res.json({
      success: true,
      data: updatedWord,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update word',
    });
  }
});

/**
 * @swagger
 * /words/{id}:
 *   delete:
 *     summary: Delete a word
 *     tags: [Words]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Word deleted
 *       404:
 *         description: Word not found
 */
router.delete('/words/:id', authenticateToken, authorize(['DELETE']), async (req: Request, res: Response) => {
  try {
    const deleted = await WordService.deleteWord(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Word not found',
      });
    }

    res.status(204).send();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete word',
    });
  }
});

// ============= GAME HISTORY ENDPOINTS =============

/**
 * @swagger
 * /game-history:
 *   get:
 *     summary: Get game history with pagination
 *     tags: [GameHistory]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Game history records
 */
router.get('/game-history', authenticateToken, authorize(['READ']), async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    const { records, total } = await GameHistoryService.getAllGameRecords({ limit, offset });

    res.json({
      success: true,
      data: records,
      pagination: { limit, offset, total },
    } as ApiResponse<any>);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch game history',
    });
  }
});

/**
 * @swagger
 * /game-history:
 *   post:
 *     summary: Record a game
 *     tags: [GameHistory]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - word
 *               - guesses
 *               - won
 *               - difficulty
 *               - duration
 */
router.post('/game-history', authenticateToken, authorize(['WRITE']), async (req: Request, res: Response) => {
  try {
    const { word, guesses, won, difficulty, duration } = req.body;

    if (!word || !guesses || won === undefined || difficulty === undefined || duration === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
    }

    const record = await GameHistoryService.createGameRecord(word, guesses, won, difficulty, duration);

    res.status(201).json({
      success: true,
      data: record,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to record game',
    });
  }
});

/**
 * @swagger
 * /game-history/{id}:
 *   get:
 *     summary: Get a specific game record
 *     tags: [GameHistory]
 *     security:
 *       - BearerAuth: []
 */
router.get('/game-history/:id', authenticateToken, authorize(['READ']), async (req: Request, res: Response) => {
  try {
    const record = await GameHistoryService.getGameRecord(req.params.id);

    if (!record) {
      return res.status(404).json({
        success: false,
        error: 'Game record not found',
      });
    }

    res.json({
      success: true,
      data: record,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch game record',
    });
  }
});

/**
 * @swagger
 * /game-history/{id}:
 *   delete:
 *     summary: Delete a game record
 *     tags: [GameHistory]
 *     security:
 *       - BearerAuth: []
 */
router.delete('/game-history/:id', authenticateToken, authorize(['DELETE']), async (req: Request, res: Response) => {
  try {
    const deleted = await GameHistoryService.deleteGameRecord(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Game record not found',
      });
    }

    res.status(204).send();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete game record',
    });
  }
});

/**
 * @swagger
 * /statistics:
 *   get:
 *     summary: Get game statistics
 *     tags: [Statistics]
 *     security:
 *       - BearerAuth: []
 */
router.get('/statistics', authenticateToken, authorize(['READ']), async (req: Request, res: Response) => {
  try {
    const stats = await GameHistoryService.getStatistics();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
    });
  }
});

export default router;
