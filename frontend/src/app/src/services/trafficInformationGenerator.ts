// API utility for AI Traffic Information endpoints
import axiosInstance from './axiosInstance';
import { fetchEventSource } from './fetch';
import { 
  TabKey, 
  SystemPrompts,
  TrafficInformationRequest,
  TrafficInformationRegenerationRequest,
  SystemPromptUpdateRequest,
  GenerateContentStreamParams,
  RegenerateContentStreamParams,
  TrafficInformationError
} from '../types/trafficInformation';

const config = window.env;

// Get system prompts for all tabs
export const getSystemPrompts = async (): Promise<SystemPrompts> => {
  try {
    const res = await axiosInstance.get(`${config.apiUrl}api/TrafficInformationGenerator/settings`);
    return res.data;
  } catch (error: any) {
    const trafficError: TrafficInformationError = new Error('Failed to fetch system prompts');
    trafficError.code = 'FETCH_SYSTEM_PROMPTS_ERROR';
    trafficError.statusCode = error?.response?.status;
    throw trafficError;
  }
};

// Set system prompt for a tab
export const setSystemPrompts = async (payload: SystemPrompts): Promise<void> => {
  try {
    await axiosInstance.put(`${config.apiUrl}api/TrafficInformationGenerator/settings`, payload);
  } catch (error: any) {
    const trafficError: TrafficInformationError = new Error('Failed to update system prompts');
    trafficError.code = 'UPDATE_SYSTEM_PROMPT_ERROR';
    trafficError.statusCode = error?.response?.status;
    throw trafficError;
  }
};

// Streaming: Generate traffic content - following ChatComponent pattern
export const generateTrafficContentStream = async ({
  payload,
  onContent,
  onDone,
  onError,
  signal,
}: GenerateContentStreamParams): Promise<void> => {
  console.log('🚀 [TrafficInformation] Starting stream request:', {
    url: `${config.apiUrl}api/TrafficInformationGenerator`,
    payload,
    method: 'POST'
  });
  
  return fetchEventSource(`${config.apiUrl}api/TrafficInformationGenerator`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
    onmessage(event) {
      try {
        console.log('🔄 [TrafficInformation] Raw SSE Event:', event);
        console.log('🔄 [TrafficInformation] Event Data:', event.data);
        
        const data = JSON.parse(event.data);
        console.log('🔄 [TrafficInformation] Parsed Data:', data);
        
        // Handle stream end signal (using actual backend format)
        if (data.Content === 'stream-ended') {
          console.log('✅ [TrafficInformation] Stream ended');
          onDone?.();
          return;
        }
        
        // Handle processing message
        if (data.Content === 'Processing...') {
          console.log('⏳ [TrafficInformation] Processing...');
          return; // Don't pass processing message to UI
        }
        
        // Handle content data (using actual backend format)
        if (data.Content && typeof data.Content === 'object' && data.Section) {
          const platformContent = data.Content.Content;
          const section = data.Section;
          
          console.log('📝 [TrafficInformation] Content received:', {
            section,
            platformContent,
            fullData: data
          });
          
          // Pass the structured content to the hook
          onContent({
            platform: section,
            content: platformContent
          });
          return;
        }
        
        // Handle error in stream
        if (data.error) {
          console.error('❌ [TrafficInformation] Stream error:', data.error);
          const error: TrafficInformationError = new Error(data.error);
          error.code = 'STREAM_ERROR';
          onError?.(error);
          return;
        }
        
        // Log any unexpected data structure
        console.log('❓ [TrafficInformation] Unexpected data structure:', data);
        
      } catch (err) {
        console.error('❌ [TrafficInformation] Error parsing SSE data:', err);
        console.error('❌ [TrafficInformation] Raw event data:', event.data);
        const parseError: TrafficInformationError = new Error('Failed to parse stream data');
        parseError.code = 'STREAM_PARSE_ERROR';
        onError?.(parseError);
      }
    },
    onerror(err) {
      console.error('❌ [TrafficInformation] SSE Connection Error:', err);
      console.error('❌ [TrafficInformation] Error details:', {
        status: err.status,
        message: err.message,
        type: typeof err,
        fullError: err
      });
      
      const streamError: TrafficInformationError = new Error('Stream connection error');
      streamError.code = 'STREAM_CONNECTION_ERROR';
      
      // Check if it's a network error or server error
      if (err.status) {
        streamError.statusCode = err.status;
        console.error(`❌ [TrafficInformation] HTTP Status: ${err.status}`);
      }
      
      onError?.(streamError);
      
      // Don't throw to allow retry mechanism
    },
    onclose() {
      console.log('🔚 [TrafficInformation] SSE Connection closed');
      onDone?.();
    },
  });
};

