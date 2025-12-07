import React, { useState } from 'react';
import API from '../services/api';
import './AttendanceUploadModal.css';

const AttendanceUploadModal = ({ event, onClose, onUploadSuccess }) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            const validTypes = ['.csv', '.xls', '.xlsx'];
            const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

            if (!validTypes.includes(fileExt)) {
                setError('Please select a CSV or Excel file (.csv, .xls, .xlsx)');
                setSelectedFile(null);
                return;
            }

            // Validate file size (5MB)
            if (file.size > 5 * 1024 * 1024) {
                setError('File size must be less than 5MB');
                setSelectedFile(null);
                return;
            }

            setSelectedFile(file);
            setError('');
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            setError('Please select a file first');
            return;
        }

        setUploading(true);
        setError('');

        try {
            const formData = new FormData();
            formData.append('attendanceSheet', selectedFile);

            await API.post(`/events/${event._id}/upload-attendance`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            alert('Attendance sheet uploaded successfully!');
            onUploadSuccess();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to upload attendance sheet');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="attendance-modal-overlay" onClick={onClose}>
            <div className="attendance-modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="attendance-modal-close" onClick={onClose}>&times;</button>

                <h2>Upload Attendance Sheet</h2>
                <p className="event-name">{event.eventName}</p>
                <p className="event-date">Date: {new Date(event.date).toDateString()}</p>

                <div className="upload-section">
                    <div className="file-format-info">
                        <h4>Required Format:</h4>
                        <p>CSV or Excel file with the following columns:</p>
                        <ul>
                            <li><strong>Name</strong> - Student name</li>
                            <li><strong>Register No</strong> - Student registration number</li>
                            <li><strong>Department</strong> - Student department</li>
                            <li><strong>Attendance</strong> - P (Present) or A (Absent)</li>
                        </ul>
                        <p className="file-limit">Maximum file size: 5MB</p>
                    </div>

                    <div className="file-input-section">
                        <label htmlFor="attendance-file" className="file-label">
                            Select Attendance File
                        </label>
                        <input
                            type="file"
                            id="attendance-file"
                            accept=".csv,.xls,.xlsx"
                            onChange={handleFileChange}
                            disabled={uploading}
                        />

                        {selectedFile && (
                            <div className="selected-file">
                                <span className="file-icon">📄</span>
                                <span className="file-name">{selectedFile.name}</span>
                                <span className="file-size">
                                    ({(selectedFile.size / 1024).toFixed(2)} KB)
                                </span>
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
                            disabled={!selectedFile || uploading}
                        >
                            {uploading ? 'Uploading...' : 'Upload Attendance'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AttendanceUploadModal;
