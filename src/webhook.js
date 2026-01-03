const express = require('express');
const handlers = require('./handler/handlers');
const { initLogger } = require('./logger');
const app = express();
const logger = initLogger('./mblc.log');
const testDbConnection = require('./handler/upsertdb').testDbConnection;

//測試DB連線
testDbConnection();

//讓app可以解析json request body
app.use(express.json());

app.post('/webhook', async (req, res) => {
    const events = req.body?.events;
    logger.info('收到Events from IP:', req.ip);
    res.status(200).send('OK');
    if (!events || !Array.isArray(events)) {
        logger.error('Invalid request body');
        return res.status(200).send('Invalid request body');
    }
    for (const e of events) {
        if (e?.type !== 'message' || e.message.type !== 'text'){
            logger.error('unallow message type:',e.message.type)
            continue
        };
        logger.info('收到 Message vent');
        await handlers.handleEvent(e);
    }
});

app.listen(3000, () => {
    logger.info('Webhook server is running on port 3000');
});