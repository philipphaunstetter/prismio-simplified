export type ContentType = 
  | 'vcard' 
  | 'url' 
  | 'email' 
  | 'phone' 
  | 'wifi' 
  | 'location' 
  | 'sms' 
  | 'text' 
  | 'empty';

export interface ParsedContent {
  type: ContentType;
  data: any;
  displayText: string;
  actions: ContentAction[];
}

export interface ContentAction {
  type: 'copy' | 'call' | 'email' | 'open' | 'sms' | 'navigate';
  label: string;
  value: string;
  icon?: string;
}

export interface VCardContact {
  name?: {
    formatted?: string;
    given?: string;
    family?: string;
    prefix?: string;
    suffix?: string;
  };
  emails?: Array<{
    type: string;
    value: string;
  }>;
  phones?: Array<{
    type: string;
    value: string;
  }>;
  organization?: {
    name?: string;
    title?: string;
  };
  addresses?: Array<{
    type: string;
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
    formatted?: string;
  }>;
  urls?: Array<{
    type: string;
    value: string;
  }>;
  notes?: string;
  unmappedFields: Record<string, string>;
}

export function detectContentType(content: string): ContentType {
  if (!content || content.trim() === '') {
    return 'empty';
  }

  content = content.trim();

  // vCard detection
  if (content.startsWith('BEGIN:VCARD') && content.includes('END:VCARD')) {
    return 'vcard';
  }

  // WiFi network detection
  if (content.startsWith('WIFI:')) {
    return 'wifi';
  }

  // SMS detection
  if (content.startsWith('SMSTO:') || content.startsWith('sms:')) {
    return 'sms';
  }

  // Phone detection
  const phonePattern = /^(\+?[\d\s\-\(\)]{10,})$/;
  if (phonePattern.test(content) || content.startsWith('tel:')) {
    return 'phone';
  }

  // Email detection
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (emailPattern.test(content) || content.startsWith('mailto:')) {
    return 'email';
  }

  // Location/GPS detection
  const geoPattern = /^geo:-?\d+\.?\d*,-?\d+\.?\d*/;
  if (geoPattern.test(content)) {
    return 'location';
  }

  // URL detection
  try {
    new URL(content);
    return 'url';
  } catch {
    // Check for common URL patterns without protocol
    const urlPattern = /^(www\.)?[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.[a-zA-Z]{2,}/;
    if (urlPattern.test(content)) {
      return 'url';
    }
  }

  return 'text';
}

export function parseVCard(vcardString: string): VCardContact {
  const contact: VCardContact = {
    unmappedFields: {}
  };

  const lines = vcardString
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0);

  for (const line of lines) {
    if (line.startsWith('BEGIN:') || line.startsWith('END:') || line.startsWith('VERSION:')) {
      continue;
    }

    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    const fieldPart = line.substring(0, colonIndex);
    const value = line.substring(colonIndex + 1);

    const [field, ...params] = fieldPart.split(';');
    const typeParam = params.find(p => p.startsWith('TYPE='))?.replace('TYPE=', '') || 'default';

    switch (field.toUpperCase()) {
      case 'FN':
        contact.name = { ...contact.name, formatted: value };
        break;
      
      case 'N':
        const [family, given, , prefix, suffix] = value.split(';');
        contact.name = {
          ...contact.name,
          family: family || undefined,
          given: given || undefined,
          prefix: prefix || undefined,
          suffix: suffix || undefined
        };
        break;
      
      case 'EMAIL':
        if (!contact.emails) contact.emails = [];
        contact.emails.push({
          type: typeParam.toLowerCase(),
          value: value
        });
        break;
      
      case 'TEL':
        if (!contact.phones) contact.phones = [];
        
        // Clean up phone types - prioritize mobile types, then work, then remove redundant types
        let cleanType = 'phone';
        if (typeParam) {
          const types = typeParam.toLowerCase();
          if (types.includes('cell') || types.includes('mobile')) {
            cleanType = 'mobile';
          } else if (types.includes('work')) {
            cleanType = 'work';
          } else if (types.includes('home')) {
            cleanType = 'home';
          } else if (types.includes('fax')) {
            cleanType = 'fax';
          } else {
            // Take the first type if none of the above
            cleanType = types.split(',')[0].trim();
          }
        }
        
        contact.phones.push({
          type: cleanType,
          value: value
        });
        break;
      
      case 'ORG':
        contact.organization = { ...contact.organization, name: value };
        break;
      
      case 'TITLE':
        contact.organization = { ...contact.organization, title: value };
        break;
      
      case 'ADR':
        const [, , street, city, state, zip, country] = value.split(';');
        if (!contact.addresses) contact.addresses = [];
        
        // Combine postal code and city on same line
        const addressParts = [];
        if (street) addressParts.push(street);
        
        // Combine zip and city on one line
        const cityZipLine = [];
        if (zip) cityZipLine.push(zip);
        if (city) cityZipLine.push(city);
        if (cityZipLine.length > 0) {
          addressParts.push(cityZipLine.join(' '));
        }
        
        if (state) addressParts.push(state);
        if (country) addressParts.push(country);
        
        contact.addresses.push({
          type: typeParam.toLowerCase(),
          street: street || undefined,
          city: city || undefined,
          state: state || undefined,
          zip: zip || undefined,
          country: country || undefined,
          formatted: addressParts.filter(Boolean).join(', ') || undefined
        });
        break;
      
      case 'URL':
        if (!contact.urls) contact.urls = [];
        contact.urls.push({
          type: typeParam.toLowerCase(),
          value: value
        });
        break;
      
      case 'NOTE':
        contact.notes = value;
        break;
      
      default:
        contact.unmappedFields[field.toLowerCase()] = value;
    }
  }

  return contact;
}

