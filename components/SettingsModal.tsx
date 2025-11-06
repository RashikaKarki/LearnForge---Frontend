import React, { useState, useEffect } from 'react';
import { GearIcon } from './icons/GearIcon';
import { useAuth } from '../contexts/AuthContext';
import { useApiClient } from '../utils/api';
import { useFlashError } from '../contexts/FlashErrorContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LEARNING_STYLE_OPTIONS = [
  'examples',
  'metaphors',
  'videos',
  'step-by-step',
  'analogies',
];

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { userProfile, fetchUserProfile } = useAuth();
  const apiClient = useApiClient();
  const { showSuccess, showError } = useFlashError();
  
  const [name, setName] = useState('');
  const [learningStyle, setLearningStyle] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form with current user data
  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name || '');
      setLearningStyle(userProfile.learning_style || []);
    }
  }, [userProfile, isOpen]);

  const handleLearningStyleToggle = (style: string) => {
    setLearningStyle(prev => 
      prev.includes(style)
        ? prev.filter(s => s !== style)
        : [...prev, style]
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showError('Name cannot be empty');
      return;
    }

    setIsSaving(true);
    try {
      const updateData: { name?: string; learning_style?: string[] } = {};
      
      // Only include fields that have changed
      if (name !== userProfile?.name) {
        updateData.name = name.trim();
      }
      
      if (JSON.stringify(learningStyle.sort()) !== JSON.stringify((userProfile?.learning_style || []).sort())) {
        updateData.learning_style = learningStyle;
      }

      // Only make API call if there are changes
      if (Object.keys(updateData).length > 0) {
        const response = await apiClient.updateUser(updateData);
        
        if (response.error) {
          showError(response.error);
        } else {
          showSuccess('Settings updated successfully');
          await fetchUserProfile();
          onClose();
        }
      } else {
        // No changes, just close
        onClose();
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    // Reset form to original values
    if (userProfile) {
      setName(userProfile.name || '');
      setLearningStyle(userProfile.learning_style || []);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-soft-gray p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-sky-blue/10 rounded-lg">
                <GearIcon className="h-6 w-6 text-sky-blue" strokeWidth={2} />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-deep-navy">Settings</h2>
                <p className="text-gray-600 mt-1 text-base font-regular">Update your profile and preferences</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Name Input */}
          <div>
            <label htmlFor="name" className="block text-base font-semibold text-deep-navy mb-2">
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-soft-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-blue focus:border-transparent text-base font-regular text-deep-navy"
              placeholder="Enter your name"
            />
          </div>

          {/* Learning Style Selection */}
          <div>
            <label className="block text-base font-semibold text-deep-navy mb-3">
              Learning Style Preferences
            </label>
            <p className="text-sm text-gray-600 mb-4 font-regular">
              Select the learning styles that work best for you. You can choose multiple options.
            </p>
            <div className="space-y-3">
              {LEARNING_STYLE_OPTIONS.map((style) => {
                const isSelected = learningStyle.includes(style);
                const displayName = style
                  .split('-')
                  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(' ');
                
                return (
                  <label
                    key={style}
                    className={`flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-sky-blue bg-sky-blue/10'
                        : 'border-soft-gray hover:border-sky-blue/50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleLearningStyleToggle(style)}
                      className="w-5 h-5 text-sky-blue border-soft-gray rounded focus:ring-2 focus:ring-sky-blue"
                    />
                    <span className="text-base font-regular text-deep-navy flex-1">
                      {displayName}
                    </span>
                    {isSelected && (
                      <svg className="w-5 h-5 text-sky-blue" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </label>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-soft-gray">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 flex items-center justify-center px-6 py-4 bg-coral text-white font-semibold rounded-lg shadow-md hover:bg-coral/90 transition-colors duration-300 transform hover:scale-105 text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
            <button
              onClick={handleClose}
              className="flex-1 px-6 py-4 border border-soft-gray text-deep-navy font-semibold rounded-lg hover:bg-soft-gray transition-colors duration-300 text-base"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

