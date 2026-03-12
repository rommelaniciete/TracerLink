'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

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
import { MapPinHouse } from 'lucide-react';

type ChartItem = {
  browser: string;
  visitors: number;
  fill: string;
};

type Props = {
  programId?: string;
  year?: string;
};

const COLORS: Record<string, string> = {
  local: '#f472b6',   // pink-400
  abroad: '#ec4899',  // pink-500
  'not tracked': '#6b7280', // pink-700
};

// Skeleton Component
function LocationPieChartSkeleton() {
  return (
    <Card className="h-full w-full rounded-xl border bg-background text-foreground shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">
          <div className="h-6 w-56 bg-muted rounded animate-pulse"></div>
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          <div className="h-4 w-72 bg-muted rounded animate-pulse"></div>
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
              <div className="h-5 w-36 bg-muted rounded animate-pulse mx-auto mb-3"></div>
              <div className="space-y-3">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="flex items-center justify-between p-2">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full bg-muted animate-pulse"></div>
                      <div className="h-4 w-28 bg-muted rounded animate-pulse"></div>
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

export default function LocationPieChart({ programId, year }: Props) {
  const [data, setData] = useState<ChartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const res = await axios.get('/location', {
          params: {
            programId,
            year,
          },
        });

        const incoming: ChartItem[] = res.data.map((item: any) => ({
          browser: item.browser === 'unknown' ? 'Not tracked' : item.browser,
          visitors: item.visitors,
          fill: COLORS[item.browser?.toLowerCase() as keyof typeof COLORS] ?? COLORS['not tracked'],
        }));

        setData(incoming);
      } catch (err) {
        console.error('Error fetching location chart:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [programId, year]);

  // Show skeleton while loading
  if (isLoading) {
    return <LocationPieChartSkeleton />;
  }

  const total = data.reduce((sum, d) => sum + d.visitors, 0);
  const maxValue = Math.max(...data.map((d) => d.visitors), 0);

  const renderLegend = (props: any) => {
    const { payload } = props;

    return (
      <div className="mt-4 px-2">
        <div className="grid grid-cols-1 gap-3">
          {payload.map((entry: any, index: number) => {
            const percent = total > 0 ? ((entry.payload.visitors / total) * 100).toFixed(1) : '0';
            const isMaxValue = entry.payload.visitors === maxValue;

            return (
              <div
                key={`legend-${index}`}
                className={`flex items-center justify-between p-2 rounded-lg ${isMaxValue ? 'bg-green-500/10 font-medium' : ''
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
          <div className="mt-3 pt-3 border-t">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-muted-foreground">Total Responses</span>
              <span className="text-sm font-bold">{total.toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="h-full w-full rounded-xl border bg-background text-foreground shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Work Location Distribution</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Geographic distribution of alumni employment
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <MapPinHouse />
                </EmptyMedia>
                <EmptyTitle>No Work Location</EmptyTitle>
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
                    data={data}
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
                    {data.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.fill}
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
                    labelFormatter={(name) => `Location: ${name}`}
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
              <div className="border border-gray-10 rounded-lg p-4">
                <h4 className="text-sm font-semibold mb-3 text-center">
                  Location Breakdown
                </h4>
                {renderLegend({
                  payload: data.map((item, index) => ({
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