export const ChartSkeleton = () => (
    <div className="animate-pulse min-h-[300px] flex items-center justify-center">
        <div className="w-full h-[300px] bg-gray-200 dark:bg-gray-700 rounded-lg flex flex-col items-center justify-center gap-4">
            <div className="w-32 h-32 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
            <div className="space-y-2">
                <div className="h-3 w-40 bg-gray-300 dark:bg-gray-600 rounded"></div>
                <div className="h-3 w-32 bg-gray-300 dark:bg-gray-600 rounded"></div>
            </div>
        </div>
    </div>
);

export const TransactionSkeleton = () => (
    <div className="animate-pulse space-y-3">
        {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-200 dark:bg-gray-700 h-20 rounded-xl"></div>
        ))}
    </div>
);

export const CardSkeleton = () => (
    <div className="animate-pulse">
        <div className="bg-gray-200 dark:bg-gray-700 h-32 rounded-xl"></div>
    </div>
);
