// server.js
// Standalone Node.js server matching Section 4.4 of the SignalWire documentation
// Works with native Node.js (zero external dependencies required)

const http = require('http');
const querystring = require('querystring');
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envPath = path.resolve(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const [key, ...vals] = trimmed.split('=');
      if (key && vals.length > 0) {
        process.env[key.trim()] = vals.join('=').trim();
      }
    }
  }
}
loadEnv();

const PORT = process.env.PORT || 3000;
const AGENT_A = process.env.AGENT_A || '+15551110001';
const AGENT_B = process.env.AGENT_B || '+15551110002';
const FALLBACK_NUMBER = process.env.FALLBACK_NUMBER || '+15551110003';
const SIGNALWIRE_AD_NUMBER = (process.env.SIGNALWIRE_AD_NUMBER || '').trim();
const SIGNALWIRE_TRANSFER_NUMBER = (process.env.SIGNALWIRE_TRANSFER_NUMBER || '').trim();

// Routing rules mapping dialed SignalWire numbers to agent destinations
const ROUTES = {
  '+15550000001': AGENT_A, // Simulation Ad Campaign Line
  '+15550000002': AGENT_B, // Simulation Transfer Line
};

if (SIGNALWIRE_AD_NUMBER) {
  ROUTES[SIGNALWIRE_AD_NUMBER] = AGENT_A;
}
if (SIGNALWIRE_TRANSFER_NUMBER) {
  ROUTES[SIGNALWIRE_TRANSFER_NUMBER] = AGENT_B;
}

function pickDestination(toNumber, fromNumber) {
  return ROUTES[toNumber] || FALLBACK_NUMBER;
}

const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0];

  if (req.method === 'GET' && url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('SignalWire demo is running');
  }

  // Parse body for POST requests
  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      let parsed = {};
      const contentType = req.headers['content-type'] || '';

      if (contentType.includes('application/json')) {
        try { parsed = JSON.parse(body); } catch (_) {}
      } else {
        parsed = querystring.parse(body);
      }

      // Step 1: Incoming Call Webhook
      if (url === '/voice/inbound') {
        const To = (parsed.To || '').trim();
        const From = (parsed.From || '').trim();
        const CallSid = parsed.CallSid || `CALL_${Date.now()}`;

        console.log('[SignalWire Inbound Call]', { CallSid, From, To });

        const destination = pickDestination(To, From);

        res.writeHead(200, { 'Content-Type': 'text/xml; charset=utf-8' });

        if (!destination) {
          const hangupXml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Sorry, no one is available right now.</Say>
  <Hangup/>
</Response>`;
          return res.end(hangupXml);
        }

        const dialXml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial callerId="${To}" timeout="25" action="/voice/dial-result">
    <Number>${destination}</Number>
  </Dial>
</Response>`;
        return res.end(dialXml);
      }

      // Step 2: Dial Result Callback
      if (url === '/voice/dial-result') {
        const CallSid = parsed.CallSid || '';
        const DialCallStatus = parsed.DialCallStatus || '';

        console.log('[SignalWire Dial Result]', { CallSid, DialCallStatus });

        res.writeHead(200, { 'Content-Type': 'text/xml; charset=utf-8' });

        if (DialCallStatus === 'completed' || DialCallStatus === 'answered') {
          return res.end(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Hangup/>
</Response>`);
        }

        // no-answer, busy, or failed: forward to fallback
        const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Please hold while we connect you to another agent.</Say>
  <Dial timeout="25">
    <Number>${FALLBACK_NUMBER}</Number>
  </Dial>
</Response>`;
        return res.end(fallbackXml);
      }

      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`SignalWire Demo Server listening on port ${PORT}`);
    console.log(`Inbound URL: http://localhost:${PORT}/voice/inbound`);
    console.log(`Dial Result URL: http://localhost:${PORT}/voice/dial-result`);
  });
}

module.exports = server;
