// Security configuration for API routes
// These limits protect against attacks while allowing normal functionality

export const SECURITY_CONFIG = {
  // File size limits (prevents DoS from huge uploads)
  MAX_AUDIO_FILE_SIZE: 25 * 1024 * 1024, // 25MB (most songs are 3-10MB)
  MAX_REQUEST_SIZE: 50 * 1024 * 1024, // 50MB (much larger than needed)
  
  // Timeouts (prevents hanging requests)
  API_TIMEOUT_MS: 30000, // 30 seconds (enough for AI analysis)
  
  // Rate limiting (server-side, complements client-side)
  MAX_REQUESTS_PER_MINUTE: 30, // Allows legitimate burst requests
  MAX_REQUESTS_PER_HOUR: 100, // Matches OpenRouter free tier
  
  // CORS settings
  ALLOWED_ORIGINS: process.env.NODE_ENV === 'production' 
    ? ['https://harmsub.vercel.app'] 
    : ['http://localhost:3000', 'http://localhost:3001'],
  
  // Validation patterns
  ALLOWED_AUDIO_FORMATS: ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'webm', 'aac'],
  ALLOWED_VIDEO_FORMATS: ['mp4', 'webm', 'mov'],
  
  // YouTube validation
  YOUTUBE_VIDEO_ID_LENGTH: 11,
} as const;

// In-memory rate limiter (for production, use Redis or similar)
class SimpleRateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  constructor(private maxRequests: number, private windowMs: number) {}
  
  check(identifier: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    // Get and clean old requests
    let userRequests = this.requests.get(identifier) || [];
    userRequests = userRequests.filter(timestamp => timestamp > windowStart);
    
    // Check limit
    if (userRequests.length >= this.maxRequests) {
      const oldestInWindow = Math.min(...userRequests);
      const resetTime = oldestInWindow + this.windowMs;
      
      return {
        allowed: false,
        remaining: 0,
        resetTime
      };
    }
    
    // Add new request
    userRequests.push(now);
    this.requests.set(identifier, userRequests);
    
    // Clean up old entries periodically
    if (this.requests.size > 1000) {
      this.pruneOldEntries(now - this.windowMs);
    }
    
    return {
      allowed: true,
      remaining: this.maxRequests - userRequests.length - 1,
      resetTime: now + this.windowMs
    };
  }
  
  private pruneOldEntries(cutoffTime: number): void {
    this.requests.forEach((timestamps, identifier) => {
      const filtered = timestamps.filter(t => t > cutoffTime);
      if (filtered.length === 0) {
        this.requests.delete(identifier);
      } else {
        this.requests.set(identifier, filtered);
      }
    });
  }
}

export const rateLimiter = {
  perMinute: new SimpleRateLimiter(
    SECURITY_CONFIG.MAX_REQUESTS_PER_MINUTE,
    60 * 1000 // 1 minute
  ),
  perHour: new SimpleRateLimiter(
    SECURITY_CONFIG.MAX_REQUESTS_PER_HOUR,
    60 * 60 * 1000 // 1 hour
  ),
};

// Helper to get client identifier (IP address or forwarded header)
export function getClientIdentifier(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

// Type for NextRequest
import type { NextRequest } from 'next/server';

// Magic bytes for audio file validation
const AUDIO_MAGIC_BYTES: Record<string, number[][]> = {
  mp3: [
    [0xFF, 0xFB], // MP3 frame sync
    [0xFF, 0xFA],
    [0xFF, 0xF3],
    [0xFF, 0xF2],
    [0x49, 0x44, 0x33], // ID3 tag
  ],
  wav: [[0x52, 0x49, 0x46, 0x46]], // "RIFF"
  ogg: [[0x4F, 0x67, 0x67, 0x53]], // "OggS"
  flac: [[0x66, 0x4C, 0x61, 0x43]], // "fLaC"
  m4a: [[0x00, 0x00, 0x00], [0x66, 0x74, 0x79, 0x70]], // ftyp (offset varies)
  aac: [[0xFF, 0xF1], [0xFF, 0xF9]], // ADTS sync
  webm: [[0x1A, 0x45, 0xDF, 0xA3]], // EBML header
};

/**
 * Validates audio file content by checking magic bytes
 * Returns true if the file appears to be a valid audio file
 */
export function validateAudioMagicBytes(base64Data: string, declaredFormat: string): { valid: boolean; detectedFormat?: string; error?: string } {
  try {
    // Decode first 16 bytes of base64 data
    const binaryStr = atob(base64Data.slice(0, 24)); // 24 base64 chars = 18 bytes
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    // Check against known magic bytes
    for (const [format, signatures] of Object.entries(AUDIO_MAGIC_BYTES)) {
      for (const signature of signatures) {
        let matches = true;
        for (let i = 0; i < signature.length; i++) {
          if (bytes[i] !== signature[i]) {
            matches = false;
            break;
          }
        }
        if (matches) {
          // For m4a, also check for 'ftyp' at offset 4
          if (format === 'm4a') {
            const ftypCheck = bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70;
            if (!ftypCheck) continue;
          }
          
          return { valid: true, detectedFormat: format };
        }
      }
    }

    // Special case: check for MP3 ID3 tag anywhere in first bytes
    for (let i = 0; i < bytes.length - 2; i++) {
      if (bytes[i] === 0x49 && bytes[i + 1] === 0x44 && bytes[i + 2] === 0x33) {
        return { valid: true, detectedFormat: 'mp3' };
      }
    }

    return { 
      valid: false, 
      error: 'File content does not match any known audio format. Possible file corruption or spoofed extension.' 
    };
  } catch (e) {
    return { valid: false, error: 'Failed to validate file content' };
  }
}
