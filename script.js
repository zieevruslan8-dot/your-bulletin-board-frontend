import express from 'express';
import Ad from '../models/Ad.js';

const router = express.Router();

// GET /api/ads - получить все объявления
router.get('/', async (req, res) => {
    try {
        const ads = await Ad.find().sort({ createdAt: -1 });
        res.json(ads);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/ads - создать объявление
router.post('/', async (req, res) => {
    try {
        const { title, description, price, imageUrl, contacts, authorId } = req.body;
        const ad = new Ad({ title, description, price, imageUrl, contacts, authorId });
        await ad.save();
        res.status(201).json(ad);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// DELETE /api/ads/:id - удалить объявление
router.delete('/:id', async (req, res) => {
    try {
        const ad = await Ad.findById(req.params.id);
        if (!ad) {
            return res.status(404).json({ message: 'Объявление не найдено' });
        }

        const authorId = req.headers['author-id'];
        if (ad.authorId !== authorId) {
            return res.status(403).json({ message: 'Недостаточно прав' });
        }

        await Ad.findByIdAndDelete(req.params.id);
        res.json({ message: 'Объявление удалено' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
