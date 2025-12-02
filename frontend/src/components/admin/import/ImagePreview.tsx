interface ImagePreviewProps {
    image: string;
}

export const ImagePreview = ({ image }: ImagePreviewProps) => {
    return (
        <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">Preview</h2>
            <img src={image} alt="Preview" className="w-full rounded-lg border" />
        </div>
    );
};
