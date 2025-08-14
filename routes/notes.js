const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const fetchuser = require('../middleware/login');
const Notes = require('../models/Notes');

router.get('/fetchAllNotes', fetchuser, async (req, res) => {
    const allNotes = await Notes.find({ user: req.user.id });
    res.json(allNotes);
});

router.post('/createNote', fetchuser, [
    body('title', 'Title must be at least 3 characters').isLength({ min: 3 }),
    body('description', 'Description must be at least 5 characters').isLength({ min: 5 }),
    body('tag', 'Tag must be a string').optional().isString(),
], async (req, res) => {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const note = await Notes.create({
            title: req.body.title,
            description: req.body.description,
            tag: req.body.tag,
            user: req.user.id // From fetchuser middleware
        });

        res.json(note);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
});

router.put('/updatenote/:id', fetchuser, async (req, res) => {
    try {
        const { title, description, tag } = req.body;

        // Create a newNote object with only provided fields
        const newNote = {};
        if (title) newNote.title = title;
        if (description) newNote.description = description;
        if (tag) newNote.tag = tag;

        // Find the note to be updated
        let note = await Notes.findById(req.params.id);
        if (!note) {
            return res.status(404).json({ error: "Note not found" });
        }

        // Verify note ownership
        if (note.user.toString() !== req.user.id) {
            return res.status(401).json({ error: "Not authorized" });
        }

        // Update the note
        note = await Notes.findByIdAndUpdate(
            req.params.id,
            { $set: newNote },
            { new: true } // Return the updated document
        );

        res.json(note);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
});

router.delete('/deleteNote/:id', fetchuser, async (req, res) => {
   try {
        let note = await Notes.findById(req.params.id);
        if (!note) {
            return res.status(404).json({ error: "Note not found" });
        }

        if (note.user.toString() !== req.user.id) {
            return res.status(401).json({ error: "Not authorized" });
        }

        note = await Notes.findByIdAndDelete(req.params.id);
        res.json({ success: "Note has been deleted", note });

    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
});

module.exports = router;
