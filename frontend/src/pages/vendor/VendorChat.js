import React from 'react';
import { MessageCircle } from 'lucide-react';

const VendorChat = () => {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Chat</h1>
        <p className="text-gray-600">Message customers and NGOs</p>
      </div>

      <div className="card">
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Vendor Chat Page</h3>
          <p className="text-gray-500">This page will show your conversations with customers and NGOs.</p>
        </div>
      </div>
    </div>
  );
};

export default VendorChat;
