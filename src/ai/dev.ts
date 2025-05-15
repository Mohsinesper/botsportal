import { config } from 'dotenv';
config();

import '@/ai/flows/agent-optimization-suggestions.ts';
import '@/ai/flows/master-script-generator.ts'; // Ensuring this also points to the correct file

