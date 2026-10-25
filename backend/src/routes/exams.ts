/**
 * @file exams.ts
 * @description Defines routes for managing and taking exams.
 * Split between user-facing retrieval and admin-facing CRUD operations.
 */

import { Router } from 'express';
import {
  getExams,
  getExam,
  createExam,
  updateExam,
  deleteExam,
  getAllExamsAdmin
} from '../controllers/examController';
import { authenticate, requireAdmin } from '../middleware/auth';
import { approveRetake } from '../controllers/attemptController';
import { upload } from '../utils/upload';
import { createClient } from '@supabase/supabase-js';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

/**
 * User Routes
 * -----------
 * Accessible to any authenticated user.
 */

// List all active exams available to take
router.get('/', authenticate, asyncHandler(getExams as any));

// Get structure and questions for a specific exam
router.get('/:id', authenticate, asyncHandler(getExam as any));

/**
 * Admin Routes
 * ------------
 * Require both authentication and administrative privileges.
 */

// List all exams (including inactive ones) with counts and stats
router.get('/admin/all', authenticate, requireAdmin, asyncHandler(getAllExamsAdmin as any));

// Create a new exam from scratch
router.post('/', authenticate, requireAdmin, asyncHandler(createExam as any));

// Update details for an existing exam
router.put('/:id', authenticate, requireAdmin, asyncHandler(updateExam as any));

// Permanently remove an exam from the system
router.delete('/:id', authenticate, requireAdmin, asyncHandler(deleteExam as any));

// Approve retake for a user
router.post('/approve-retake', authenticate, requireAdmin, asyncHandler(approveRetake as any));


// Parse the generic Supabase URL from the S3 string provided in .env
const rawSupabaseUrl = process.env.SUPABASE_URL || '';
const projectUrl = rawSupabaseUrl.includes('.storage.supabase.co') 
  ? rawSupabaseUrl.split('.storage.supabase.co')[0] + '.supabase.co' 
  : rawSupabaseUrl;
const supabase = createClient(projectUrl, process.env.SUPABASE_ANON_KEY || '');

router.post('/upload-image', authenticate, requireAdmin, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    // Create a unique file name
    const fileName = `${Date.now()}-${req.file.originalname.replace(/[^a-zA-Z0-9.]/g, '')}`;
    
    // Upload the file memory buffer to Supabase
    let uploadRes = await supabase.storage.from('exams').upload(fileName, req.file.buffer, {
      contentType: req.file.mimetype,
      upsert: false
    });
    
    if (uploadRes.error && uploadRes.error.message.includes('Bucket not found')) {
      await supabase.storage.createBucket('exams', { public: true });
      uploadRes = await supabase.storage.from('exams').upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false
      });
    }

    if (uploadRes.error) {
      throw uploadRes.error;
    }
    
    // Generate the public URL
    const { data: { publicUrl } } = supabase.storage.from('exams').getPublicUrl(fileName);
    
    res.json({ url: publicUrl });
  } catch (err: any) {
    res.status(500).json({ error: 'Upload failed', details: err.message });
  }
});

/**
 * Update a question's reference image.
 * Used by the admin edit page to replace or set images on existing questions.
 */
router.patch('/questions/:questionId/image', authenticate, requireAdmin, async (req, res) => {
  try {
    const { questionId } = req.params;
    const { imageUrl } = req.body;

    const { prisma } = await import('../utils/prisma');

    const question = await prisma.question.update({
      where: { id: questionId },
      data: { image: imageUrl },
    });

    res.json({ message: 'Question image updated', question });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update question image', details: err.message });
  }
});

export default router;

