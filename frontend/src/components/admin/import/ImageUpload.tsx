import { useEffect, useCallback } from 'react';
import { Upload } from 'lucide-react';

interface ImageUploadProps {
    onImageUpload: (file: File) => void;
    isProcessing: boolean;
}

export const ImageUpload = ({ onImageUpload, isProcessing }: ImageUploadProps) => {
    const validateAndUpload = useCallback((file: File) => {
        if (!file.type.startsWith('image/')) {
            alert('Please upload a valid image file (PNG, JPG, etc.)');
            return;
        }
        if (file.size > 1024 * 1024) { // 1MB
            alert('Image is too large. Please upload an image smaller than 1MB.');
            return;
        }
        onImageUpload(file);
    }, [onImageUpload]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) validateAndUpload(file);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        const file = e.dataTransfer.files?.[0];
        if (file) {
            validateAndUpload(file);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    // Global paste handler
    useEffect(() => {
        const handlePasteCallback = (e: ClipboardEvent) => {
            const items = e.clipboardData?.items;
            if (!items) return;

            for (let i = 0; i < items.length; i++) {
                if (items[i].type.startsWith('image/')) {
                    const file = items[i].getAsFile();
                    if (file) {
                        e.preventDefault(); // Prevent default paste behavior if we found an image
                        validateAndUpload(file);
                        break;
                    }
                }
            }
        };

        window.addEventListener('paste', handlePasteCallback);
        return () => window.removeEventListener('paste', handlePasteCallback);
    }, [validateAndUpload]);

    return (
        <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">Upload Image</h2>

            <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-400 transition-colors"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                tabIndex={0}
            >
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                    <Upload size={48} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">
                        Click to upload, drag and drop, or paste<br />
                        PNG, JPG up to 1MB
                    </p>
                </label>
            </div>
            {isProcessing && (
                <div className="mt-4 text-center text-sm text-gray-500">
                    Processing image...
                </div>
            )}
        </div>
    );
};
