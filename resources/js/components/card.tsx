import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GraduationCap, Users } from 'lucide-react';
import { useState } from 'react';

type Program = {
    id: number;
    name: string;
    alumni_count: number;
    growth?: number; // Added for potential future use
};

export function SectionCards({ programs = [] }: { programs: Program[] }) {
    const MAX_VISIBLE_PROGRAM_CARDS = 7;

    const [showExtraPrograms, setShowExtraPrograms] = useState(false);
    const total = programs.reduce((sum, prog) => sum + prog.alumni_count, 0);
    const programCount = programs.length;
    const visiblePrograms = programs.slice(0, MAX_VISIBLE_PROGRAM_CARDS);
    const extraPrograms = programs.slice(MAX_VISIBLE_PROGRAM_CARDS);

    return (
        <div className="w-full">
            <div className="mb-6">
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">Program Statistics</h1>
                <p className="mt-1 text-sm text-muted-foreground">Overview of response metrics across all programs</p>
            </div>

            <div className="grid items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {/* Total Graduates */}
                <Card className="flex h-full flex-col overflow-hidden rounded-xl border border-gray-200 shadow-sm transition-all duration-300 hover:shadow-md dark:border-zinc-800">
                    <CardHeader className="flex-1 pb-3">
                        <div className="flex items-start justify-between">
                            <div>
                                <CardDescription className="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
                                    Overall Responses Across All Programs
                                </CardDescription>
                                <CardTitle className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{total.toLocaleString()}</CardTitle>
                            </div>
                            <div className="rounded-lg bg-blue-100 p-3 dark:bg-blue-900/30">
                                <GraduationCap className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardFooter className="border-t border-gray-100 bg-gray-50 py-3 text-sm text-gray-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-gray-400">
                        <Users className="mr-1.5 h-4 w-4" />
                        Across {programCount} programs
                    </CardFooter>
                </Card>

                {/* Per-Program Cards */}
                {visiblePrograms.map((program) => (
                    <Card
                        key={program.id}
                        className="group flex h-full flex-col overflow-hidden rounded-xl border border-gray-200 shadow-sm transition-all duration-300 hover:border-blue-300 hover:shadow-md dark:border-zinc-800 dark:hover:border-blue-700"
                    >
                        <CardHeader className="flex-1 pb-3">
                            <div className="flex items-start justify-between">
                                <div>
                                    <CardDescription className="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
                                        Responses on
                                    </CardDescription>
                                    <CardTitle className="mt-2 line-clamp-2 text-lg font-semibold text-gray-900 dark:text-white">
                                        {program.name}
                                    </CardTitle>
                                </div>
                                {/* <div className="p-2 rounded-lg  dark:bg-zinc-800 dark:group-hover:bg-blue-900/30 transition-colors">
                </div> */}
                            </div>
                        </CardHeader>
                        <CardFooter className="mt-auto border-t border-gray-100 bg-gray-50 py-3 text-lg font-bold text-blue-600 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-blue-400">
                            {program.alumni_count.toLocaleString()} Responses
                        </CardFooter>
                    </Card>
                ))}
            </div>

            {extraPrograms.length > 0 && (
                <Card className="mt-6 rounded-xl border border-gray-200 shadow-sm dark:border-zinc-800">
                    <CardHeader className="flex flex-row items-center justify-between gap-3 pb-4">
                        <div>
                            <CardTitle className="text-base text-gray-900 dark:text-white">More Programs</CardTitle>
                            <CardDescription className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                {extraPrograms.length} more programs are hidden, to see click the <span className='font-bold'>"Show more" </span>button.
                            </CardDescription>
                        </div>
                        <Button type="button" variant="outline" onClick={() => setShowExtraPrograms((prev) => !prev)}>
                            {showExtraPrograms ? 'Hide' : 'Show more'}
                        </Button>
                    </CardHeader>
                    {showExtraPrograms && (
                        <CardFooter className="grid gap-2 border-t border-gray-100 bg-gray-50 py-4 text-sm dark:border-zinc-800 dark:bg-zinc-900/50 sm:grid-cols-2">
                            {extraPrograms.map((program) => (
                                <div
                                    key={program.id}
                                    className="flex items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
                                >
                                    <span className="truncate pr-3 text-gray-800 dark:text-gray-200">{program.name}</span>
                                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                                        {program.alumni_count.toLocaleString()}
                                    </span>
                                </div>
                            ))}
                        </CardFooter>
                    )}
                </Card>
            )}
        </div>
    );
}
