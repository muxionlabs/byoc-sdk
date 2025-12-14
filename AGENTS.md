# AGENTS.md - BYOC SDK Project Context

> **Purpose**: High-level context for AI agents. Read this first to understand the project's architecture, patterns, and conventions before making changes.
>
> **Related Documents**:
> - [`README.md`](./README.md) - Project overview and usage
> - **AGENTS.md** (this file) - Current implementation state and conventions
> - [`demo/README.md`](./demo/README.md) - Documentation for the demo application

## 🚀 TL;DR - Start Here

**What is this?** The BYOC SDK is a TypeScript library for building applications on the Livepeer BYOC (Bring Your Own Compute) network. It handles WebRTC streaming (WHIP/WHEP), device management, and real-time AI data synchronization.

**Tech Stack**: TypeScript, WebRTC (WHIP/WHEP), React (optional), Server-Sent Events (SSE)

**Core Flow**: 
1. **Publish**: Device Camera/Mic → `StreamPublisher` → WHIP Endpoint → AI Pipeline
2. **View**: AI Pipeline Output → WHEP Endpoint → `StreamViewer` → Video Element
3. **Data**: AI Pipeline Metadata → SSE Endpoint → `DataStreamClient` → App UI

**Key Files to Know**:
- `src/core/StreamPublisher.ts` - Handles media capture and WHIP publishing
- `src/core/StreamViewer.ts` - Handles WHEP playback
- `src/core/DataStreamClient.ts` - Handles real-time AI data (SSE)
- `src/react/` - React hooks for all core components
- `demo/src/App.tsx` - Reference implementation using the SDK

---

## 📖 How to Use This Document

**AGENTS Philosophy**:
- **Stay Concise**: Focus on architecture and intent.
- **Map the Territory**: Explain where things live so agents can navigate.
- **Preserve Context**: Document *why* things are done a certain way.

**When making changes**:
1. Read this file for context.
2. Check `src/core` for logic changes or `src/react` for hook updates.
3. Update `AGENTS.md` if you change architecture or add major components.

---

## 🎯 Project Mission

To provide a production-ready, easy-to-use SDK for developers building real-time video AI applications on Livepeer. It abstracts the complexities of WebRTC signaling, media device management, and synchronization between video and AI data.

---

## 🏗️ Tech Stack

- **Language**: TypeScript (builds to ESM/CJS)
- **Streaming**: WebRTC via WHIP (Ingest) and WHEP (Egress)
- **Data**: Server-Sent Events (SSE) for low-latency metadata
- **Frontend Frameworks**: Agnostic core, with first-class React support
- **Build Tool**: `tsup` for library, `vite` for demo

---

## 📐 Architecture Overview

### Core Components (`src/core`)

The SDK is built around standalone classes that can be used in any JavaScript environment.

```
┌─────────────────┐       ┌─────────────────┐
│ StreamPublisher │ ────▶ │  WHIP Endpoint  │
└─────────────────┘       └─────────────────┘
        │
        ▼
   (MediaStream)
        
┌─────────────────┐       ┌─────────────────┐
│  StreamViewer   │ ◀──── │  WHEP Endpoint  │
└─────────────────┘       └─────────────────┘

┌──────────────────┐      ┌─────────────────┐
│ DataStreamClient │ ◀─── │  SSE Endpoint   │
└──────────────────┘      └─────────────────┘
```

### React Integration (`src/react`)

Wrappers around core components to manage lifecycle and state in React apps.

- `useStreamPublisher`: Manages `StreamPublisher` instance, device lists, and connection state.
- `useStreamViewer`: Manages `StreamViewer` and video element refs.
- `useDataStream`: Subscribes to AI events and updates state.

---

## 🗂️ Project Structure

### Source (`src/`)

- **`core/`**: Main logic.
    - `StreamPublisher.ts`: Manages `RTCPeerConnection` for sending video. Handles ICE restarts, device switching, and bandwidth management.
    - `StreamViewer.ts`: Manages `RTCPeerConnection` for receiving video.
    - `DataStreamClient.ts`: `EventSource` wrapper for AI data.
