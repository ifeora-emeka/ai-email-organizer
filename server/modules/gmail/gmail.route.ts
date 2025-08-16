
import { Router } from 'express';
import { GmailController } from './gmail.controller';
import { optionalAuth } from '../../middleware/auth.middleware';
import { validateBody } from '../../middleware/validation.middleware';

const router = Router();

router.get('/', optionalAuth, GmailController.getGmailAccounts);

router.post('/', optionalAuth, GmailController.connectGmailAccount);

router.get('/callback', optionalAuth, GmailController.connectGmailCallback);

// Polling routes
router.post('/:gmailAccountId/polling/start', optionalAuth, GmailController.startPolling);

router.post('/:gmailAccountId/polling/stop', optionalAuth, GmailController.stopPolling);

router.post('/:gmailAccountId/polling/manual', optionalAuth, GmailController.manualPoll);



export { router as gmailRouter };
