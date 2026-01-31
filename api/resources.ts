import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAllResources } from '../dist/mcp/resources/index';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const resources = getAllResources();
  return res.json({ resources });
}
