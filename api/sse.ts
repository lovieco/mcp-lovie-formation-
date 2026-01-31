import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAllTools, handleToolCall } from '../src/mcp/tools/index';
import { getAllResources, getResourceContent } from '../src/mcp/resources/index';
import { getSessionStore } from '../src/mcp/state/FormationSessionStore';

// SSE endpoint for MCP - supports both SSE (GET) and HTTP JSON-RPC (POST)
// Note: Vercel serverless has limitations with long-lived SSE connections
// For full SSE support, consider using Vercel Edge Functions or a persistent server

export const config = {
  maxDuration: 60, // Max 60 seconds for SSE in Vercel
};

// Initialize session store
const store = getSessionStore();

// MCP JSON-RPC types
interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Handle POST requests for JSON-RPC (HTTP transport)
  if (req.method === 'POST') {
    return handleJsonRpc(req, res);
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Send initial connection message
  const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Send endpoint info as first SSE message
  const endpointMessage = {
    jsonrpc: '2.0',
    method: 'endpoint',
    params: {
      uri: '/api/messages',
    },
  };

  res.write(`event: endpoint\ndata: ${JSON.stringify(endpointMessage)}\n\n`);

  // Send server info
  const serverInfo = {
    jsonrpc: '2.0',
    id: 0,
    result: {
      protocolVersion: '2024-11-05',
      serverInfo: {
        name: 'lovie-formation',
        version: '1.0.0',
      },
      capabilities: {
        tools: {},
        resources: {},
      },
    },
  };

  res.write(`event: message\ndata: ${JSON.stringify(serverInfo)}\n\n`);

  // Keep connection alive with periodic pings
  const pingInterval = setInterval(() => {
    try {
      res.write(`: ping ${Date.now()}\n\n`);
    } catch {
      clearInterval(pingInterval);
    }
  }, 15000);

  // Handle client disconnect
  req.on('close', () => {
    clearInterval(pingInterval);
    console.log(`SSE connection ${connectionId} closed`);
  });

  // For Vercel, we can't keep the connection open forever
  // Set a timeout to close after maxDuration
  setTimeout(() => {
    clearInterval(pingInterval);
    res.write(`event: close\ndata: {"reason": "timeout"}\n\n`);
    res.end();
  }, 55000); // Close before Vercel's 60s timeout
}

// Handle JSON-RPC requests for HTTP transport
async function handleJsonRpc(req: VercelRequest, res: VercelResponse) {
  const request = req.body as JsonRpcRequest;

  if (!request.jsonrpc || request.jsonrpc !== '2.0') {
    return res.status(400).json({
      jsonrpc: '2.0',
      id: null,
      error: { code: -32600, message: 'Invalid Request' },
    });
  }

  const { id, method, params } = request;

  try {
    switch (method) {
      case 'initialize': {
        return res.json({
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: '2024-11-05',
            serverInfo: {
              name: 'lovie-formation',
              version: '1.0.0',
            },
            capabilities: {
              tools: {},
              resources: {},
            },
          },
        });
      }

      case 'tools/list': {
        const tools = getAllTools();
        return res.json({
          jsonrpc: '2.0',
          id,
          result: { tools },
        });
      }

      case 'tools/call': {
        const { name, arguments: args } = params as { name: string; arguments?: Record<string, unknown> };

        try {
          const result = await handleToolCall(name, args || {}, store);
          return res.json({
            jsonrpc: '2.0',
            id,
            result: {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            },
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          return res.json({
            jsonrpc: '2.0',
            id,
            result: {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    error: true,
                    code: 'TOOL_ERROR',
                    message: errorMessage,
                  }, null, 2),
                },
              ],
              isError: true,
            },
          });
        }
      }

      case 'resources/list': {
        const resources = getAllResources();
        return res.json({
          jsonrpc: '2.0',
          id,
          result: { resources },
        });
      }

      case 'resources/read': {
        const { uri } = params as { uri: string };
        const content = getResourceContent(uri);

        if (!content) {
          return res.json({
            jsonrpc: '2.0',
            id,
            error: { code: -32602, message: `Resource not found: ${uri}` },
          });
        }

        return res.json({
          jsonrpc: '2.0',
          id,
          result: {
            contents: [
              {
                uri,
                mimeType: 'text/markdown',
                text: content,
              },
            ],
          },
        });
      }

      case 'notifications/initialized':
      case 'ping': {
        return res.json({
          jsonrpc: '2.0',
          id,
          result: {},
        });
      }

      default: {
        return res.json({
          jsonrpc: '2.0',
          id,
          error: { code: -32601, message: `Method not found: ${method}` },
        });
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.json({
      jsonrpc: '2.0',
      id,
      error: { code: -32603, message: errorMessage },
    });
  }
}