// Streaming: Regenerate traffic content for a specific tab
export const regenerateTrafficContentStream = async ({
  payload,
  onContent,
  onDone,
  onError,
  signal,
}: RegenerateContentStreamParams): Promise<void> => {
  console.log('🔄 [TrafficInformation] Starting regeneration stream request:', {
    url: `${config.apiUrl}api/TrafficInformationGenerator/Content`,
    payload,
    method: 'POST'
  });
  
  return fetchEventSource(`${config.apiUrl}api/TrafficInformationGenerator/Content`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
    onmessage(event) {
      try {
        console.log('🔄 [TrafficInformation] Raw regeneration SSE Event:', event);
        console.log('🔄 [TrafficInformation] Regeneration Event Data:', event.data);
        
        const data = JSON.parse(event.data);
        console.log('🔄 [TrafficInformation] Parsed regeneration data:', data);
        
        // Handle stream end signal (using actual backend format with uppercase Content)
        if (data.Content === 'stream-ended') {
          console.log('✅ [TrafficInformation] Regeneration stream ended');
          onDone?.();
          return;
        }
        
        // Handle processing message
        if (data.Content === 'Processing...') {
          console.log('⏳ [TrafficInformation] Regeneration processing...');
          return; // Don't pass processing message to UI
        }
        
        // Handle content data (using actual backend format with uppercase Content)
        if (data.Content && typeof data.Content === 'string' && data.Content !== 'Processing...' && data.Content !== 'stream-ended') {
          console.log('📝 [TrafficInformation] Regeneration content received:', {
            content: data.Content.substring(0, 100) + '...',
            fullLength: data.Content.length,
            platform: payload.Platform
          });
          
          onContent(data.Content);
          return;
        }
        
        // Handle error in stream
        if (data.error) {
          console.error('❌ [TrafficInformation] Regeneration stream error:', data.error);
          const error: TrafficInformationError = new Error(data.error);
          error.code = 'REGENERATE_STREAM_ERROR';
          error.platform = payload.Platform;
          onError?.(error);
          return;
        }
        
        // Log any unexpected data structure
        console.log('❓ [TrafficInformation] Unexpected regeneration data structure:', data);
        
      } catch (err) {
        console.error('❌ [TrafficInformation] Error parsing regeneration SSE data:', err);
        console.error('❌ [TrafficInformation] Raw regeneration event data:', event.data);
        const parseError: TrafficInformationError = new Error('Failed to parse regeneration stream data');
        parseError.code = 'REGENERATE_STREAM_PARSE_ERROR';
        parseError.platform = payload.Platform;
        onError?.(parseError);
      }
    },
    onerror(err) {
      console.error('❌ [TrafficInformation] Regeneration SSE Connection Error:', err);
      console.error('❌ [TrafficInformation] Regeneration error details:', {
        status: err.status,
        message: err.message,
        type: typeof err,
        fullError: err
      });
      
      const streamError: TrafficInformationError = new Error(`Regeneration stream error for ${payload.Platform}`);
      streamError.code = 'REGENERATE_STREAM_CONNECTION_ERROR';
      streamError.platform = payload.Platform;
      
      if (err.status) {
        streamError.statusCode = err.status;
      }
      
      onError?.(streamError);
    },
    onclose() {
      console.log('🔚 [TrafficInformation] Regeneration SSE Connection closed');
      onDone?.();
    },
  });
};

// Utility function to create proper error messages for notifications
export const getErrorMessage = (error: TrafficInformationError, context: string, t?: (key: string, options?: any) => string): string => {
  // If no translation function provided, fallback to English
  if (!t) {
    if (error.statusCode && (error.statusCode === 401 || error.statusCode === 403)) {
      return 'Authentication required. Please log in again.';
    }
    
    if (error.statusCode && error.statusCode === 429) {
      return 'Too many requests. Please wait a moment and try again.';
    }
    
    if (error.statusCode && error.statusCode >= 500) {
      return 'Server error. Please try again later.';
    }
    
    switch (error.code) {
      case 'STREAM_CONNECTION_ERROR':
      case 'REGENERATE_STREAM_CONNECTION_ERROR':
        return 'Connection lost. Please check your internet connection and try again.';
      case 'STREAM_PARSE_ERROR':
      case 'REGENERATE_STREAM_PARSE_ERROR':
        return 'Error processing server response. Please try again.';
      case 'FETCH_SYSTEM_PROMPTS_ERROR':
        return 'Failed to load system prompts. Please refresh the page.';
      case 'UPDATE_SYSTEM_PROMPT_ERROR':
        return `Failed to update system prompt${error.platform ? ` for ${error.platform}` : ''}. Please try again.`;
      default:
        return error.message || `An error occurred in ${context}. Please try again.`;
    }
  }

  // Use translation function for localized messages
  if (error.statusCode && (error.statusCode === 401 || error.statusCode === 403)) {
    return t('traffic-information:errors.authentication');
  }
  
  if (error.statusCode && error.statusCode === 429) {
    return t('traffic-information:errors.tooManyRequests');
  }
  
  if (error.statusCode && error.statusCode >= 500) {
    return t('traffic-information:errors.serverError');
  }
  
  switch (error.code) {
    case 'STREAM_CONNECTION_ERROR':
    case 'REGENERATE_STREAM_CONNECTION_ERROR':
      return t('traffic-information:errors.connectionLost');
    case 'STREAM_PARSE_ERROR':
    case 'REGENERATE_STREAM_PARSE_ERROR':
      return t('traffic-information:errors.processingError');
    case 'FETCH_SYSTEM_PROMPTS_ERROR':
      return t('traffic-information:errors.loadSystemPrompts');
    case 'UPDATE_SYSTEM_PROMPT_ERROR':
      return t('traffic-information:errors.updateSystemPrompt', { 
        platform: error.platform ? ` for ${error.platform}` : '' 
      });
    default:
      return error.message || t('traffic-information:errors.generic', { context });
  }
};
