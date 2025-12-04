import { useState, useEffect } from 'react';
import {
    User, Users, ArrowUp, ArrowLeftRight,
    Target, Wind, Ban, Hand, Goal as GoalIcon,
    ChevronDown, ChevronUp
} from 'lucide-react';
import type { MatchEvent, ZoneType, SanctionType, TurnoverType } from '../../../types';
import { ZoneSelector } from '../shared/ZoneSelector';
import { SplitToggle } from '../shared/SplitToggle';

// Define interfaces locally to match MatchContext structure
interface Player {
    id: string;
    number: number;
    name: string;
    position: string;
    isGoalkeeper?: boolean;
}

interface Team {
    id: string;
    name: string;
    color: string;
    players: Player[];
}

interface EventEditResultProps {
    event: MatchEvent;
    team: Team;
    onSave: (event: MatchEvent) => void;
    onCancel: () => void;
    onDelete: (eventId: string) => void;
}

export const EventEditResult = ({ event, team, onSave, onCancel, onDelete }: EventEditResultProps) => {
    // State
    const [selectedPlayerId, setSelectedPlayerId] = useState<string>(event.playerId || '');
    const [selectedCategory, setSelectedCategory] = useState<string>(event.category);
    const [selectedAction, setSelectedAction] = useState<string | null>(event.action);
    const [selectedZone, setSelectedZone] = useState<ZoneType | null>(event.zone || null);
    const [selectedTarget, setSelectedTarget] = useState<number | undefined>(event.goalTarget);
    const [isCollective, setIsCollective] = useState(event.isCollective || false);
    const [hasOpposition, setHasOpposition] = useState(event.hasOpposition || false);
    const [isCounterAttack, setIsCounterAttack] = useState(event.isCounterAttack || false);

    const [isPlayerListOpen, setIsPlayerListOpen] = useState(false);

    // Update state when event changes
    useEffect(() => {
        setSelectedPlayerId(event.playerId || '');
        setSelectedCategory(event.category);
        setSelectedAction(event.action);
        setSelectedZone(event.zone || null);
        setSelectedTarget(event.goalTarget);
        setIsCollective(event.isCollective || false);
        setHasOpposition(event.hasOpposition || false);
        setIsCounterAttack(event.isCounterAttack || false);
    }, [event]);

    // Constants
    const shotResults = [
        { value: 'Goal', label: 'Goal', icon: Target },
        { value: 'Save', label: 'Save', icon: Hand },
        { value: 'Miss', label: 'Miss', icon: Wind },
        { value: 'Post', label: 'Post', icon: GoalIcon },
        { value: 'Block', label: 'Block', icon: Ban },
    ];

    const turnoverTypes: { value: TurnoverType; label: string }[] = [
        { value: 'Pass', label: 'Bad Pass' },
        { value: 'Catch', label: 'Dropped Ball' },
        { value: 'Offensive Foul', label: 'Offensive Foul' },
        { value: 'Steps', label: 'Steps' },
        { value: 'Area', label: 'Area' },
    ];

    const sanctionTypes: { value: SanctionType; label: string; color: string }[] = [
        { value: 'Foul', label: 'Foul', color: 'bg-gray-600' },
        { value: 'Yellow', label: 'Yellow', color: 'bg-yellow-500' },
        { value: '2min', label: '2 min', color: 'bg-blue-600' },
        { value: 'Red', label: 'Red', color: 'bg-red-600' },
        { value: 'Blue Card', label: 'Blue', color: 'bg-blue-800' },
    ];

    // Handlers
    const handleCategoryChange = (category: string) => {
        setSelectedCategory(category);
        setSelectedAction(null);
        // Don't reset selectedZone to preserve location when switching categories
        setSelectedTarget(undefined);
    };

    const handleSave = () => {
        const updatedEvent: MatchEvent = {
            ...event,
            playerId: selectedPlayerId,
            category: selectedCategory,
            action: selectedAction || event.action,
            zone: selectedZone || event.zone,
            isCollective,
            hasOpposition,
            isCounterAttack,
        };

        // Add goal target if applicable
        if (selectedTarget && (selectedAction === 'Goal' || selectedAction === 'Save')) {
            updatedEvent.goalTarget = selectedTarget;
            const targetToZoneMap: Record<number, string> = {
                1: 'TL', 2: 'TM', 3: 'TR',
                4: 'ML', 5: 'MM', 6: 'MR',
                7: 'BL', 8: 'BM', 9: 'BR'
            };
            updatedEvent.goalZoneTag = targetToZoneMap[selectedTarget];
        } else {
            updatedEvent.goalTarget = undefined;
            updatedEvent.goalZoneTag = undefined;
        }

        // Add sanction type if applicable
        if (selectedCategory === 'Sanction') {
            updatedEvent.sanctionType = selectedAction as SanctionType;
        }

        onSave(updatedEvent);
    };

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this event?')) {
            onDelete(event.id);
            onCancel(); // Close editor
        }
    };

    const selectedPlayer = team.players.find(p => p.id === selectedPlayerId);

    return (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-6">

            {/* 0. Player Selection */}
            <div className="relative">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Player</div>
                <button
                    onClick={() => setIsPlayerListOpen(!isPlayerListOpen)}
                    className="w-full flex items-center justify-between p-3 bg-white border border-gray-300 rounded-lg hover:border-indigo-500 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm">
                            {selectedPlayer?.number || '?'}
                        </span>
                        <span className="font-medium text-gray-900">
                            {selectedPlayer?.name || 'Unknown Player'}
                        </span>
                    </div>
                    {isPlayerListOpen ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                </button>

                {isPlayerListOpen && (
                    <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                        <div className="p-2 grid grid-cols-1 gap-1">
                            {team.players.map(player => (
                                <button
                                    key={player.id}
                                    onClick={() => {
                                        setSelectedPlayerId(player.id);
                                        setIsPlayerListOpen(false);
                                    }}
                                    className={`flex items-center gap-3 p-2 rounded-md transition-colors ${selectedPlayerId === player.id
                                            ? 'bg-indigo-50 text-indigo-700'
                                            : 'hover:bg-gray-50 text-gray-700'
                                        }`}
                                >
                                    <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${selectedPlayerId === player.id ? 'bg-indigo-200' : 'bg-gray-200'
                                        }`}>
                                        {player.number}
                                    </span>
                                    <span className="text-sm font-medium">{player.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* 1. Category Selection */}
            <div>
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Category</div>
                <div className="grid grid-cols-3 gap-2">
                    {['Shot', 'Turnover', 'Sanction'].map(cat => (
                        <button
                            key={cat}
                            onClick={() => handleCategoryChange(cat)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${selectedCategory === cat
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* 2. Zone Selection (Always visible) */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
                <ZoneSelector
                    selectedZone={selectedZone}
                    onZoneSelect={setSelectedZone}
                />
            </div>

            {/* 3. Action Selection */}
            <div>
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    {selectedCategory === 'Shot' ? 'Result' : selectedCategory === 'Turnover' ? 'Type' : 'Severity'}
                </div>

                {selectedCategory === 'Shot' && (
                    <div className="grid grid-cols-5 gap-2">
                        {shotResults.map(result => {
                            const Icon = result.icon;
                            return (
                                <button
                                    key={result.value}
                                    onClick={() => setSelectedAction(result.value)}
                                    className={`px-2 py-2.5 rounded-lg text-sm font-semibold transition-all flex flex-col items-center justify-center gap-1.5 ${selectedAction === result.value
                                        ? 'bg-indigo-600 text-white shadow-lg ring-2 ring-indigo-300'
                                        : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200 hover:border-indigo-300'
                                        }`}
                                >
                                    <Icon size={20} />
                                    <span className="text-xs">{result.label}</span>
                                </button>
                            );
                        })}
                    </div>
                )}

                {selectedCategory === 'Turnover' && (
                    <div className="grid grid-cols-3 gap-2">
                        {turnoverTypes.map(type => (
                            <button
                                key={type.value}
                                onClick={() => setSelectedAction(type.value)}
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${selectedAction === type.value
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                                    }`}
                            >
                                {type.label}
                            </button>
                        ))}
                    </div>
                )}

                {selectedCategory === 'Sanction' && (
                    <div className="grid grid-cols-3 gap-2">
                        {sanctionTypes.map(sanction => (
                            <button
                                key={sanction.value}
                                onClick={() => setSelectedAction(sanction.value)}
                                className={`px-3 py-2 rounded-lg text-sm font-medium text-white transition-all ${selectedAction === sanction.value
                                    ? `${sanction.color} shadow-lg ring-2 ring-offset-2 ring-indigo-500`
                                    : `${sanction.color} opacity-60 hover:opacity-100`
                                    }`}
                            >
                                {sanction.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* 4. Target Selection (Only for Goal/Save) */}
            {(selectedCategory === 'Shot' && (selectedAction === 'Goal' || selectedAction === 'Save')) && (
                <div className="animate-fade-in bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <h4 className="text-sm font-bold text-gray-500 mb-3 text-center">
                        {selectedAction === 'Goal' ? 'Select Goal Target' : 'Select Save Location'}
                    </h4>
                    <div className="max-w-[200px] mx-auto aspect-square bg-gray-100 rounded-lg p-2 border-4 border-gray-200">
                        <div className="grid grid-cols-3 grid-rows-3 gap-2 h-full">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((target) => (
                                <button
                                    key={target}
                                    onClick={() => setSelectedTarget(target)}
                                    className={`border-2 rounded-md transition-all shadow-sm ${selectedTarget === target
                                        ? 'bg-indigo-600 border-indigo-600'
                                        : 'bg-white border-gray-200 hover:border-indigo-500 hover:bg-indigo-50'
                                        }`}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* 5. Context Toggles (Only for Shot) */}
            {selectedCategory === 'Shot' && (
                <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Context</div>
                    <div className="grid grid-cols-3 gap-2">
                        <SplitToggle
                            value={isCollective}
                            onChange={setIsCollective}
                            leftOption={{ label: 'Individual', icon: User }}
                            rightOption={{ label: 'Collective', icon: Users }}
                            colorClass="purple"
                        />
                        <SplitToggle
                            value={hasOpposition}
                            onChange={setHasOpposition}
                            leftOption={{ label: 'Free', icon: User }}
                            rightOption={{ label: 'Opposition', icon: [User, Users] }}
                            colorClass="orange"
                        />
                        <SplitToggle
                            value={isCounterAttack}
                            onChange={setIsCounterAttack}
                            leftOption={{ label: 'Static', icon: ArrowLeftRight }}
                            rightOption={{ label: 'Counter', icon: ArrowUp }}
                            colorClass="cyan"
                        />
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-300">
                <button
                    onClick={handleDelete}
                    className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-700 font-medium transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                </button>

                <div className="flex gap-2">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
};
