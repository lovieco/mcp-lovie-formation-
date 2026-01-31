import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAllTools } from '../dist/mcp/tools/index';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const tools = getAllTools();
  return res.json({ tools });
}
