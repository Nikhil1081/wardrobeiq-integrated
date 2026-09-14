import { Request, Response, NextFunction } from 'express';
import { runStylistWorkflow } from '../agent/langgraphWorkflow.js';
import { sendSuccess } from '../utils/response.js';

export async function aiStylistHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { customerId, message, conversationId } = req.body;
    const response = await runStylistWorkflow(customerId, message, conversationId);
    return sendSuccess(res, response);
  } catch (err) {
    next(err);
  }
}

export async function aiStylistStreamHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { customerId, message, conversationId } = req.body;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const sendSse = (event: string, data: any) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    const response = await runStylistWorkflow(customerId, message, conversationId, (stepName) => {
      sendSse('step', { step: stepName });
    });

    sendSse('result', response);
    sendSse('done', { status: 'complete' });
    res.end();
  } catch (err) {
    next(err);
  }
}
