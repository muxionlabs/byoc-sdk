# Configuration Directory

This directory contains optional configuration files for the Docker deployment.

## Custom Configuration

To use custom configurations, place your files here and mount them in docker-compose:

```yaml
volumes:
  - ./config:/app/config-custom
```

## Available Configurations

### MediaMTX (mediamtx.yml)

Controls WebRTC streaming behavior. Key settings:
- `webrtcAddress`: WebRTC listening address
- `logLevel`: Logging verbosity
- `paths`: Stream path configurations

Example: See the default config in Dockerfile or copy from livepeer-app-pipelines.

### Caddy (Caddyfile)

Controls reverse proxy and webapp serving. Key settings:
- Port configuration
- CORS headers
- Reverse proxy routes
- TLS settings

Example: See the default config in Dockerfile.

## Environment Variables

Create a `.env` file in the root directory:

```bash
# Host configuration
HOST=localhost
HOST_IP=127.0.0.1

# Gateway configuration
LIVE_AI_ALLOW_CORS=1
LIVE_AI_WHIP_ADDR=localhost:7280
LIVE_AI_GATHER_TIMEOUT=5
LIVE_AI_MIN_SEG_DUR=1s
```

## Gateway Binary

To include the Livepeer gateway, mount the binary:

```yaml
volumes:
  - /path/to/livepeer:/usr/local/bin/livepeer
```

Then update the supervisord configuration to run it with appropriate flags.


