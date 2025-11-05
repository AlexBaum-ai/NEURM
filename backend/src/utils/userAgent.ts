import UAParser from 'ua-parser-js';

export interface ParsedUserAgent {
  device: string;
  browser: string;
  os: string;
  platform: string;
}

/**
 * Parse user-agent string to extract device, browser, and OS information
 */
export function parseUserAgent(userAgent: string | undefined): ParsedUserAgent {
  if (!userAgent) {
    return {
      device: 'Unknown Device',
      browser: 'Unknown Browser',
      os: 'Unknown OS',
      platform: 'Unknown',
    };
  }

  const parser = new (UAParser as any)(userAgent);
  const result = parser.getResult();

  // Determine device type
  let device = 'Desktop';
  if (result.device.type === 'mobile') {
    device = 'Mobile';
  } else if (result.device.type === 'tablet') {
    device = 'Tablet';
  } else if (result.device.type === 'smarttv') {
    device = 'Smart TV';
  } else if (result.device.type === 'wearable') {
    device = 'Wearable';
  } else if (result.device.type === 'console') {
    device = 'Gaming Console';
  }

  // Add vendor and model if available
  if (result.device.vendor || result.device.model) {
    const parts = [result.device.vendor, result.device.model].filter(Boolean);
    if (parts.length > 0) {
      device = `${device} (${parts.join(' ')})`;
    }
  }

  // Browser info
  const browser = result.browser.name
    ? `${result.browser.name}${result.browser.version ? ` ${result.browser.version}` : ''}`
    : 'Unknown Browser';

  // OS info
  const os = result.os.name
    ? `${result.os.name}${result.os.version ? ` ${result.os.version}` : ''}`
    : 'Unknown OS';

  // Platform (CPU architecture)
  const platform = result.cpu.architecture || 'Unknown';

  return {
    device,
    browser,
    os,
    platform,
  };
}

/**
 * Get a short device description for display
 */
export function getDeviceDescription(userAgent: string | undefined): string {
  const parsed = parseUserAgent(userAgent);
  return `${parsed.device} - ${parsed.browser}`;
}
