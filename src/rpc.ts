#!/usr/bin/env node

import {
  ParseRequest,
  ValidateRequest,
  GenerateRequest,
  ErrorResponse,
  ParseResponse,
  ErrorResponseId,
} from '@basketry/ir';
import { TypespecParser } from './parser.js';

class RPC {
  async execute(): Promise<void> {
    const stdin = await this.readStdin();

    const req = this.parseRequest(stdin);

    if (!req) return;

    // TODO: validate request

    const id = req.id;

    switch (req.method) {
      case 'basketry.parse': {
        const parser = await TypespecParser.create(
          req.params.context,
          req.params.basketry,
        );

        if (parser) {
          const { service, violations } = await parser.parse();

          const res: ParseResponse = {
            jsonrpc: '2.0',
            id,
            result: {
              service,
              violations,
            },
          };

          return console.log(JSON.stringify(res));
        } else {
          // TODO ....
          const error: ErrorResponse = {
            jsonrpc: '2.0',
            id,
            error: {
              code: -32603,
              message: 'Internal error',
            },
          };

          return console.log(JSON.stringify(error));
        }
      }
      default: {
        return this.methodNotFound(id);
      }
    }
  }

  private parseRequest(
    stdin: string,
  ): ParseRequest | ValidateRequest | GenerateRequest | undefined {
    try {
      const req = JSON.parse(stdin) as
        | ParseRequest
        | ValidateRequest
        | GenerateRequest;

      if (
        req.jsonrpc !== '2.0' ||
        (typeof req.id !== 'number' && typeof req.id !== 'string')
      ) {
        this.invalidRequest(null, 'Invalid request');
        return undefined;
      }

      return req;
    } catch {
      this.parseError(null, 'Invalid JSON');
      return undefined;
    }
  }

  private methodNotFound(id: ErrorResponseId): void {
    const error: ErrorResponse = {
      jsonrpc: '2.0',
      id,
      error: {
        code: -32601,
        message: 'Method not found',
      },
    };

    console.log(JSON.stringify(error));
  }

  private parseError(id: ErrorResponseId, message: string): void {
    const error: ErrorResponse = {
      jsonrpc: '2.0',
      id,
      error: {
        code: -32700,
        message,
      },
    };

    console.log(JSON.stringify(error));
  }

  private invalidRequest(id: ErrorResponseId, message: string): void {
    const error: ErrorResponse = {
      jsonrpc: '2.0',
      id,
      error: {
        code: -32600,
        message,
      },
    };

    console.log(JSON.stringify(error));
  }

  private readStdin(): Promise<string> {
    return new Promise((resolve, reject) => {
      let stdinData = '';
      process.stdin.setEncoding('utf8');

      process.stdin.on('data', (chunk) => {
        stdinData += chunk;
      });

      process.stdin.on('error', (err) => {
        reject(err);
      });

      process.stdin.on('end', () => {
        resolve(stdinData);
      });
    });
  }
}

new RPC().execute();
