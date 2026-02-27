const cron = require('node-cron');
const { checkEscalations } = require('../services/escalationService');
const { recalculateAllPriorities } = require('../services/priorityService');

/**
 * Start all scheduled cron jobs.
 * - Every hour: check SLA escalations
 * - Every day at midnight: recalculate priority scores
 */
function startEscalationJob() {
  // Hourly escalation check — runs at minute 0 of every hour
  cron.schedule('0 * * * *', async () => {
    console.log(`[cron] Running escalation check at ${new Date().toISOString()}`);
    await checkEscalations();
  });

  // Daily priority recalculation — runs at midnight
  cron.schedule('0 0 * * *', async () => {
    console.log(`[cron] Running daily priority recalculation at ${new Date().toISOString()}`);
    await recalculateAllPriorities();
  });

  console.log('[cron] Escalation and priority jobs scheduled');
}

module.exports = { startEscalationJob };
