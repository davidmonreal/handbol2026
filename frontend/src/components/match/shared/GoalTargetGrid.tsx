interface GoalTargetGridProps {
    selectedTarget?: number;
    onTargetSelect: (targetIndex: number) => void;
}

export const GoalTargetGrid = ({ selectedTarget, onTargetSelect }: GoalTargetGridProps) => {
    return (
        <div className="max-w-[200px] mx-auto aspect-square bg-gray-100 rounded-lg p-2 border-4 border-gray-200">
            <div className="grid grid-cols-3 grid-rows-3 gap-2 h-full">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((target) => (
                    <button
                        key={target}
                        onClick={() => onTargetSelect(target)}
                        className={`border-2 rounded-md transition-all shadow-sm ${selectedTarget === target
                                ? 'bg-indigo-600 border-indigo-700 ring-2 ring-indigo-300'
                                : 'bg-white border-gray-200 hover:border-indigo-500 hover:bg-indigo-50'
                            }`}
                    />
                ))}
            </div>
        </div>
    );
};
