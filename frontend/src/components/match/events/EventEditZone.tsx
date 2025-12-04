import { useState } from 'react';
import type { MatchEvent, ZoneType } from '../../../types';
import { useMatch } from '../../../context/MatchContext';
import { ZONE_CONFIG } from '../../../config/zones';

interface EventEditZoneProps {
    event: MatchEvent;
    onSave: () => void;
    onCancel: () => void;
}

export const EventEditZone = ({ event, onSave, onCancel }: EventEditZoneProps) => {
    const { updateEvent, deleteEvent } = useMatch(); // Added deleteEvent
    const [selectedZone, setSelectedZone] = useState<ZoneType | null>(event.zone || null); // Added selectedZone state

    const handleSelect = (zone: ZoneType) => { // Modified handleSelect
        setSelectedZone(zone);
    };

    const handleSave = async () => { // Added handleSave
        if (selectedZone) {
            await updateEvent(event.id, { zone: selectedZone });
            onSave();
        }
    };

    const handleDelete = async () => { // Added handleDelete
        if (window.confirm('Are you sure you want to delete this event?')) {
            await deleteEvent(event.id);
            onSave();
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 animate-fade-in">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Select Zone</h3>
            <div className="space-y-3">
                {/* 6m Line */}
                <div className="grid grid-cols-5 gap-2">
                    {ZONE_CONFIG.sixMeter.map(({ zone, label }) => (
                        <button
                            key={zone}
                            onClick={() => handleSelect(zone as ZoneType)}
                            className={`p-3 rounded-lg text-xs md:text-sm font-semibold transition-all ${selectedZone === zone // Changed event.zone to selectedZone
                                ? 'bg-indigo-600 text-white shadow-lg ring-2 ring-indigo-300'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {/* 9m Line */}
                <div className="grid grid-cols-3 gap-2 max-w-md mx-auto">
                    {ZONE_CONFIG.nineMeter.map(({ zone, label }) => (
                        <button
                            key={zone}
                            onClick={() => handleSelect(zone as ZoneType)}
                            className={`p-3 rounded-lg text-xs md:text-sm font-semibold transition-all ${selectedZone === zone // Changed event.zone to selectedZone
                                ? 'bg-indigo-600 text-white shadow-lg ring-2 ring-indigo-300'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {/* 7m Penalty */}
                <div className="max-w-xs mx-auto">
                    <button
                        onClick={() => handleSelect(ZONE_CONFIG.penalty.zone as ZoneType)}
                        className={`w-full p-3 rounded-lg text-xs md:text-sm font-semibold transition-all ${selectedZone === ZONE_CONFIG.penalty.zone // Changed event.zone to selectedZone
                            ? 'bg-indigo-600 text-white shadow-lg ring-2 ring-indigo-300'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        {ZONE_CONFIG.penalty.label}
                    </button>
                </div>
            </div>

            {/* Save, Cancel and Delete buttons at bottom */}
            <div className="flex justify-between items-center mt-4">
                <button
                    onClick={handleDelete}
                    className="px-4 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 font-medium rounded-lg transition-colors flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                </button>

                <div className="flex gap-2">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 text-sm bg-indigo-600 text-white hover:bg-indigo-700 font-medium rounded-lg transition-colors shadow-sm"
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
};