export function parseContent(content: string): ParsedContent {
  const type = detectContentType(content);
  
  switch (type) {
    case 'empty':
      return {
        type,
        data: null,
        displayText: 'No content found',
        actions: []
      };

    case 'vcard':
      const contact = parseVCard(content);
      const displayName = contact.name?.formatted || 
        (contact.name?.given && contact.name?.family 
          ? `${contact.name.given} ${contact.name.family}`
          : 'Contact');
      
      const actions: ContentAction[] = [];
      
      if (contact.phones && contact.phones.length > 0) {
        // Add call actions for all phone numbers
        contact.phones.forEach((phone, index) => {
          const typeLabel = phone.type && phone.type !== 'phone' ? ` (${phone.type})` : '';
          actions.push({
            type: 'call',
            label: `Call ${phone.value}${typeLabel}`,
            value: phone.value,
            icon: 'phone'
          });
        });
      }
      
      if (contact.emails && contact.emails.length > 0) {
        actions.push({
          type: 'email',
          label: `Email ${contact.emails[0].value}`,
          value: contact.emails[0].value,
          icon: 'envelope'
        });
      }

      actions.push({
        type: 'copy',
        label: 'Copy vCard',
        value: content,
        icon: 'clipboard'
      });

      return {
        type,
        data: contact,
        displayText: displayName,
        actions
      };

    case 'url':
      let processedUrl = content;
      if (!content.startsWith('http://') && !content.startsWith('https://')) {
        processedUrl = `https://${content}`;
      }
      
      return {
        type,
        data: { url: processedUrl, original: content },
        displayText: content,
        actions: [
          {
            type: 'open',
            label: 'Open Website',
            value: processedUrl,
            icon: 'external-link'
          },
          {
            type: 'copy',
            label: 'Copy URL',
            value: content,
            icon: 'clipboard'
          }
        ]
      };

    case 'email':
      const emailAddress = content.startsWith('mailto:') 
        ? content.substring(7) 
        : content;
      
      return {
        type,
        data: { email: emailAddress },
        displayText: emailAddress,
        actions: [
          {
            type: 'email',
            label: 'Send Email',
            value: emailAddress,
            icon: 'envelope'
          },
          {
            type: 'copy',
            label: 'Copy Email',
            value: emailAddress,
            icon: 'clipboard'
          }
        ]
      };

    case 'phone':
      const phoneNumber = content.startsWith('tel:') 
        ? content.substring(4) 
        : content;
      
      return {
        type,
        data: { phone: phoneNumber },
        displayText: phoneNumber,
        actions: [
          {
            type: 'call',
            label: 'Call Number',
            value: phoneNumber,
            icon: 'phone'
          },
          {
            type: 'sms',
            label: 'Send SMS',
            value: phoneNumber,
            icon: 'chat-bubble-left'
          },
          {
            type: 'copy',
            label: 'Copy Number',
            value: phoneNumber,
            icon: 'clipboard'
          }
        ]
      };

    case 'wifi':
      const wifiMatch = content.match(/WIFI:T:([^;]*);S:([^;]*);P:([^;]*);H:([^;]*);?/);
      if (wifiMatch) {
        const [, security, ssid, password, hidden] = wifiMatch;
        return {
          type,
          data: { security, ssid, password, hidden: hidden === 'true' },
          displayText: `WiFi: ${ssid}`,
          actions: [
            {
              type: 'copy',
              label: 'Copy WiFi Info',
              value: content,
              icon: 'clipboard'
            }
          ]
        };
      }
      break;

    case 'location':
      const geoMatch = content.match(/geo:(-?\d+\.?\d*),(-?\d+\.?\d*)/);
      if (geoMatch) {
        const [, lat, lng] = geoMatch;
        return {
          type,
          data: { latitude: parseFloat(lat), longitude: parseFloat(lng) },
          displayText: `Location: ${lat}, ${lng}`,
          actions: [
            {
              type: 'navigate',
              label: 'Open in Maps',
              value: `https://maps.google.com/maps?q=${lat},${lng}`,
              icon: 'map-pin'
            },
            {
              type: 'copy',
              label: 'Copy Coordinates',
              value: `${lat}, ${lng}`,
              icon: 'clipboard'
            }
          ]
        };
      }
      break;

    case 'sms':
      const smsMatch = content.match(/(?:SMSTO:|sms:)([^:?]*)[?:]?(.*)/);
      if (smsMatch) {
        const [, number, message] = smsMatch;
        return {
          type,
          data: { number: number.trim(), message: message || '' },
          displayText: `SMS to ${number}${message ? ': ' + message : ''}`,
          actions: [
            {
              type: 'sms',
              label: 'Send SMS',
              value: `sms:${number}${message ? `?body=${encodeURIComponent(message)}` : ''}`,
              icon: 'chat-bubble-left'
            },
            {
              type: 'copy',
              label: 'Copy Content',
              value: content,
              icon: 'clipboard'
            }
          ]
        };
      }
      break;

    case 'text':
    default:
      return {
        type: 'text',
        data: { text: content },
        displayText: content.length > 100 ? content.substring(0, 100) + '...' : content,
        actions: [
          {
            type: 'copy',
            label: 'Copy Text',
            value: content,
            icon: 'clipboard'
          }
        ]
      };
  }

  return {
    type: 'text',
    data: { text: content },
    displayText: content,
    actions: [
      {
        type: 'copy',
        label: 'Copy Text',
        value: content,
        icon: 'clipboard'
      }
    ]
  };
}

