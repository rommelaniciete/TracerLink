'use client';

import axios from 'axios';
import { useEffect, useState } from 'react';
import { Pie, PieChart, ResponsiveContainer, Tooltip, Cell, Legend } from 'recharts';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { BriefcaseBusiness } from 'lucide-react';

type ChartDataItem = {
  browser: string;
  visitors: number;
  fill?: string;
};

type Props = {
  programId?: string;
  year?: string;
};

const chartConfig = {
  employed: {
    label: 'Employed',
    color: 'hsl(0 72.2% 50.6%)'   // emerald-500 (#10b981)
  },
  unemployed: {
    label: 'Unemployed',
    color: 'hsl(0 70% 35.3%)'     // red-500 (#ef4444)
  },
  nottracked: {
    label: 'Not Tracked',
    color: 'hsl(220, 9.1%, 46.1%)'    // gray-500 (#6b7280)
  },
} satisfies Record<string, { label: string; color: string }>;

// Skeleton Component
function ChartPieSkeleton() {
  return (
    <Card className="h-full w-full rounded-xl border bg-background text-foreground shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">
          <div className="h-6 w-48 bg-muted rounded animate-pulse"></div>
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          <div className="h-4 w-64 bg-muted rounded animate-pulse"></div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6">
          {/* Pie Chart Skeleton */}
          <div className="w-full lg:w-1/2 h-64 flex items-center justify-center">
            <div className="w-40 h-40 rounded-full bg-muted animate-pulse"></div>
          </div>

          {/* Legend Skeleton */}
          <div className="w-full lg:w-1/2">
            <div className="border border-gray-10 rounded-lg p-4">
              <div className="h-5 w-32 bg-muted rounded animate-pulse mx-auto mb-3"></div>
              <div className="space-y-3">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="flex items-center justify-between p-2">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full bg-muted animate-pulse"></div>
                      <div className="h-4 w-24 bg-muted rounded animate-pulse"></div>
                    </div>
                    <div className="text-right">
                      <div className="h-4 w-12 bg-muted rounded animate-pulse mb-1"></div>
                      <div className="h-3 w-8 bg-muted rounded animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t">
                <div className="flex justify-between items-center">
                  <div className="h-4 w-24 bg-muted rounded animate-pulse"></div>
                  <div className="h-4 w-16 bg-muted rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ChartPieLegend({ programId, year }: Props) {
  const [chartData, setChartData] = useState<ChartDataItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        setIsLoading(true);
        const params: Record<string, string> = {};
        if (programId) params.program_id = programId;
        if (year) params.year = year;

        const response = await axios.get('/alumni-chart', { params });

        const dataWithColors = response.data.map((item: ChartDataItem) => {
          const key = item.browser.toLowerCase().replace(/\s+/g, ''); // normalize casing and remove spaces
          type ChartConfigKey = keyof typeof chartConfig;
          const isChartConfigKey = (k: string): k is ChartConfigKey =>
            k === 'employed' || k === 'unemployed' || k === 'nottracked';
          return {
            ...item,
            browser: item.browser === 'unknown' ? 'Not Tracked' : item.browser,
            fill: isChartConfigKey(key) ? chartConfig[key].color : '#6b7280',
          };
        });

        setChartData(dataWithColors);
      } catch (error) {
        console.error('Error fetching chart data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChartData();
  }, [programId, year]);

  // Show skeleton while loading
  if (isLoading) {
    return <ChartPieSkeleton />;
  }

  const total = chartData.reduce((sum, d) => sum + d.visitors, 0);
  const maxValue = Math.max(...chartData.map((d) => d.visitors), 0);

  // Enhanced legend renderer
  const renderLegend = (props: any) => {
    const { payload } = props;

    return (
      <div className="mt-4 px-2">
        <div className="grid grid-cols-1 gap-2">
          {payload.map((entry: any, index: number) => {
            const percent = total > 0 ? ((entry.payload.visitors / total) * 100).toFixed(1) : '0';
            const isMaxValue = entry.payload.visitors === maxValue;

            return (
              <div
                key={`legend-${index}`}
                className={`flex items-center justify-between p-2 rounded-lg ${isMaxValue ? 'shadow-sm bg-green-500/10 font-medium' : ''
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm ">
                    {entry.value}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">
                    {entry.payload.visitors.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {percent}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {total > 0 && (
          <div className="mt-3 pt-3 border-t ">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-muted-foreground">Total Responses</span>
              <span className="text-sm font-bold ">{total.toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="h-full w-full rounded-xl border bg-background text-foreground shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Employment Status</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Distribution of alumni employment status
        </CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <BriefcaseBusiness/>
                </EmptyMedia>
                <EmptyTitle>No Employment</EmptyTitle>
                <EmptyDescription>No data found</EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6">
            {/* Pie Chart */}
            <div className="w-full lg:w-1/2 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="visitors"
                    nameKey="browser"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    stroke='none'
                    label={({ percent }) =>
                      `${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                    isAnimationActive
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.fill || '#d1d5db'}
                        stroke={entry.visitors === maxValue ? '' : undefined}
                        strokeWidth={entry.visitors === maxValue ? 2 : 0}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`${value}`, 'Alumni']}
                    contentStyle={{
                      backgroundColor: 'white',
                      color: '#111827',
                      borderRadius: 6,
                      fontSize: 13,
                      border: '1px solid #e5e7eb',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                    labelFormatter={(name) => `Status: ${name}`}
                    labelStyle={{
                      fontWeight: 600,
                      marginBottom: '4px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="w-full lg:w-1/2">
              <div className="border border-gray-10 rounded-lg p-4 capitalize">
                <h4 className="text-sm font-semibold mb-3 text-center">
                  Status Breakdown
                </h4>
                {renderLegend({
                  payload: chartData.map((item, index) => ({
                    value: item.browser,
                    color: item.fill,
                    payload: item
                  }))
                })}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}