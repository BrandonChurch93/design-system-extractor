import { z } from 'zod';

// The app's CSP forbids eval, and Zod otherwise probes `Function('')` to compile its parsers.
z.config({ jitless: true });
