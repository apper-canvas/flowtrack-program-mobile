import React, { useState, useEffect, useRef, useMemo } from 'react';

const ApperFileFieldComponent = ({ elementId, config }) => {
  // State for UI-driven values
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);

  // Refs for tracking lifecycle and preventing memory leaks
  const mountedRef = useRef(false);
  const elementIdRef = useRef(elementId);
  const existingFilesRef = useRef([]);

  // Update elementIdRef when elementId changes
  useEffect(() => {
    elementIdRef.current = elementId;
  }, [elementId]);

  // Memoize existingFiles to prevent unnecessary re-renders
  const existingFiles = useMemo(() => {
    if (!config.existingFiles || !Array.isArray(config.existingFiles)) {
      return [];
    }
    
    // Compare with previous files to detect actual changes
    const currentFiles = config.existingFiles;
    const prevFiles = existingFilesRef.current;
    
    // Check if files have actually changed
    if (currentFiles.length !== prevFiles.length) {
      return currentFiles;
    }
    
    // Compare first file's ID/id to detect different files
    if (currentFiles.length > 0 && prevFiles.length > 0) {
      const currentFirstId = currentFiles[0].Id || currentFiles[0].id;
      const prevFirstId = prevFiles[0].Id || prevFiles[0].id;
      if (currentFirstId !== prevFirstId) {
        return currentFiles;
      }
    }
    
    return prevFiles;
  }, [config.existingFiles]);

  // Initial Mount Effect
  useEffect(() => {
    let isMounted = true;
    
    const initializeApperSDK = async () => {
      try {
        // Wait for ApperSDK to load - 50 attempts × 100ms = 5 seconds max
        let attempts = 0;
        const maxAttempts = 50;
        
        while (!window.ApperSDK && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }
        
        if (!window.ApperSDK) {
          throw new Error('ApperSDK not loaded. Please ensure the SDK script is included before this component.');
        }
        
        const { ApperFileUploader } = window.ApperSDK;
        
        if (!isMounted) return;
        
        // Set unique element ID
        elementIdRef.current = elementId;
        
        // Mount the file field
        await ApperFileUploader.FileField.mount(elementIdRef.current, {
          ...config,
          existingFiles: existingFiles
        });
        
        if (isMounted) {
          mountedRef.current = true;
          setIsReady(true);
          setError(null);
        }
        
      } catch (err) {
        if (isMounted) {
          setError(err.message);
          setIsReady(false);
        }
      }
    };

    initializeApperSDK();

    // Cleanup on component destruction
    return () => {
      isMounted = false;
      try {
        if (mountedRef.current && window.ApperSDK) {
          const { ApperFileUploader } = window.ApperSDK;
          ApperFileUploader.FileField.unmount(elementIdRef.current);
        }
      } catch (err) {
        console.error('Error during file field unmount:', err);
      }
      mountedRef.current = false;
      existingFilesRef.current = [];
    };
  }, [elementId, config.fieldKey, config.fieldName, config.tableName, config.apperProjectId, config.apperPublicKey]);

  // File Update Effect
  useEffect(() => {
    if (!isReady || !window.ApperSDK || !config.fieldKey) {
      return;
    }

    // Deep equality check with JSON.stringify
    if (JSON.stringify(existingFiles) === JSON.stringify(existingFilesRef.current)) {
      return;
    }

    const updateFiles = async () => {
      try {
        const { ApperFileUploader } = window.ApperSDK;
        
        // Update reference
        existingFilesRef.current = existingFiles;
        
        // Format detection - check for .Id vs .id property
        let filesToUpdate = existingFiles;
        if (existingFiles.length > 0 && existingFiles[0].Id !== undefined) {
          // Convert from API format to UI format
          filesToUpdate = ApperFileUploader.toUIFormat(existingFiles);
        }
        
        // Update or clear files
        if (filesToUpdate.length > 0) {
          await ApperFileUploader.FileField.updateFiles(config.fieldKey, filesToUpdate);
        } else {
          await ApperFileUploader.FileField.clearField(config.fieldKey);
        }
        
      } catch (err) {
        setError(err.message);
      }
    };

    updateFiles();
  }, [existingFiles, isReady, config.fieldKey]);

  // Error UI
  if (error) {
    return (
      <div className="border-2 border-dashed border-red-300 rounded-lg p-4">
        <div className="text-red-600 text-sm">
          <strong>File Upload Error:</strong> {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Main container with unique ID - SDK takes over this container */}
      <div
        id={elementId}
        className="border-2 border-dashed border-gray-300 rounded-lg p-4 min-h-[120px] transition-colors hover:border-gray-400"
      >
        {!isReady && (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500 text-sm">Loading file uploader...</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApperFileFieldComponent;