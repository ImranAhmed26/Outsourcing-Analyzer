'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { UploadedFile } from '@/types/enrichment';

interface EmailInputFormProps {
  onSubmit: (emails: string[]) => void;
  isLoading: boolean;
}

export function EmailInputForm({ onSubmit, isLoading }: EmailInputFormProps) {
  const [emailText, setEmailText] = useState('');
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [inputMethod, setInputMethod] = useState<'manual' | 'upload'>('manual');
  const [dragOver, setDragOver] = useState(false);

  const parseEmailsFromText = (text: string): string[] => {
    // Extract emails using regex
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const matches = text.match(emailRegex) || [];
    
    // Remove duplicates and filter valid emails
    const uniqueEmails = Array.from(new Set(matches))
      .filter(email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      .slice(0, 50); // Limit to 50 emails
    
    return uniqueEmails;
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const emails = parseEmailsFromText(content);
      
      setUploadedFile({
        name: file.name,
        content,
        emails
      });
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const file = files.find(f => 
      f.type === 'text/csv' || 
      f.type === 'text/plain' || 
      f.name.endsWith('.csv') || 
      f.name.endsWith('.txt')
    );
    
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let emails: string[] = [];
    
    if (inputMethod === 'manual') {
      emails = parseEmailsFromText(emailText);
    } else if (uploadedFile) {
      emails = uploadedFile.emails;
    }
    
    if (emails.length === 0) {
      alert('Please enter at least one valid email address');
      return;
    }
    
    onSubmit(emails);
  };

  const manualEmails = parseEmailsFromText(emailText);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Enter Email Addresses
        </h2>
        
        {/* Input Method Toggle */}
        <div className="flex space-x-4 mb-6">
          <button
            type="button"
            onClick={() => setInputMethod('manual')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              inputMethod === 'manual'
                ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                : 'bg-gray-100 text-gray-700 border-2 border-gray-200 hover:bg-gray-200'
            }`}
          >
            Manual Entry
          </button>
          <button
            type="button"
            onClick={() => setInputMethod('upload')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              inputMethod === 'upload'
                ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                : 'bg-gray-100 text-gray-700 border-2 border-gray-200 hover:bg-gray-200'
            }`}
          >
            File Upload
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {inputMethod === 'manual' ? (
            <div>
              <Label htmlFor="emails" className="text-sm font-medium text-gray-700">
                Email Addresses
              </Label>
              <p className="text-xs text-gray-500 mb-2">
                Enter email addresses separated by commas, spaces, or new lines
              </p>
              <textarea
                id="emails"
                value={emailText}
                onChange={(e) => setEmailText(e.target.value)}
                placeholder="user1@company.com, user2@company.com&#10;user3@company.com"
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
              {manualEmails.length > 0 && (
                <p className="text-sm text-green-600 mt-2">
                  {manualEmails.length} valid email{manualEmails.length !== 1 ? 's' : ''} detected
                </p>
              )}
            </div>
          ) : (
            <div>
              <Label className="text-sm font-medium text-gray-700">
                Upload File (CSV or TXT)
              </Label>
              <p className="text-xs text-gray-500 mb-2">
                Upload a CSV or text file containing email addresses
              </p>
              
              {/* File Drop Zone */}
              <div
                onDrop={handleDrop}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragOver
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                {uploadedFile ? (
                  <div className="space-y-2">
                    <div className="text-green-600">
                      <svg className="mx-auto h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-gray-900">{uploadedFile.name}</p>
                    <p className="text-sm text-green-600">
                      {uploadedFile.emails.length} email{uploadedFile.emails.length !== 1 ? 's' : ''} found
                    </p>
                    <button
                      type="button"
                      onClick={() => setUploadedFile(null)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Remove file
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <svg className="mx-auto h-8 w-8 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div>
                      <p className="text-sm text-gray-600">
                        Drag and drop a file here, or{' '}
                        <label className="text-blue-600 hover:text-blue-800 cursor-pointer">
                          browse
                          <input
                            type="file"
                            className="hidden"
                            accept=".csv,.txt"
                            onChange={handleFileInput}
                          />
                        </label>
                      </p>
                      <p className="text-xs text-gray-500">CSV or TXT files only</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-4">
            <div className="text-sm text-gray-500">
              {inputMethod === 'manual' 
                ? `${manualEmails.length}/50 emails` 
                : uploadedFile 
                  ? `${uploadedFile.emails.length}/50 emails`
                  : '0/50 emails'
              }
            </div>
            
            <Button
              type="submit"
              disabled={
                isLoading || 
                (inputMethod === 'manual' && manualEmails.length === 0) ||
                (inputMethod === 'upload' && !uploadedFile)
              }
              className="px-6 py-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                'Start Enrichment'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
