import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as fs from 'fs';
import * as path from 'path';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const results: Record<string, unknown> = {
    cwd: process.cwd(),
    dirname: __dirname,
  };

  // Check if dist folder exists
  const distPath = path.join(process.cwd(), 'dist');
  const distMcpPath = path.join(process.cwd(), 'dist', 'mcp', 'tools');

  results.distExists = fs.existsSync(distPath);
  results.distMcpToolsExists = fs.existsSync(distMcpPath);

  // Try to list files
  try {
    if (fs.existsSync(distPath)) {
      results.distContents = fs.readdirSync(distPath);
    }
  } catch (e) {
    results.distContentsError = e instanceof Error ? e.message : String(e);
  }

  // Try to import
  try {
    const { getAllTools } = await import('../dist/mcp/tools/index');
    const tools = getAllTools();
    results.toolsCount = tools.length;
    results.toolNames = tools.slice(0, 5).map((t: { name: string }) => t.name);
  } catch (e) {
    results.importError = e instanceof Error ? e.message : String(e);
    results.importStack = e instanceof Error ? e.stack : undefined;
  }

  return res.json(results);
}
