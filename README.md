# CallRoute Console - SignalWire Inbound Call Passthrough Dashboard

A professional, production-quality SaaS web dashboard for configuring, simulating, and monitoring a **SignalWire inbound call passthrough system**.

---

## 🧭 Key Pages & Features

### 1. Overview
- **KPI Metrics**: Total calls today, Answer rate (%), Fallback escalation rate (%), Avg ring time (s).
- **Inbound Calls per Hour Chart**: Interactive visual area chart tracking hourly call traffic and answered outcomes.
- **Traffic by Campaign Source**: Donut chart breaking down Ad Campaigns vs. Warm Transfers.
- **Recent Calls Table**: Displays the last 8 calls with status badges and quick inspection links.

### 2. Routing Rules
- **Rule Table**: Dialed number (E.164), Label, Source Type (Ad / Transfer), Destination Agent Number, Priority, Timeout, and Active toggle.
- **Side Drawer**: Slide-out drawer with full E.164 format validation (`+1555XXXXXXX`) for adding/editing rules.
- **Fallback Configuration Card**: Edit fallback destination number, ring timeout, and customize the `<Say>` audio message played prior to fallback dial.
- **Delete Confirm Dialog**: Modal confirmation before removing any routing rule.

### 3. Call Simulator (Key Practice Feature)
- **Form Controls**: "To" (dialed SignalWire number dropdown), "From" (caller number), and editable `CallSid` with refresh generator.
- **Send Test Call**: Mimics SignalWire's HTTP POST to `/voice/inbound`.
- **Three-Panel Output View**:
  - **Panel A**: Request sent (formatted JSON payload)
  - **Panel B**: Routing decision (which rule matched, destination chosen, reason)
  - **Panel C**: Generated cXML response with syntax formatting and one-click copy button
- **Simulate Dial Result**: Choose from `completed`, `no-answer`, `busy`, or `failed` to simulate Stage 2 callback and inspect the fallback cXML.
- **Visual Step Timeline**: 6-step lifecycle tracker with timestamps and status indicators:
  `Call received` → `Webhook sent` → `Routing decided` → `Dialing agent` → `Answered / Fallback` → `Completed`.

### 4. Call Logs
- **Search & Filters**: Search by CallSid, phone, or agent; filter by status or campaign source.
- **Detail Drawer**: Click any call to inspect its full trace, request payload, and raw cXML responses.
- **Export CSV**: One-click download of all filtered records to `.csv`.
- **Pagination**: 8 calls per page with page navigation.

### 5. Integration Settings
- **Read-Only Webhook Endpoints**: Copy buttons for `/voice/inbound` and `/voice/dial-result`.
- **SignalWire Credentials Form**: Space URL, Project ID, and API Token (with show/hide mask).
- **Test Connection**: Live connection test simulation.
- **Go-Live Readiness Checklist**: 5-step checklist covering signature validation, logging, fallback, staging, and rollback plans.

### 6. Help / Guide
- Visual architecture diagram of the SignalWire passthrough flow.
- Telephony Glossary: Webhook, cXML / LaML, CallSid, and E.164 standard.
- Upwork client best practices and security protocol guidelines.

---

## 🚀 Running the App

### 1. Start the Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### 2. Light / Dark Mode & Environment Switcher
- Use the **Sun / Moon toggle** in the top bar to switch between Light and Dark themes.
- Toggle between **Demo**, **Staging**, and **Production** environments in the top bar.

### 3. Standalone Express / Node Server (Optional)
If you wish to test the standalone backend script from Section 4.4 of the guide:
```bash
node server.js
```
