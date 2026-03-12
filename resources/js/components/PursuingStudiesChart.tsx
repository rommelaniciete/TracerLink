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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { BookOpen } from 'lucide-react';
type ChartData = {
  name: string;
  value: number;
  fill: string;
};

type Props = {
  programId?: string;
  year?: string;
};

// 🎨 Color palette for further studies
const COLORS: Record<string, string> = {
  yes: 'hsl(40.6 96.1% 40.4%)',      // vibrant green
  no: 'hsl(47.9 95.8% 53.1%)',         // bright red
  unknown: 'hsl(220, 9%, 62%)',  // medium gray-blue
};

// Skeleton Component
function PursuingStudiesSkeleton() {
  return (
    <Card className="h-full w-full rounded-xl border bg-background text-foreground shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">
          <div className="h-6 w-40 bg-muted rounded animate-pulse"></div>
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

export default function PursuingStudiesChart({ programId, year }: Props) {
  const [data, setData] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const params: Record<string, string> = {};
        if (programId) params.program_id = programId;
        if (year) params.year = year;

        const res = await axios.get('/chart/pursuing-studies', { params });

        // Group and combine duplicate entries
        const groupedData: Record<string, number> = {};

        res.data.forEach((item: any) => {
          const key = item.name?.toLowerCase().trim();
          if (key) {
            groupedData[key] = (groupedData[key] || 0) + item.value;
          }
        });

        // Map to formatted data
        const formatted: ChartData[] = Object.entries(groupedData).map(([key, value]) => {
          let displayName = key;
          let colorKey = key;

          if (key === 'unknown') {
            displayName = 'Not tracked';
            colorKey = 'unknown';
          } else if (key === 'yes' || key === 'no') {
            displayName = key.charAt(0).toUpperCase() + key.slice(1);
          }

          return {
            name: displayName,
            value: value,
            fill: COLORS[colorKey] ?? COLORS.unknown,
          };
        });

        setData(formatted);
      } catch (error) {
        console.error('Error loading pursuing studies chart:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [programId, year]);

  // Show skeleton while loading
  if (isLoading) {
    return <PursuingStudiesSkeleton />;
  }

  const total = data.reduce((sum, d) => sum + d.value, 0);
  const maxValue = Math.max(...data.map((d) => d.value), 0);

  // Custom label function to show percentage labels outside with matching colors
  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    value,
    fill,
  }: any) => {
    if (percent === 0) return null; // Hide label if percentage is 0

    const RADIAN = Math.PI / 180;
    // Position the label outside the pie
    const radius = outerRadius + 25; // Move labels outside the pie
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill={fill} // Use the same color as the slice
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-xs font-bold"
        style={{
          paintOrder: 'stroke',
          stroke: 'white',
          strokeWidth: 3,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
        }}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const renderLegend = (props: any) => {
    const { payload } = props;

    return (
      <div className="mt-4 px-2">
        <div className="grid grid-cols-1 gap-2">
          {payload.map((entry: any, index: number) => {
            const percent = total > 0 ? ((entry.payload.value / total) * 100).toFixed(1) : '0';
            const isMaxValue = entry.payload.value === maxValue;

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
                    {entry.payload.value.toLocaleString()}
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
        <CardTitle className="text-lg font-semibold">Further Studies</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Are alumni currently pursuing further studies?
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <BookOpen />
                </EmptyMedia>
                <EmptyTitle>No Further Status</EmptyTitle>
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
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90} // Slightly reduced to make space for labels
                    stroke='none'
                    label={({ name, percent }) =>
                      `${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                    isAnimationActive={true}
                  >
                    {data.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={entry.fill}
                        stroke={entry.value === maxValue ? '' : undefined}
                        strokeWidth={entry.value === maxValue ? 2 : 0}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) =>
                      [`${value}`, 'Alumni']
                    }
                    contentStyle={{
                      backgroundColor: 'white',
                      color: '#111827',
                      fontSize: 13,
                      borderRadius: 6,
                      border: '1px solid #e5e7eb',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                    labelFormatter={(name) => `Response: ${name}`}
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
                  Response Breakdown
                </h4>
                {renderLegend({
                  payload: data.map((item, index) => ({
                    value: item.name,
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