

import React, { useState } from 'react';
import { Institution } from '../../types';

interface EditInstitutionModalProps {
  institution: Institution;
  onClose: () => void;
  onSave: (updatedData: Partial<Institution>) => void;
}

const EditInstitutionModal: React.FC<EditInstitutionModalProps> = ({ institution, onClose, onSave }) => {
  const [name, setName] = useState(institution.name);
  const [logo, setLogo] = useState(institution.logo || '');
  const [type, setType] = useState(institution.type || '');
  const [staffName, setStaffName] = useState(institution.staffName || '');
  const [phone, setPhone] = useState(institution.phone || '');
  const [location, setLocation] = useState(institution.location || '');
  const [handbookEnabled, setHandbookEnabled] = useState(institution.handbookGenerationEnabled || false);

  const handleSave = () => {
    onSave({ name, logo, type, staffName, phone, location, handbookGenerationEnabled: handbookEnabled });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative mx-auto p-5 border border-slate-700 w-full max-w-md shadow-lg rounded-md bg-slate-800">
        <div className="mt-3 text-center">
          <h3 className="text-lg leading-6 font-medium text-amber-400">Edit Institution</h3>
          <div className="mt-2 px-7 py-3 space-y-4 text-left">
            <div>
              <label className="block text-sm font-medium text-slate-300">Institution Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full border border-slate-600 bg-slate-700 rounded-md shadow-sm py-2 px-3 text-amber-50 focus:ring-amber-500 focus:border-amber-500 sm:text-sm" />
            </div>
             <div>
              <label className="block text-sm font-medium text-slate-300">Institution Type</label>
              <input type="text" value={type} onChange={(e) => setType(e.target.value)} className="mt-1 block w-full border border-slate-600 bg-slate-700 rounded-md shadow-sm py-2 px-3 text-amber-50 focus:ring-amber-500 focus:border-amber-500 sm:text-sm" />
            </div>
             <div>
              <label className="block text-sm font-medium text-slate-300">Responsible Staff Name</label>
              <input type="text" value={staffName} onChange={(e) => setStaffName(e.target.value)} className="mt-1 block w-full border border-slate-600 bg-slate-700 rounded-md shadow-sm py-2 px-3 text-amber-50 focus:ring-amber-500 focus:border-amber-500 sm:text-sm" />
            </div>
             <div>
              <label className="block text-sm font-medium text-slate-300">Phone Number</label>
              <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 block w-full border border-slate-600 bg-slate-700 rounded-md shadow-sm py-2 px-3 text-amber-50 focus:ring-amber-500 focus:border-amber-500 sm:text-sm" />
            </div>
             <div>
              <label className="block text-sm font-medium text-slate-300">Location / City</label>
              <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className="mt-1 block w-full border border-slate-600 bg-slate-700 rounded-md shadow-sm py-2 px-3 text-amber-50 focus:ring-amber-500 focus:border-amber-500 sm:text-sm" />
            </div>
             <div>
              <label className="block text-sm font-medium text-slate-300">Logo URL (Optional)</label>
              <input type="text" value={logo} onChange={(e) => setLogo(e.target.value)} className="mt-1 block w-full border border-slate-600 bg-slate-700 rounded-md shadow-sm py-2 px-3 text-amber-50 focus:ring-amber-500 focus:border-amber-500 sm:text-sm" placeholder="https://example.com/logo.png" />
            </div>
            <div className="border-t border-slate-700 pt-4">
                <label className="flex items-center">
                    <input
                        type="checkbox"
                        checked={handbookEnabled}
                        onChange={(e) => setHandbookEnabled(e.target.checked)}
                        className="h-4 w-4 text-amber-600 border-slate-500 rounded focus:ring-amber-500 bg-slate-700"
                    />
                    <span className="ml-2 text-sm text-slate-300">Enable Handbook Generation Feature</span>
                </label>
            </div>
          </div>
          <div className="items-center px-4 py-3 space-x-2">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-amber-500 text-slate-900 text-base font-medium rounded-md w-auto shadow-sm hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-amber-500"
            >
              Save Changes
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-600 text-slate-200 text-base font-medium rounded-md w-auto shadow-sm hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-slate-400"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditInstitutionModal;