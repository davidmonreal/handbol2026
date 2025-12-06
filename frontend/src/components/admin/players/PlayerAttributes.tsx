import React from 'react';
import { Hand, Shield, Shirt } from 'lucide-react';

interface PlayerAttributesProps {
    handedness: 'RIGHT' | 'LEFT';
    isGoalkeeper: boolean;
    onHandednessChange: (h: 'RIGHT' | 'LEFT') => void;
    onIsGoalkeeperChange: (isGk: boolean) => void;
}

export const PlayerAttributes: React.FC<PlayerAttributesProps> = ({
    handedness,
    isGoalkeeper,
    onHandednessChange,
    onIsGoalkeeperChange
}) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Handedness Selector */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Handedness</label>
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
                        <span className="font-medium">Left Handed</span>
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
                        <span className="font-medium">Right Handed</span>
                    </button>
                </div>
            </div>

            {/* Position/Role Selector */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Role</label>
                <div className="grid grid-cols-2 gap-4">
                    <button
                        type="button"
                        onClick={() => onIsGoalkeeperChange(false)}
                        className={`
                            p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all
                            ${!isGoalkeeper
                                ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm'
                                : 'border-gray-200 hover:border-gray-300 text-gray-600 hover:bg-gray-50'}
                        `}
                    >
                        <Shirt size={32} strokeWidth={1.5} />
                        <span className="font-medium">Field Player</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => onIsGoalkeeperChange(true)}
                        className={`
                            p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all
                            ${isGoalkeeper
                                ? 'border-purple-600 bg-purple-50 text-purple-700 shadow-sm'
                                : 'border-gray-200 hover:border-gray-300 text-gray-600 hover:bg-gray-50'}
                        `}
                    >
                        <Shield size={32} strokeWidth={1.5} />
                        <span className="font-medium">Goalkeeper</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
