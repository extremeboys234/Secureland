import React from 'react';
import {
  Home,
  MapPin,
  Shield,
  Activity,
  Download
} from 'lucide-react';
import Button from '../components/Button';

const PropertyDetails: React.FC = () => {
  // Mock property data
  const property = {
    id: 'PROP_789',
    address: '123 Main Street, Springfield, IL 62701',
    type: 'Residential Single Family',
    owner: 'John Doe',
    parcelNumber: 'PARC-2026-78901',
    legalDescription: 'Lot 15, Block 3, Maplewood Subdivision',
    purchaseDate: '2020-05-15',
    purchasePrice: '$350,000',
    currentAssessment: '$425,000',
    propertyTaxes: '$4,200/year',
    securityChecks: [
      { label: 'Ownership Verification', status: 'verified' },
      { label: 'Lien Check', status: 'verified' },
      { label: 'Tax Status', status: 'verified' },
      { label: 'Zoning Compliance', status: 'verified' },
      { label: 'Survey Verification', status: 'verified' },
    ],
    status: 'CLEAR TITLE'
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Property Details</h1>
          <p className="text-gray-600 mt-2">
            View detailed information and verification status of your property.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
            {/* Property Preview */}
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-center justify-center h-48">
                  <Home className="h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">{property.address.split(',')[0]}</p>
                </div>
              </div>

              <div className="space-y-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    // View property on map
                    alert('Opening property location on map...');
                  }}
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  View on Map
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    // Download property report
                    alert('Downloading property report...');
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Report
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    // Verify again
                    alert('Re-verifying property details...');
                  }}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Verify Again
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    // View transaction history
                    alert('Viewing transaction history...');
                  }}
                >
                  <Activity className="h-4 w-4 mr-2" />
                  Transaction History
                </Button>
              </div>
            </div>

            {/* Property Information Card */}
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">Property Information</h3>
                <dl className="grid grid-cols-1 gap-4 text-sm">
                  <div>
                    <dt className="text-gray-500">Property ID</dt>
                    <dd className="text-gray-800 font-mono">{property.id}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Property Type</dt>
                    <dd className="text-gray-800">{property.type}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Owner</dt>
                    <dd className="text-gray-800">{property.owner}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Parcel Number</dt>
                    <dd className="text-gray-800">{property.parcelNumber}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Legal Description</dt>
                    <dd className="text-gray-800">{property.legalDescription}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Purchase Date</dt>
                    <dd className="text-gray-800">{property.purchaseDate}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Purchase Price</dt>
                    <dd className="text-gray-800 font-medium">{property.purchasePrice}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Current Assessment</dt>
                    <dd className="text-gray-800 font-medium">{property.currentAssessment}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Property Taxes</dt>
                    <dd className="text-gray-800">{property.propertyTaxes}</dd>
                  </div>
                </dl>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">Title Verification</h3>
                <div className="space-y-3">
                  {property.securityChecks.map((check, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      {check.status === 'verified' ? (
                        <Shield className="h-4 w-4 mt-1 text-green-500 flex-shrink-0" />
                      ) : (
                        <Activity className="h-4 w-4 mt-1 text-red-500 flex-shrink-0" />
                      )}
                      <div>
                        <p className="font-medium text-gray-800">{check.label}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-3">
                    <Shield className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">Title Status</p>
                      <p className="text-lg font-bold text-green-600">{property.status}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Location Map Preview */}
        <div className="mt-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center space-x-4">
              <MapPin className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-gray-500">Property Location</p>
                <p className="text-gray-800 font-mono">{property.address}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetails;