"use strict";
/**
 * Simple Vanilla JavaScript/TypeScript Example
 *
 * This example demonstrates how to use the BYOC SDK to publish
 * video and audio streams without React.
 *
 * Server Configuration:
 * - Gateway (WHIP): https://eliteencoder.net:8088/gateway/ai/stream/start
 * - MediaMTX (WHEP): https://eliteencoder.net:8088/mediamtx
 * - Data Stream: https://eliteencoder.net:8088/gateway/ai/stream/{streamName}/data
 * - Events (Kafka): https://eliteencoder.net:8088/kafka/events
 */
Object.defineProperty(exports, "__esModule", { value: true });
const byoc_sdk_1 = require("@eliteencoder/byoc-sdk");
// Configure SDK with your server endpoints
const config = {
    whipUrl: 'https://eliteencoder.net:8088/gateway/ai/stream/start',
    whepUrl: 'https://eliteencoder.net:8088/mediamtx',
    dataStreamUrl: 'https://eliteencoder.net:8088/gateway',
    kafkaEventsUrl: 'https://eliteencoder.net:8088/kafka/events',
    defaultPipeline: 'comfystream'
};
// Create publisher instance
const publisher = new byoc_sdk_1.StreamPublisher(config);
// Generate a unique stream name
const streamName = `stream-${Date.now()}`;
// Setup event listeners
publisher.on('statusChange', (status) => {
    console.log(`📡 Status changed: ${status}`);
});
publisher.on('statsUpdate', (stats) => {
    console.log('📊 Stats:', {
        bitrate: `${(stats.bitrate / 1000).toFixed(2)} kbps`,
        fps: stats.fps,
        resolution: stats.resolution,
        latency: stats.latency ? `${stats.latency}ms` : 'N/A'
    });
});
publisher.on('error', (error) => {
    console.error('❌ Error:', error.message);
});
publisher.on('streamStarted', (response) => {
    console.log('✅ Stream started successfully!');
    console.log('📺 Stream Info:', {
        streamId: response.streamId,
        whepUrl: response.whepUrl,
        dataUrl: response.dataUrl
    });
    console.log('\n🔗 Access your stream data at:');
    console.log(`   ${response.dataUrl}`);
});
publisher.on('mediaStreamReady', (stream) => {
    console.log('🎥 Media stream ready:', {
        videoTracks: stream.getVideoTracks().length,
        audioTracks: stream.getAudioTracks().length
    });
});
// Main function to start streaming
async function startStream() {
    try {
        console.log('🚀 Starting BYOC stream...');
        console.log(`📝 Stream name: ${streamName}`);
        // Request permissions first
        console.log('🎤 Requesting camera and microphone permissions...');
        await publisher.requestPermissions(true, true);
        console.log('✅ Permissions granted');
        // Start the stream
        const streamInfo = await publisher.start({
            streamName: streamName,
            pipeline: 'comfystream',
            width: 1280,
            height: 720,
            fpsLimit: 30,
            enableVideoIngress: true, // Enable video input
            enableAudioIngress: true, // Enable audio input
            enableVideoEgress: true, // Enable video output (via WHEP)
            enableAudioEgress: true, // Enable audio output (via WHEP)
            enableDataOutput: true, // Enable data stream output (via Kafka)
            customParams: {
                prompts: 'Analyze this video stream'
            }
        });
        console.log('\n✨ Stream is now live!');
        console.log('⏱️  Streaming for 30 seconds...\n');
        // Stream for 30 seconds then stop
        setTimeout(async () => {
            console.log('\n⏹️  Stopping stream...');
            await stopStream();
        }, 30000);
    }
    catch (error) {
        console.error('❌ Failed to start stream:', error);
    }
}
// Function to stop streaming
async function stopStream() {
    try {
        await publisher.stop();
        console.log('✅ Stream stopped successfully');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Failed to stop stream:', error);
        process.exit(1);
    }
}
// Handle cleanup on exit
process.on('SIGINT', async () => {
    console.log('\n\n🛑 Received SIGINT, stopping stream...');
    await stopStream();
});
process.on('SIGTERM', async () => {
    console.log('\n\n🛑 Received SIGTERM, stopping stream...');
    await stopStream();
});
// Start the stream
startStream();
