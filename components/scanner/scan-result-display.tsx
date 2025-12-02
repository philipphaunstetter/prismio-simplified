'use client';

import { useState } from 'react';
import { 
  Clipboard,
  Phone,
  Mail,
  MapPin,
  Check,
  User,
  Building,
  Globe
} from 'lucide-react';
import { ParsedContent, VCardContact } from '@/lib/scan-content-utils';
import { Switch } from '@/components/catalyst/switch';

interface ScanResultDisplayProps {
  result: ParsedContent;
  onReset: () => void;
  hideResetButton?: boolean;
}

export default function ScanResultDisplay({ result, onReset, hideResetButton = false }: ScanResultDisplayProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isCompactMode, setIsCompactMode] = useState(true);

  const handleCopy = async (value: string, fieldId: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(fieldId);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      vcard: 'Contact Information',
      url: 'Website',
      email: 'Email Address',
      phone: 'Phone Number',
      wifi: 'WiFi Network',
      location: 'Location',
      sms: 'SMS Message',
      text: 'Text Content'
    };
    return labels[type] || 'Content';
  };

  const getFieldCount = (contact: VCardContact) => {
    let count = 0;
    if (contact.name?.formatted) count++;
    if (contact.organization?.title) count++;
    if (contact.organization?.name) count++;
    if (contact.emails) count += contact.emails.length;
    if (contact.phones) count += contact.phones.length;
    if (contact.urls) count += contact.urls.length;
    if (contact.addresses) count += contact.addresses.length;
    return count;
  };

  const renderFieldCard = (
    icon: React.ReactNode,
    label: string,
    value: string,
    fieldId: string,
    subtitle?: string
  ) => {
    const isCopied = copiedField === fieldId;
    
    return (
      <div key={fieldId} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1 min-w-0">
            <div className="flex-shrink-0 mt-0.5">
              {icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900">
                {label}
              </div>
              <div className="text-sm text-gray-600 mt-1 break-all">
                {value}
              </div>
              {subtitle && (
                <div className="text-xs text-gray-500 mt-1">
                  {subtitle}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => handleCopy(value, fieldId)}
            className="flex-shrink-0 p-1.5 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            aria-label={`Copy ${label}`}
          >
            {isCopied ? (
              <Check strokeWidth={1.25} className="h-4 w-4 text-green-600" />
            ) : (
              <Clipboard strokeWidth={1.25} className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    );
  };

  const renderVCardContent = () => {
    if (result.type !== 'vcard') return null;
    
    const contact = result.data as VCardContact;

    if (isCompactMode) {
      // Compact view - show grouped personal and company information
      const personalInfo = [];
      const companyInfo = [];
      
      // Personal Information
      if (contact.name?.formatted || (contact.name?.given && contact.name?.family)) {
        const name = contact.name.formatted || `${contact.name.given} ${contact.name.family}`;
        personalInfo.push(name);
      }
      
      if (contact.organization?.title) {
        personalInfo.push(contact.organization.title);
      }
      
      if (contact.emails && contact.emails.length > 0) {
        contact.emails.forEach(email => {
          personalInfo.push(email.value);
        });
      }
      
      if (contact.phones && contact.phones.length > 0) {
        contact.phones.forEach(phone => {
          personalInfo.push(phone.value);
        });
      }
      
      // Company Information
      if (contact.organization?.name) {
        companyInfo.push(contact.organization.name);
      }
      
      if (contact.addresses && contact.addresses.length > 0) {
        contact.addresses.forEach(address => {
          if (address.formatted) {
            const addressLines = address.formatted.split(', ');
            addressLines.forEach(line => companyInfo.push(line));
          }
        });
      }
      
      if (contact.urls && contact.urls.length > 0) {
        contact.urls.forEach(url => {
          companyInfo.push(url.value);
        });
      }

      const formattedContent = [
        personalInfo.join('\n'),
        companyInfo.join('\n')
      ].filter(section => section.trim().length > 0).join('\n\n');

      const isCopied = copiedField === 'compact-content';

      return (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex justify-between items-start">
            <div className="flex-1 mr-4">
              {/* Personal Section */}
              {personalInfo.length > 0 && (
                <div className="mb-4">
                  <div className="text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">
                    Personal
                  </div>
                  <div className="space-y-1">
                    {personalInfo.map((info, index) => (
                      <div 
                        key={`personal-${index}`}
                        className={`text-sm ${index === 0 ? 'font-semibold text-gray-900' : 'text-gray-700'}`}
                      >
                        {info}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Company Section */}
              {companyInfo.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">
                    Company
                  </div>
                  <div className="space-y-1">
                    {companyInfo.map((info, index) => (
                      <div 
                        key={`company-${index}`}
                        className={`text-sm ${index === 0 ? 'font-semibold text-gray-900' : 'text-gray-700'}`}
                      >
                        {info}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <button
              onClick={() => handleCopy(formattedContent, 'compact-content')}
              className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              aria-label="Copy all contact information"
            >
              {isCopied ? (
                <Check strokeWidth={1.25} className="h-5 w-5 text-green-600" />
              ) : (
                <Clipboard strokeWidth={1.25} className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      );
    }

    // Single view - individual field cards
    const fields = [];

    if (contact.name?.formatted) {
      fields.push(renderFieldCard(
        <User strokeWidth={1.25} className="h-4 w-4 text-gray-500" />,
        'Full Name',
        contact.name.formatted,
        'name'
      ));
    }

    if (contact.organization?.title) {
      fields.push(renderFieldCard(
        <Building strokeWidth={1.25} className="h-4 w-4 text-gray-500" />,
        'Title',
        contact.organization.title,
        'title'
      ));
    }

    if (contact.organization?.name) {
      fields.push(renderFieldCard(
        <Building strokeWidth={1.25} className="h-4 w-4 text-gray-500" />,
        'Organization',
        contact.organization.name,
        'organization'
      ));
    }

    if (contact.emails && contact.emails.length > 0) {
      contact.emails.forEach((email, index) => {
        fields.push(renderFieldCard(
          <Mail strokeWidth={1.25} className="h-4 w-4 text-gray-500" />,
          'Email',
          email.value,
          `email-${index}`,
          `(${email.type})`
        ));
      });
    }

    if (contact.phones && contact.phones.length > 0) {
      contact.phones.forEach((phone, index) => {
        fields.push(renderFieldCard(
          <Phone strokeWidth={1.25} className="h-4 w-4 text-gray-500" />,
          'Phone',
          phone.value,
          `phone-${index}`
        ));
      });
    }

    if (contact.urls && contact.urls.length > 0) {
      contact.urls.forEach((url, index) => {
        fields.push(renderFieldCard(
          <Globe strokeWidth={1.25} className="h-4 w-4 text-gray-500" />,
          'Website',
          url.value,
          `url-${index}`
        ));
      });
    }

    if (contact.addresses && contact.addresses.length > 0) {
      contact.addresses.forEach((address, index) => {
        if (address.formatted) {
          fields.push(renderFieldCard(
            <MapPin strokeWidth={1.25} className="h-4 w-4 text-gray-500" />,
            'Address',
            address.formatted,
            `address-${index}`,
            `(${address.type})`
          ));
        }
      });
    }

    // Additional Information section for unmapped fields
    const additionalFields: React.ReactNode[] = [];
    if (contact.unmappedFields && Object.keys(contact.unmappedFields).length > 0) {
      Object.entries(contact.unmappedFields).forEach(([key, value], index) => {
        additionalFields.push(renderFieldCard(
          <Clipboard strokeWidth={1.25} className="h-4 w-4 text-gray-500" />,
          key.toUpperCase(),
          value,
          `additional-${index}`
        ));
      });
    }

    return (
      <div className="space-y-3">
        {fields}
        {additionalFields.length > 0 && (
          <>
            <div className="pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                Additional Information
              </h4>
              <div className="space-y-3">
                {additionalFields}
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto" role="region" aria-label="QR Code scan results">
      {/* Main Content Card */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <User strokeWidth={1.25} className="h-5 w-5 text-blue-600" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  QR Code Content
                </h3>
                <p className="text-sm text-gray-600">
                  {getTypeLabel(result.type)}
                  {result.type === 'vcard' && (
                    <span className="ml-2 text-blue-600 font-medium">
                      {getFieldCount(result.data as VCardContact)} fields
                    </span>
                  )}
                </p>
              </div>
            </div>
            
            {/* View Mode Toggle for vCard */}
            {result.type === 'vcard' && (
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-700">
                  Single
                </span>
                <Switch
                  checked={isCompactMode}
                  onChange={setIsCompactMode}
                  color="blue"
                  aria-label="Toggle between Single and Compact view"
                />
                <span className="text-sm font-medium text-gray-700">
                  Compact
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {result.type === 'vcard' ? (
            renderVCardContent()
          ) : (
            <div className="bg-gray-50 rounded-lg p-4">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {result.displayText}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
