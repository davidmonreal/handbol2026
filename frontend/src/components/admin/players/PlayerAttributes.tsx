import React from 'react';
import { Hand } from 'lucide-react';
import { useSafeTranslation } from '../../../context/LanguageContext';

interface PlayerAttributesProps {
    handedness: 'RIGHT' | 'LEFT';
    onHandednessChange: (h: 'RIGHT' | 'LEFT') => void;
}

export const PlayerAttributes: React.FC<PlayerAttributesProps> = ({
    handedness,
    onHandednessChange
}) => {
    const { t } = useSafeTranslation();

    return (
        <div>
            {/* Handedness Selector */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                    {t('playerForm.handednessLabel')}
                </label>
                <div className="grid grid-cols-2 gap-4">
                    <button
                        type="button"
                        onClick={() => onHandednessChange('LEFT')}
                        className={`
                            p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all relative
                            ${handedness === 'LEFT'
                                ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm'
                                : 'border-gray-200 hover:border-gray-300 text-gray-600 hover:bg-gray-50'}
                        `}
                    >
                        <Hand size={32} strokeWidth={1.5} className="transform scale-x-[-1]" />
                        <span className="font-medium">{t('playerForm.handednessLeft')}</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => onHandednessChange('RIGHT')}
                        className={`
                            p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all relative
                            ${handedness === 'RIGHT'
                                ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm'
                                : 'border-gray-200 hover:border-gray-300 text-gray-600 hover:bg-gray-50'}
                        `}
                    >
                        <Hand size={32} strokeWidth={1.5} />
                        <span className="font-medium">{t('playerForm.handednessRight')}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
