import express from 'express';
import { emptyTrash, getTrashItems } from '../controllers/trashController.js';
import { protect } from '../middleware/auth.js';

const trashRouter = express.Router();

trashRouter.use(protect);

trashRouter.get('/', getTrashItems);
trashRouter.post('/empty', emptyTrash);

export default trashRouter;
