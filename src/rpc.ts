#!/usr/bin/env node

import { RPC } from 'basketry';
import parser from './index.js';

new RPC({ parser }).execute();
