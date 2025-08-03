import { useMemo } from "react";

function useRelativeDate(dateString: string): string {
    const relativeDate = useMemo(() => {
        const today = new Date();
        const target = new Date(dateString);

        // Strip time from both dates to compare pure days
        const utcToday = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
        const utcTarget = Date.UTC(target.getFullYear(), target.getMonth(), target.getDate());

        const diffDays = Math.ceil((utcTarget - utcToday) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return "In the past";
        if (diffDays === 0) return "Today";
        if (diffDays === 1) return "Tomorrow";

        return `in ${diffDays} days`;
    }, [dateString]);

    return relativeDate;
}

export default useRelativeDate;