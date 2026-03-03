import express from 'express';
import { getData, addData } from '../controllers/api.controller.js';

const router = express.Router();

router.route('/').get(getData).post(addData);

export default router;
