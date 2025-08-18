// lib/vapi-wrapper.ts
import Vapi from "@vapi-ai/web";
import { toast } from "sonner";

class VapiWrapper {
  private vapi: Vapi;
  private retryCount = 0;
  private maxRetries = 3;
  private isReconnecting = false;
  private connectionState: RTCPeerConnectionState = 'new';
  private iceConnectionState: RTCIceConnectionState = 'new';

  constructor(token: string) {
    this.vapi = new Vapi(token);
    this.setupGlobalErrorHandling();
    this.suppressTransportErrors();
  }

  private setupGlobalErrorHandling() {
    // Handle browser-level connection issues
    window.addEventListener('online', () => {
      if (this.isReconnecting) {
        toast.success('Internet connection restored');
      }
    });

    window.addEventListener('offline', () => {
      toast.error('Internet connection lost');
    });
  }

  private suppressTransportErrors() {
    // Override console.error to filter out transport errors
    const originalError = console.error;
    console.error = (...args) => {
      const errorString = args.join(' ');
      
      // Suppress specific WebRTC transport errors that are handled internally
      if (
        errorString.includes('transport changed to disconnected') ||
        errorString.includes('transport changed to failed') ||
        errorString.includes('ICE connection state changed to disconnected') ||
        errorString.includes('ICE connection state changed to failed')
      ) {
        // Log to console.log instead for debugging
        console.log('[WebRTC Transport]:', errorString);
        return;
      }
      
      // Call original console.error for other errors
      originalError.apply(console, args);
    };
  }

  async start(assistant: any, options?: any) {
    try {
      this.retryCount = 0;
      this.isReconnecting = false;
      
      // Start the VAPI call
      const call = await this.vapi.start(assistant, options);
      
      // Monitor WebRTC connection state
      this.monitorConnection();
      
      return call;
    } catch (error: any) {
      console.error('VAPI start error:', error);
      
      // Don't retry for user-denied permissions
      if (error.message?.includes('permission')) {
        throw error;
      }
      
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        this.isReconnecting = true;
        toast.info(`Connection failed. Retrying... (${this.retryCount}/${this.maxRetries})`);
        
        // Wait before retrying with exponential backoff
        const delay = Math.min(1000 * Math.pow(2, this.retryCount), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        return this.start(assistant, options);
      }
      
      throw error;
    }
  }

  private monitorConnection() {
    // Get the RTCPeerConnection if available
    const pc = (this.vapi as any).peerConnection;
    if (!pc) return;

    // Monitor connection state
    pc.addEventListener('connectionstatechange', () => {
      this.connectionState = pc.connectionState;
      console.log('[WebRTC] Connection state:', this.connectionState);
      
      if (this.connectionState === 'failed') {
        this.handleConnectionFailure();
      }
    });

    // Monitor ICE connection state
    pc.addEventListener('iceconnectionstatechange', () => {
      this.iceConnectionState = pc.iceConnectionState;
      console.log('[WebRTC] ICE connection state:', this.iceConnectionState);
      
      if (this.iceConnectionState === 'failed') {
        this.handleConnectionFailure();
      }
    });
  }

  private handleConnectionFailure() {
    if (!this.isReconnecting) {
      console.log('[WebRTC] Handling connection failure');
      // Emit a custom error event that the Agent component can handle
      this.vapi.emit('connection-failed', new Error('WebRTC connection failed'));
    }
  }

  stop() {
    try {
      this.vapi.stop();
      this.isReconnecting = false;
    } catch (error) {
      console.error('Error stopping VAPI:', error);
    }
  }

  on(event: string, handler: Function) {
    this.vapi.on(event, handler);
  }

  off(event: string, handler: Function) {
    this.vapi.off(event, handler);
  }

  emit(event: string, data: any) {
    (this.vapi as any).emit(event, data);
  }

  async checkConnection(): Promise<boolean> {
    try {
      return !!this.vapi && this.connectionState === 'connected';
    } catch {
      return false;
    }
  }

  getConnectionState() {
    return {
      connection: this.connectionState,
      ice: this.iceConnectionState
    };
  }
}

export const vapiWrapper = new VapiWrapper(process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN!);