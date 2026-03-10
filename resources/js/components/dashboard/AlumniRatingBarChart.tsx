'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, TrendingUp, Users } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

type Props = {
    ratingCounts: {
        star: number;
        total: number;
    }[];
};

export default function AlumniRatingBarChart({ ratingCounts }: Props) {
    // Calculate statistics FIRST
    const totalResponses = ratingCounts.reduce((sum, item) => sum + item.total, 0);
    const averageRating = totalResponses > 0 ? ratingCounts.reduce((sum, item) => sum + item.star * item.total, 0) / totalResponses : 0;
    const positiveRatingPercentage =
        totalResponses > 0
            ? Math.round((ratingCounts.filter((r) => r.star >= 4).reduce((sum, item) => sum + item.total, 0) / totalResponses) * 100)
            : 0;

    // Then create chart data
    const chartData = [1, 2, 3, 4, 5].map((star) => {
        const match = ratingCounts.find((r) => r.star === star);
        return {
            star,
            total: match?.total || 0,
            percentage: match?.total ? Math.round((match.total / totalResponses) * 100) : 0,
        };
    });

    return (
        <Card className="rounded-xl border-0 bg-background shadow-lg dark:border-1">
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-xl font-bold">Instruction Quality Ratings</CardTitle>
                        <CardDescription className="text-sm text-muted-foreground">
                            Distribution of alumni feedback on teaching quality
                            <div className="whitespace-nowrap text-muted-foreground">Data updated {new Date().toLocaleDateString()}</div>
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Summary Statistics */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="rounded-xl bg-gray-100 p-4 text-center dark:bg-gray-800">
                        <div className="mb-2 flex justify-center">
                            <div className="rounded-full bg-gray-200 p-2 dark:bg-gray-700">
                                <Users className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalResponses.toLocaleString()}</div>
                        <div className="text-xs font-medium text-gray-600 dark:text-gray-400">Total Responses</div>
                    </div>

                    <div className="rounded-xl bg-amber-100 p-4 text-center dark:bg-amber-900/20">
                        <div className="mb-2 flex justify-center">
                            <div className="rounded-full bg-amber-200 p-2 dark:bg-amber-800/30">
                                <Star className="h-5 w-5 text-amber-700 dark:text-amber-500" />
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-amber-700 dark:text-amber-500">{averageRating.toFixed(1)}</div>
                        <div className="text-xs font-medium text-amber-600 dark:text-amber-400">Average Rating</div>
                    </div>

                    <div className="rounded-xl bg-emerald-100 p-4 text-center dark:bg-emerald-900/20">
                        <div className="mb-2 flex justify-center">
                            <div className="rounded-full bg-emerald-200 p-2 dark:bg-emerald-800/30">
                                <TrendingUp className="h-5 w-5 text-emerald-700 dark:text-emerald-500" />
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-500">{positiveRatingPercentage}%</div>
                        <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Positive (4-5 stars)</div>
                    </div>
                </div>

                {/* Bar Chart */}
                <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 30, bottom: 10, left: 10 }} barSize={32}>
                            <CartesianGrid
                                horizontal={true}
                                vertical={false}
                                strokeDasharray="3 3"
                                className="stroke-gray-200 dark:stroke-gray-700"
                            />

                            <XAxis
                                type="number"
                                tickLine={false}
                                axisLine={false}
                                tick={{ fontSize: 12, fill: '#6b7280' }}
                                tickFormatter={(value) => value.toLocaleString()}
                                className="dark:text-gray-400"
                            />

                            <YAxis
                                type="category"
                                dataKey="star"
                                tickLine={false}
                                axisLine={false}
                                tick={{ fontSize: 14, fill: '#374151', fontWeight: 600 }}
                                width={40}
                                className="dark:text-gray-300"
                            />

                            <Tooltip
                                cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                                contentStyle={{
                                    backgroundColor: 'white',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                    fontSize: '14px',
                                    color: 'black',
                                }}
                                itemStyle={{
                                    color: 'hsl(var(--foreground))', // Override individual item colors
                                }}
                                formatter={(value, name, props) => [`${value} Responses (${props.payload.percentage}%)`]}
                            />
                            <Bar dataKey="total" radius={[0, 4, 4, 0]} fill="#ef4444">
                                {/* Individual bar colors */}
                                {chartData?.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={
                                            entry.star === 5
                                                ? '#22c55e'
                                                : entry.star === 4
                                                  ? '#84cc16'
                                                  : entry.star === 3
                                                    ? '#eab308'
                                                    : entry.star === 2
                                                      ? '#f97316'
                                                      : '#ef4444'
                                        }
                                    />
                                ))}

                                {/* Total count label */}
                                <LabelList
                                    dataKey="total"
                                    position="right"
                                    style={{ fontSize: 12, fontWeight: 600, fill: '#808080' }}
                                    formatter={(value: number) => value.toLocaleString()}
                                />

                                {/* Percentage label */}
                                <LabelList
                                    dataKey="percentage"
                                    position="insideLeft"
                                    offset={10}
                                    style={{ fontSize: 11, fontWeight: 600, fill: 'white', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
                                    formatter={(value: number) => `${value}%`}
                                />

                                {/* Star icon only */}
                                <LabelList
                                    dataKey="star"
                                    position="left"
                                    offset={-10}
                                    content={({ x = 0, y = 0, value }) => (
                                        <foreignObject x={Number(x) - 48} y={Number(y) + 8} width={24} height={24}>
                                            <div
                                                className={`flex h-6 w-6 items-center justify-center rounded-full ${
                                                    value === 5
                                                        ? 'bg-green-100 dark:bg-green-900/30'
                                                        : value === 4
                                                          ? 'bg-lime-100 dark:bg-lime-900/30'
                                                          : value === 3
                                                            ? 'bg-yellow-100 dark:bg-yellow-900/30'
                                                            : value === 2
                                                              ? 'bg-orange-100 dark:bg-orange-900/30'
                                                              : 'bg-red-100 dark:bg-red-900/30'
                                                }`}
                                            >
                                                <Star
                                                    stroke="none"
                                                    size={14}
                                                    fill={
                                                        value === 5
                                                            ? '#22c55e'
                                                            : value === 4
                                                              ? '#84cc16'
                                                              : value === 3
                                                                ? '#eab308'
                                                                : value === 2
                                                                  ? '#f97316'
                                                                  : '#ef4444'
                                                    }
                                                />
                                            </div>
                                        </foreignObject>
                                    )}
                                />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Rating Scale Legend */}
                <div className="flex flex-col items-center justify-between gap-4 pt-2 sm:flex-row">
                    <div className="flex items-center gap-3 text-sm">
                        <span className="font-medium text-gray-700 dark:text-gray-300">Rating Quality:</span>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                                <div className="h-3 w-3 rounded-full bg-red-500"></div>
                                <span className="text-xs text-gray-600 dark:text-gray-400">Poor (1-2)</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                                <span className="text-xs text-gray-600 dark:text-gray-400">Average (3)</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="h-3 w-3 rounded-full bg-green-500"></div>
                                <span className="text-xs text-gray-600 dark:text-gray-400">Good (4-5)</span>
                            </div>
                        </div>
                    </div>
                    <div className="text-xs text-muted-foreground dark:text-gray-400">{totalResponses} total ratings collected</div>
                </div>
            </CardContent>
        </Card>
    );
}
