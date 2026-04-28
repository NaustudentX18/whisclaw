import { spawn } from 'child_process';
import * as fs from 'fs';
import dotenv from 'dotenv';
import { Message } from '../../type';
import { ChatWithLLMStreamFunction, SummaryTextWithLLMFunction } from '../interface';
import { systemPrompt } from '../../config/llm-config';

dotenv.config();

const whisclawBridgePath = process.env.WHISCLAW_BRIDGE_PATH || '/home/pi/whisclaw-bridge/whisclaw-ask.sh';
const whisclawTimeout = parseInt(process.env.WHISCLAW_TIMEOUT_MS || '45000');

const messages: Message[] = [];

const resetChatHistory = (): void => {
  messages.length = 0;
  messages.push({ role: 'system', content: systemPrompt });
};

const chatWithLLMStream: ChatWithLLMStreamFunction = async (
  inputMessages: Message[] = [],
  partialCallback: (partialAnswer: string) => void,
  endCallback: () => void,
  partialThinkingCallback?: (partialThinking: string) => void,
  invokeFunctionCallback?: (functionName: string, result?: string) => void,
): Promise<void> => {
  const lastUserMessage = [...inputMessages].reverse().find((msg) => msg.role === 'user');
  const userText = lastUserMessage?.content || '';

  if (!userText) {
    endCallback();
    return;
  }

  try {
    const bridgeScript = whisclawBridgePath;
    if (!fs.existsSync(bridgeScript)) {
      console.error('[WhisClaw] Bridge script not found:', bridgeScript);
      partialCallback('WhisClaw bridge not configured. Check whisclaw-logs.');
      endCallback();
      return;
    }

    const fullPrompt = `You are WhisClaw. Keep answers short. User: ${userText}`;

    const proc = spawn('bash', [bridgeScript, fullPrompt], {
      timeout: whisclawTimeout,
      shell: true
    });

    let output = '';
    let errorOutput = '';

    proc.stdout?.on('data', (data: Buffer) => {
      const text = data.toString();
      output += text;
      const lines = output.split('\n').filter(l => !l.startsWith('🦞') && l.trim());
      if (lines.length > 0) {
        partialCallback(lines.join(' ').trim());
      }
    });

    proc.stderr?.on('data', (data: Buffer) => {
      errorOutput += data.toString();
    });

    proc.on('close', (code) => {
      if (code === 0) {
        const cleanOutput = output.split('\n')
          .filter(l => !l.startsWith('🦞') && !l.includes('Error:'))
          .join(' ').trim();
        partialCallback(cleanOutput || 'WhisClaw processed your request.');
      } else {
        console.error('[WhisClaw] Bridge error:', errorOutput);
        partialCallback('Snapped a claw. PicoClaw call failed. Check whisclaw-logs.');
      }
      endCallback();
    });

    proc.on('error', (err) => {
      console.error('[WhisClaw] Process error:', err);
      partialCallback('Snapped a claw. PicoClaw failed to start.');
      endCallback();
    });

  } catch (err: any) {
    console.error('[WhisClaw] LLM error:', err);
    partialCallback('Snapped a claw. WhisClaw backend error.');
    endCallback();
  }
};

const summaryTextWithLLM: SummaryTextWithLLMFunction = async (text: string, _options?: any): Promise<string> => {
  return text.substring(0, 500);
};

export default { chatWithLLMStream, resetChatHistory, summaryTextWithLLM };