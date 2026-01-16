import React from 'react';

interface FloatingAssetProps {
    type: 'image' | 'video';
    src: string;
    x: number; // Percentage or px based on container
    y: number;
    width?: number | string;
    height?: number | string;
    alt?: string;
}

const FloatingAsset: React.FC<FloatingAssetProps> = ({ type, src, x, y, width = 'auto', height = 'auto', alt = '' }) => {
    return (
        <div
            style={{
                position: 'absolute',
                left: `${x}px`,
                top: `${y}px`,
                width: width,
                height: height,
                zIndex: 10,
                pointerEvents: 'auto',
            }}
            className="floating-asset"
        >
            {type === 'image' ? (
                <img
                    src={src}
                    alt={alt}
                    style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '12px',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
                    }}
                />
            ) : (
                <video
                    src={src}
                    controls
                    style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '12px',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
                    }}
                />
            )}
        </div>
    );
};

export default FloatingAsset;