export function formatContentForDisplay(parsed: ParsedContent): string {
  switch (parsed.type) {
    case 'vcard':
      const contact = parsed.data as VCardContact;
      const parts = [];
      
      if (contact.name?.formatted || (contact.name?.given && contact.name?.family)) {
        const name = contact.name.formatted || `${contact.name.given} ${contact.name.family}`;
        parts.push(name);
      }
      
      if (contact.organization?.title) {
        parts.push(contact.organization.title);
      }
      
      if (contact.emails && contact.emails.length > 0) {
        contact.emails.forEach(email => {
          parts.push(email.value);
        });
      }
      
      if (contact.phones && contact.phones.length > 0) {
        contact.phones.forEach(phone => {
          parts.push(phone.value);
        });
      }
      
      if (contact.organization?.name) {
        parts.push(contact.organization.name);
      }
      
      if (contact.addresses && contact.addresses.length > 0) {
        contact.addresses.forEach(address => {
          if (address.formatted) {
            const addressLines = address.formatted.split(', ');
            addressLines.forEach(line => parts.push(line));
          }
        });
      }
      
      if (contact.urls && contact.urls.length > 0) {
        contact.urls.forEach(url => {
          parts.push(url.value);
        });
      }
      
      return parts.join('\n');

    case 'wifi':
      const wifi = parsed.data;
      return `WiFi Network\nSSID: ${wifi.ssid}\nSecurity: ${wifi.security}\n${wifi.hidden ? 'Hidden Network' : 'Visible Network'}`;

    case 'location':
      const location = parsed.data;
      return `GPS Location\nLatitude: ${location.latitude}\nLongitude: ${location.longitude}`;

    case 'sms':
      const sms = parsed.data;
      return `SMS Message\nTo: ${sms.number}${sms.message ? `\nMessage: ${sms.message}` : ''}`;

    case 'url':
      return parsed.data.original;

    case 'email':
      return parsed.data.email;

    case 'phone':
      return parsed.data.phone;

    case 'text':
      return parsed.data.text;

    default:
      return parsed.displayText;
  }
}