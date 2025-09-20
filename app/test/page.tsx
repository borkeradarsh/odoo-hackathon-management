'use client';

export default function TestPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Page - No Auth Required</h1>
      <p>This page should load without any authentication.</p>
      <p>If you can see this, the Next.js app is working fine.</p>
      
      <div className="mt-4 space-y-2">
        <div>Current URL: {typeof window !== 'undefined' ? window.location.href : 'Loading...'}</div>
        <div>Timestamp: {new Date().toISOString()}</div>
      </div>
      
      <div className="mt-4">
        <a href="/dashboard" className="bg-blue-500 text-white px-4 py-2 rounded mr-2">
          Try Dashboard
        </a>
        <a href="/auth/login" className="bg-green-500 text-white px-4 py-2 rounded">
          Try Login
        </a>
      </div>
    </div>
  );
}