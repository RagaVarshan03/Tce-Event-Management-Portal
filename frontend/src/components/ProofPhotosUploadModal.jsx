import React, { useState, useEffect } from 'react';
import API from '../services/api';
import './ProofPhotosUploadModal.css';

const ProofPhotosUploadModal = ({ event, onClose, onUploadSuccess }) => {
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [existingPhotos, setExistingPhotos] = useState(event.proofPhotos || []);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [replaceMode, setReplaceMode] = useState(false);

    const maxPhotos = 5;
    const maxFileSize = 10 * 1024 * 1024; // 10MB

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);

        // Validate each file
        const validFiles = [];
        for (const file of files) {
            // Check file type
            if (!file.type.match(/image\/(jpeg|png)/)) {
                setError('Only JPEG and PNG images are allowed');
                continue;
            }

            // Check file size
            if (file.size > maxFileSize) {
                setError(`File ${file.name} is too large. Max size is 10MB`);
                continue;
            }

            validFiles.push(file);
        }

        // Check total count
        const totalCount = replaceMode ? validFiles.length : existingPhotos.length + validFiles.length;
        if (totalCount > maxPhotos) {
            setError(`Cannot upload more than ${maxPhotos} photos total`);
            return;
        }

        setSelectedFiles(validFiles);
        setError('');
    };

    const removeSelectedFile = (index) => {
        setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
    };

    const handleDeleteExisting = async (filename) => {
        if (!window.confirm('Are you sure you want to delete this photo?')) return;

        try {
            await API.delete(`/events/${event._id}/proof-photos/${filename}`);
            setExistingPhotos(existingPhotos.filter(photo => photo !== filename));
            alert('Photo deleted successfully');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete photo');
        }
    };

    const handleUpload = async () => {
        if (selectedFiles.length === 0) {
            setError('Please select at least one photo');
            return;
        }

        setUploading(true);
        setError('');

        try {
            const formData = new FormData();
            selectedFiles.forEach(file => {
                formData.append('proofPhotos', file);
            });
            formData.append('replaceAll', replaceMode.toString());

            await API.post(`/events/${event._id}/upload-proof-photos`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            alert('Proof photos uploaded successfully!');
            onUploadSuccess();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to upload photos');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="proof-modal-overlay" onClick={onClose}>
            <div className="proof-modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="proof-modal-close" onClick={onClose}>&times;</button>

                <h2>📸 Manage Event Proof Photos</h2>
                <p className="event-name">{event.eventName}</p>
                <p className="event-date">Date: {new Date(event.date).toDateString()}</p>

                {/* Existing Photos Section */}
                {existingPhotos.length > 0 && (
                    <div className="existing-photos-section">
                        <h3>Current Photos ({existingPhotos.length}/{maxPhotos})</h3>
                        <div className="photo-grid">
                            {existingPhotos.map((photo, index) => (
                                <div key={photo} className="photo-item">
                                    <div className="photo-number">#{index + 1}</div>
                                    <button
                                        className="delete-photo-btn"
                                        onClick={() => handleDeleteExisting(photo)}
                                        title="Delete this photo"
                                    >
                                        ×
                                    </button>
                                    <div className="photo-placeholder">
                                        <span className="photo-icon">🖼️</span>
                                        <span className="photo-filename">{photo.substring(0, 20)}...</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="upload-section">
                    <h3>Upload New Photos</h3>

                    <div className="upload-mode">
                        <label className="mode-option">
                            <input
                                type="radio"
                                checked={!replaceMode}
                                onChange={() => setReplaceMode(false)}
                                disabled={uploading}
                            />
                            <span>Add to existing ({existingPhotos.length + selectedFiles.length}/{maxPhotos})</span>
                        </label>
                        <label className="mode-option">
                            <input
                                type="radio"
                                checked={replaceMode}
                                onChange={() => setReplaceMode(true)}
                                disabled={uploading}
                            />
                            <span>Replace all photos ({selectedFiles.length}/{maxPhotos})</span>
                        </label>
                    </div>

                    <div className="file-requirements">
                        <p><strong>Requirements:</strong></p>
                        <ul>
                            <li>Format: PNG or JPEG only</li>
                            <li>Max size: 10MB per photo</li>
                            <li>Max photos: {maxPhotos} total</li>
                            <li>Geotag photos recommended</li>
                        </ul>
                    </div>

                    <div className="file-input-section">
                        <input
                            type="file"
                            id="proof-photos"
                            accept="image/jpeg,image/png"
                            multiple
                            onChange={handleFileChange}
                            disabled={uploading}
                        />
                        <label htmlFor="proof-photos" className="file-input-label">
                            📁 Select Photos (Max {maxPhotos})
                        </label>
                    </div>

                    {selectedFiles.length > 0 && (
                        <div className="selected-files">
                            <h4>Selected Files ({selectedFiles.length})</h4>
                            <div className="file-list">
                                {selectedFiles.map((file, index) => (
                                    <div key={index} className="file-item">
                                        <span className="file-icon">📷</span>
                                        <span className="file-name">{file.name}</span>
                                        <span className="file-size">
                                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                        </span>
                                        <button
                                            className="remove-file-btn"
                                            onClick={() => removeSelectedFile(index)}
                                            disabled={uploading}
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {error && <div className="error-message">{error}</div>}
                </div>

                <div className="modal-actions">
                    <button
                        className="btn-cancel"
                        onClick={onClose}
                        disabled={uploading}
                    >
                        Cancel
                    </button>
                    <button
                        className="btn-upload"
                        onClick={handleUpload}
                        disabled={selectedFiles.length === 0 || uploading}
                    >
                        {uploading ? 'Uploading...' : `Upload ${selectedFiles.length} Photo${selectedFiles.length !== 1 ? 's' : ''}`}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProofPhotosUploadModal;