- **`react/`**: React hooks.
    - `useStreamPublisher.ts`, `useStreamViewer.ts`, `useDataStream.ts`.
- **`api/`**: Internal API helpers (fetching SDPs, etc.).
- **`utils/`**: Shared utilities (logging, error handling).

### Demo (`demo/`)

A full Create React App / Vite application that demonstrates:
- Camera selection and preview.
- Starting a stream with AI parameters.
- Viewing the transformed stream.
- Displaying real-time AI metrics.

---

## 🎨 Code Patterns

### Configuration

All components take a `StreamConfig` instance. `StreamConfig` is a class that encapsulates gateway URL and derives endpoint paths:

```typescript
// Simple - just the gateway URL (required)
const config = new StreamConfig({
  gatewayUrl: 'https://gateway.example.com:8088'
})

// With options - add pipeline, custom paths, etc.
const config = new StreamConfig({
  gatewayUrl: 'https://gateway.example.com:8088',
  defaultPipeline: 'comfystream',
  // Optional: customize paths (defaults provided)
  whipPath: '/gateway/ai/stream/start',  // default
  whepPath: '/mediamtx',                  // default
  dataPath: '/gateway/ai/stream/',        // default
  iceServers: [...]                       // custom ICE servers
})
```

**Key Design Principles**:
- **Single source of truth**: Gateway URL is the only required field, all endpoint URLs are derived automatically
- **Simplicity**: One parameter object with sensible defaults
- **Encapsulation**: StreamConfig internally constructs WHIP, WHEP, and data URLs via helper methods (`getWhipUrl()`, `getWhepUrl()`, `getDataUrl()`)
- **Customization**: Optional path overrides for non-standard gateway configurations (all have defaults)

**URL Construction Pattern**:
```typescript
// StreamConfig builds full URLs from base gateway URL + paths
config.getWhipUrl({ pipeline: 'comfystream', width: 1280, height: 720 })
// → https://gateway.example.com:8088/gateway/ai/stream/start?pipeline=comfystream&width=1280&height=720

config.getWhepUrl('/stream/abc-123/whep')  // Leading slash replaces the path
// → https://gateway.example.com:8088/stream/abc-123/whep

config.getDataUrl('my-stream')
// → https://gateway.example.com:8088/gateway/ai/stream/my-stream/data
```

**Key Design Principle**: Gateway returns relative paths (like `playbackUrl`), SDK constructs full URLs by combining with configured base URLs. Users never need to deal with full URL construction.

### Error Handling

- **Core**: Methods throw typed errors or return Promises that reject.
- **React**: Hooks expose an `error` state object.
- **Retry Logic**: Network operations (like SDP exchange) should have retry mechanisms (handled in `src/utils` or within core classes).

### Type Safety

- Extensive use of TypeScript interfaces for API responses and configuration.
- `StreamConfig` constructor accepts an inline typed object (no separate `StreamConfigOptions` interface needed).
- Specific types exported for options: `StreamStartOptions`, `StreamUpdateOptions`, `ViewerStartOptions`, `DataStreamOptions`.
- Response types: `StreamStartResponse`, `WhipOfferResponse`, `WhepOfferResponse`.
- Error classes: `StreamError`, `ConnectionError`, `MediaError`.

---

## ⚙️ Development & Testing

### Commands

- `npm run build`: Builds the SDK to `dist/`.
- `npm run dev`: Watches for changes and rebuilds.
- `npm run serve:examples`: Serves simple HTML examples.
- `npm run demo:dev`: Starts the React demo app (requires `npm link` or local setup).

### Linking

To test changes in the demo app:
1. Root: `npm link`
2. `demo/`: `npm link @muxionlabs/byoc-sdk`

---

## 📋 Acceptance Criteria for Changes

### Adding Features
1. Implement logic in `src/core`.
2. Expose functionality via `src/react` hooks if applicable.
3. Update `types.ts` with new interfaces.
4. Add a usage example in `demo/` or `examples/`.

### Modifying Core
1. Ensure backward compatibility or update major version.
2. Verify WebRTC negotiation still works (WHIP/WHEP).
3. Check error handling and cleanup (closing connections).

---

