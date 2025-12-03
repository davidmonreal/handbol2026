import { Upload, Loader2 } from 'lucide-react';

interface ImageUploadProps {
    onImageUpload: (file: File) => void;
    isProcessing: boolean;
    onExtract: () => void;
    hasImage: boolean;
}

export const ImageUpload = ({ onImageUpload, isProcessing, onExtract, hasImage }: ImageUploadProps) => {
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) validateAndUpload(file);
    };

    const validateAndUpload = (file: File) => {
        if (!file.type.startsWith('image/')) {
            alert('Please upload a valid image file (PNG, JPG, etc.)');
            return;
        }
        if (file.size > 1024 * 1024) { // 1MB
            alert('Image is too large. Please upload an image smaller than 1MB.');
            return;
        }
        onImageUpload(file);
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

    const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
        e.preventDefault();
        const items = e.clipboardData?.items;
        if (!items) return;

        for (let i = 0; i < items.length; i++) {
            if (items[i].type.startsWith('image/')) {
                const file = items[i].getAsFile();
                if (file) validateAndUpload(file);
                break;
            }
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">Upload Image</h2>

            <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-400 transition-colors"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onPaste={handlePaste}
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

            {hasImage && (
                <button
                    onClick={onExtract}
                    disabled={isProcessing}
                    className="w-full mt-4 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {isProcessing ? (
                        <>
                            <Loader2 className="animate-spin" size={20} />
                            Processing...
                        </>
                    ) : (
                        'Extract Players'
                    )}
                </button>
            )}
        </div>
    );
};
