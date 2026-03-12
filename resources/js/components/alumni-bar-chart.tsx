'use client';

// Alumni Employment Bar Chart Component

import { Briefcase, Target, TrendingUp, Users, UserX } from 'lucide-react';
import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, XAxis, YAxis } from 'recharts';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

type AlumniPerYear = {
    year: string;
    employed: number;
    unemployed: number;
    notTracked: number;
    total: number;
};

const chartConfig = {
    total: {
        label: 'Total Alumni',
        color: '#4b5563', // gray-600
    },
    employed: {
        label: 'Employed',
        color: '#059669', // emerald-600
    },
    unemployed: {
        label: 'Unemployed',
        color: '#dc2626', // red-600
    },
    notTracked: {
        label: 'Not Tracked',
        color: '#d97706', // amber-600
    },
} satisfies ChartConfig;

export function AlumniBarChart({ alumniPerYear }: { alumniPerYear: AlumniPerYear[] }) {
    const [groupSize, setGroupSize] = useState<number>(1);
    const [viewMode, setViewMode] = useState<'grouped' | 'individual'>('individual');

    // Enhanced data sanitization
    const sanitizedData = alumniPerYear.map((item) => {
        // Helper function to safely parse numbers
        const safeParseNumber = (value: any): number => {
            if (typeof value === 'number') return value;
            if (typeof value === 'string') {
                // Remove commas and any non-numeric characters except minus sign
                const cleaned = value.toString().replace(/[^\d.-]/g, '');
                const parsed = parseInt(cleaned);
                return isNaN(parsed) ? 0 : parsed;
            }
            if (value === null || value === undefined) return 0;
            return 0;
        };

        const employed = safeParseNumber(item.employed);
        const unemployed = safeParseNumber(item.unemployed);
        const total = safeParseNumber(item.total);
        let notTracked = safeParseNumber(item.notTracked);

        // Auto-compute notTracked if it's zero or invalid
        if ((notTracked === 0 || isNaN(notTracked)) && total > 0) {
            notTracked = Math.max(0, total - (employed + unemployed));
        }

        return {
            year: item.year,
            employed,
            unemployed,
            notTracked,
            total,
        };
    });

    // Rest of your component remains the same...
    // [Keep all the other functions and JSX as they were]

    // Function to group years
    const groupYears = (data: AlumniPerYear[], size: number) => {
        if (size === 1) return data;

        const grouped: AlumniPerYear[] = [];

        for (let i = 0; i < data.length; i += size) {
            const chunk = data.slice(i, i + size);
            const groupedItem = {
                year: chunk.length === 1 ? chunk[0].year : `${chunk[chunk.length - 1].year}-${chunk[0].year}`,
                employed: chunk.reduce((sum, item) => sum + item.employed, 0),
                unemployed: chunk.reduce((sum, item) => sum + item.unemployed, 0),
                notTracked: chunk.reduce((sum, item) => sum + item.notTracked, 0),
                total: chunk.reduce((sum, item) => sum + item.total, 0),
            };
            grouped.push(groupedItem);
        }

        return grouped;
    };

    // Determine optimal group size based on data length
    const calculateOptimalGroupSize = (dataLength: number) => {
        if (dataLength > 20) return 5;
        if (dataLength > 15) return 4;
        if (dataLength > 10) return 3;
        if (dataLength > 6) return 2;
        return 1;
    };

    // Auto-detect if grouping is needed
    const shouldAutoGroup = sanitizedData.length > 8;
    const optimalGroupSize = calculateOptimalGroupSize(sanitizedData.length);

    // Use grouped data if auto-grouping is enabled, otherwise use individual years
    const displayData = viewMode === 'grouped' ? groupYears(sanitizedData, groupSize) : sanitizedData;

    // Reverse data for horizontal chart (newest at top)
    const chartData = [...displayData].reverse();

    // Calculate statistics using sanitized data (not display data)
    const totalAlumni = sanitizedData.reduce((sum, year) => sum + year.total, 0);
    const totalEmployed = sanitizedData.reduce((sum, year) => sum + year.employed, 0);
    const totalUnemployed = sanitizedData.reduce((sum, year) => sum + year.unemployed, 0);
    const totalNotTracked = sanitizedData.reduce((sum, year) => sum + year.notTracked, 0);

    // Calculate employment rate based only on employed vs unemployed (excluding not tracked)
    const employmentRate = totalEmployed + totalUnemployed > 0 ? Math.round((totalEmployed / (totalEmployed + totalUnemployed)) * 100) : 0;

    // Safe number formatting function
    const formatNumber = (num: number) => {
        try {
            return num.toLocaleString();
        } catch (error) {
            return num.toString();
        }
    };

    // Dynamic font sizing
    const getFontSize = (dataLength: number) => {
        if (dataLength > 15) return 10;
        if (dataLength > 10) return 11;
        return 12;
    };

    return (
        <Card className="w-full rounded-xl border-0 bg-background shadow-lg dark:border-1">
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-xl font-bold">Alumni Employment Overview</CardTitle>
                        <CardDescription className="text-sm text-muted-foreground">Yearly breakdown of alumni employment status
                              <div className="text-muted-foreground whitespace-nowrap">Data updated {new Date().toLocaleDateString()}</div>
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Summary Statistics */}
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                    <div className="rounded-xl bg-gray-500/10 p-4 text-center shadow-sm">
                        <div className="mb-2 flex justify-center">
                            <div className="rounded-full bg-gray-200 p-2">
                                <Users className="h-5 w-5 text-gray-700" />
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-gray-800">{formatNumber(totalAlumni)}</div>
                        <div className="text-xs font-medium text-gray-600">Total Alumni</div>
                    </div>

                    <div className="rounded-xl bg-green-500/10 p-4 text-center shadow-sm">
                        <div className="mb-2 flex justify-center">
                            <div className="rounded-full bg-green-200 p-2">
                                <Briefcase className="h-5 w-5 text-green-700" />
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-green-700">{formatNumber(totalEmployed)}</div>
                        <div className="text-xs font-medium text-green-600">Employed</div>
                    </div>

                    <div className="rounded-xl bg-red-500/10 p-4 text-center shadow-sm">
                        <div className="mb-2 flex justify-center">
                            <div className="rounded-full bg-red-200 p-2">
                                <UserX className="h-5 w-5 text-red-700" />
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-red-700">{formatNumber(totalUnemployed)}</div>
                        <div className="text-xs font-medium text-red-600">Unemployed</div>
                    </div>

                    <div className="rounded-xl bg-amber-500/10 p-4 text-center shadow-sm">
                        <div className="mb-2 flex justify-center">
                            <div className="rounded-full bg-amber-200 p-2">
                                <Users className="h-5 w-5 text-amber-700" />
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-amber-700">{formatNumber(totalNotTracked)}</div>
                        <div className="text-xs font-medium text-amber-600">Not Tracked</div>
                    </div>

                    <div className="rounded-xl bg-blue-500/10 p-4 text-center shadow-sm">
                        <div className="mb-2 flex justify-center">
                            <div className="rounded-full bg-blue-200 p-2">
                                <Target className="h-5 w-5 text-blue-700" />
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-blue-700">{employmentRate}%</div>
                        <div className="text-xs font-medium text-blue-600">Employment Rate</div>
                    </div>
                </div>

                {/* View Mode Toggle */}
                {sanitizedData.length > 6 && (
                    <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                        <span className="text-sm font-medium text-gray-700">View Mode:</span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    setViewMode('individual');
                                    setGroupSize(1);
                                }}
                                className={`rounded-md px-3 py-1 text-sm font-medium ${
                                    viewMode === 'individual'
                                        ? 'border border-blue-300 bg-blue-100 text-blue-700'
                                        : 'border border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                Individual Years
                            </button>
                            <button
                                onClick={() => {
                                    setViewMode('grouped');
                                    setGroupSize(optimalGroupSize);
                                }}
                                className={`rounded-md px-3 py-1 text-sm font-medium ${
                                    viewMode === 'grouped'
                                        ? 'border border-blue-300 bg-blue-100 text-blue-700'
                                        : 'border border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                Grouped Years
                            </button>
                        </div>
                    </div>
                )}

                {/* Group Size Controls */}
                {viewMode === 'grouped' && sanitizedData.length > 6 && (
                    <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                        <span className="text-sm font-medium text-gray-700">Group Size:</span>
                        <div className="flex gap-2">
                            {[2, 3, 4, 5].map((size) => (
                                <button
                                    key={size}
                                    onClick={() => setGroupSize(size)}
                                    className={`rounded-md px-3 py-1 text-sm font-medium ${
                                        groupSize === size
                                            ? 'border border-blue-300 bg-blue-100 text-blue-700'
                                            : 'border border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
                                    }`}
                                >
                                    {size} Years
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Horizontal Bar Chart with Scrollable Container */}
                <div className="relative h-80">
                    <div className="absolute inset-0 overflow-x-auto">
                        <div className="h-full" style={{ minWidth: chartData.length > 8 ? '800px' : '600px' }}>
                            <ChartContainer config={chartConfig}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        layout="vertical"
                                        data={chartData}
                                        margin={{ top: 20, right: 30, left: 80, bottom: 20 }}
                                        barCategoryGap={12}
                                        barGap={4}
                                    >
                                        <CartesianGrid horizontal={true} vertical={false} strokeDasharray="3 3" stroke="#f3f4f6" />

                                        <XAxis
                                            type="number"
                                            tickLine={false}
                                            axisLine={false}
                                            tickMargin={10}
                                            tick={{ fontSize: 11, fill: '#6b7280' }}
                                            tickFormatter={(value) => formatNumber(value)}
                                        />

                                        <YAxis
                                            type="category"
                                            dataKey="year"
                                            tickLine={false}
                                            axisLine={false}
                                            tickMargin={10}
                                            tick={{
                                                fontSize: getFontSize(chartData.length),
                                                fill: '#374151',
                                                fontWeight: 500,
                                            }}
                                            width={chartData.length > 10 ? 80 : 70}
                                        />

                                        <ChartTooltip
                                            cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                                            content={
                                                <ChartTooltipContent
                                                    indicator="line"
                                                    labelFormatter={(value) => `Graduation ${viewMode === 'grouped' ? 'Period' : 'Year'}: ${value}`}
                                                    formatter={(value, name) => {
                                                        const label = chartConfig[name as keyof typeof chartConfig]?.label || name;
                                                        const labelStr = typeof label === 'string' ? label : String(label);
                                                        const capitalizedLabel = labelStr.charAt(0).toUpperCase() + labelStr.slice(1).toLowerCase();
                                                        return [
                                                            <span key="value" className="font-bold text-gray-900">
                                                                {formatNumber(Number(value))} alumni
                                                            </span>,
                                                            <span key="label" className="font-semibold text-blue-600">
                                                                {capitalizedLabel}
                                                            </span>,
                                                        ];
                                                    }}
                                                    className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg"
                                                    labelClassName="font-bold text-gray-800 text-sm"
                                                />
                                            }
                                        />

                                        {/* Total Bar */}
                                        <Bar dataKey="total" fill="var(--color-total)" radius={[0, 4, 4, 0]} name="total">
                                            <LabelList
                                                dataKey="total"
                                                position="right"
                                                style={{
                                                    fontSize: 11,
                                                    fontWeight: 500,
                                                    fill: '#374151',
                                                }}
                                                formatter={(value: number) => formatNumber(value)}
                                            />
                                        </Bar>

                                        {/* Employed Bar */}
                                        <Bar dataKey="employed" fill="var(--color-employed)" radius={[0, 4, 4, 0]} name="employed">
                                            <LabelList
                                                dataKey="employed"
                                                position="right"
                                                style={{
                                                    fontSize: 11,
                                                    fontWeight: 500,
                                                    fill: '#065f46',
                                                }}
                                                formatter={(value: number) => formatNumber(value)}
                                            />
                                        </Bar>

                                        {/* Unemployed Bar */}
                                        <Bar dataKey="unemployed" fill="var(--color-unemployed)" radius={[0, 4, 4, 0]} name="unemployed">
                                            <LabelList
                                                dataKey="unemployed"
                                                position="right"
                                                style={{
                                                    fontSize: 11,
                                                    fontWeight: 500,
                                                    fill: '#991b1b',
                                                }}
                                                formatter={(value: number) => formatNumber(value)}
                                            />
                                        </Bar>

                                        {/* Not Tracked Bar */}
                                        <Bar dataKey="notTracked" fill="var(--color-notTracked)" radius={[0, 4, 4, 0]} name="notTracked">
                                            <LabelList
                                                dataKey="notTracked"
                                                position="right"
                                                style={{
                                                    fontSize: 11,
                                                    fontWeight: 500,
                                                    fill: '#92400e',
                                                }}
                                                formatter={(value: number) => formatNumber(value)}
                                            />
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </ChartContainer>
                        </div>
                    </div>
                </div>

                {/* Chart Legend */}
                <div
                    className="flex flex-wrap justify-center gap-4 pt-2"
                    style={
                        {
                            '--color-total': chartConfig.total.color,
                            '--color-employed': chartConfig.employed.color,
                            '--color-unemployed': chartConfig.unemployed.color,
                            '--color-notTracked': chartConfig.notTracked.color,
                        } as React.CSSProperties
                    }
                >
                    <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded-sm bg-[var(--color-total)]"></div>
                        <span className="text-sm font-medium text-gray-700">Total Alumni</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded-sm bg-[var(--color-employed)]"></div>
                        <span className="text-sm font-medium text-gray-700">Employed</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded-sm bg-[var(--color-unemployed)]"></div>
                        <span className="text-sm font-medium text-gray-700">Unemployed</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded-sm bg-[var(--color-notTracked)]"></div>
                        <span className="text-sm font-medium text-gray-700">Not Tracked</span>
                    </div>
                </div>
            </CardContent>

            <CardFooter className="flex flex-col items-start gap-1 border-t pt-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <TrendingUp className="h-4 w-4" />
                    <span>
                        {viewMode === 'grouped' ? `Grouped data (${groupSize} years per group)` : `Individual year data`} • {sanitizedData.length}{' '}
                        total years
                    </span>
                </div>
            </CardFooter>
        </Card>
    );
}
