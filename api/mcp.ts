import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAllTools, handleToolCall } from '../dist/mcp/tools/index';
import { getAllResources, getResourceContent } from '../dist/mcp/resources/index';
import { getSessionStore } from '../dist/mcp/state/FormationSessionStore';

// MCP JSON-RPC request types
interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
}

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

// Initialize session store
const store = getSessionStore();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    // Return server info for GET requests
    return res.json({
      name: 'lovie-formation',
      version: '1.0.0',
      protocolVersion: '2024-11-05',
      capabilities: {
        tools: {},
        resources: {},
      },
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const request = req.body as JsonRpcRequest;

  if (!request.jsonrpc || request.jsonrpc !== '2.0') {
    return res.status(400).json({
      jsonrpc: '2.0',
      id: null,
      error: { code: -32600, message: 'Invalid Request' },
    });
  }

  try {
    const response = await handleMcpRequest(request);
    return res.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.json({
      jsonrpc: '2.0',
      id: request.id,
      error: { code: -32603, message: errorMessage },
    } as JsonRpcResponse);
  }
}

async function handleMcpRequest(request: JsonRpcRequest): Promise<JsonRpcResponse> {
  const { id, method, params } = request;

  switch (method) {
    case 'initialize': {
      return {
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
      };
    }

    case 'tools/list': {
      const tools = getAllTools();
      return {
        jsonrpc: '2.0',
        id,
        result: { tools },
      };
    }

    case 'tools/call': {
      const { name, arguments: args } = params as { name: string; arguments?: Record<string, unknown> };

      try {
        const result = await handleToolCall(name, args || {}, store);
        return {
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
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return {
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
        };
      }
    }

    case 'resources/list': {
      const resources = getAllResources();
      return {
        jsonrpc: '2.0',
        id,
        result: { resources },
      };
    }

    case 'resources/read': {
      const { uri } = params as { uri: string };
      const content = getResourceContent(uri);

      if (!content) {
        return {
          jsonrpc: '2.0',
          id,
          error: { code: -32602, message: `Resource not found: ${uri}` },
        };
      }

      return {
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
      };
    }

    case 'notifications/initialized':
    case 'ping': {
      return {
        jsonrpc: '2.0',
        id,
        result: {},
      };
    }

    default: {
      return {
        jsonrpc: '2.0',
        id,
        error: { code: -32601, message: `Method not found: ${method}` },
      };
    }
  }
}
