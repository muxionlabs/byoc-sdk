# BYOC SDK Demo App

This is a demo web application that showcases the capabilities of the BYOC SDK for live video streaming with AI processing.

## Features

- **Publisher**: Start a live stream with AI processing
- **Viewer**: Watch live streams
- Real-time statistics and monitoring
- Modern React + TypeScript + Vite setup

## Running the Demo

### Development Mode

From the root directory:
```bash
npm run demo:dev
```

Or from the demo directory:
```bash
cd demo
npm install
npm run dev
```

The app will be available at `http://localhost:3005`

### Production Build

```bash
npm run demo:build
```

The built app will be in `demo/dist/`

## Docker Deployment

The demo app is integrated with docker-compose. To run the full stack:

```bash
docker-compose up -d
```

Access the demo at `http://localhost:8088`

## Configuration

The app automatically configures itself based on the environment:

- **VITE_HOST**: Server hostname (defaults to current hostname)
- **VITE_WORKFLOW_API_KEY**: API key for workflow management

### Auto-Configuration

The app detects whether it's running in production (port 8088/443) or development (port 3005):

**Production Mode** (via Caddy proxy):
- All requests go through Caddy at port 8088
- Uses proxy paths: `/gateway/*`, `/mediamtx/*`, `/kafka/events/*`

**Development Mode** (local):
- Direct connections to service ports
- WHIP: `localhost:7280`
- WHEP: `localhost:8088`
- Gateway: `localhost:5937`
- Kafka: `localhost:7114`

### CORS

All services are pre-configured to allow cross-origin requests:
- Caddyfile: `Access-Control-Allow-Origin: *`
- MediaMTX: `webrtcAllowOrigin: '*'`

See [DEVELOPMENT.md](../DEVELOPMENT.md) for detailed CORS configuration.

## Project Structure

```
demo/
├── src/
│   ├── components/
│   │   ├── Publisher.tsx    # Stream publishing component
│   │   └── Viewer.tsx       # Stream viewing component
│   ├── App.tsx              # Main app component
│   └── main.tsx             # Entry point
├── index.html               # HTML template
├── vite.config.ts           # Vite configuration
└── package.json             # Dependencies
```

## Usage

1. **Start a Stream**:
   - Go to the Publisher tab
   - Configure stream settings (name, resolution, fps, etc.)
   - Add AI prompts if desired
   - Click "Start Streaming"

2. **View a Stream**:
   - Go to the Viewer tab
   - Enter the playback URL (or use the one from Publisher)
   - Click "Start Viewing"

3. **Update Stream Parameters**:
   - While streaming, modify the prompts
   - Click "Update Prompts" to apply changes in real-time

