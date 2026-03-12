'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  LabelList,
  Cell,
} from 'recharts';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { TrendingUp, Users, Calendar } from 'lucide-react';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
type ChartItem = {
  year: string;
  total: number;
  percent?: string;
};

type Props = {
  programId: string;
  year?: string;
};

const BAR_COLORS = ['#3b82f6', '#2563eb', '#1d4ed8']; // Blue gradient

export default function TotalGraduatesChart({ programId, year }: Props) {
  const [data, setData] = useState<ChartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const res = await axios.get('/chart/total-graduates', {
          params: { program_id: programId, year },
        });

        const raw = res.data;
        const totalAll = raw.reduce((sum: number, item: ChartItem) => sum + item.total, 0);

        const processed = raw
          .map((item: ChartItem) => ({
            ...item,
            percent: totalAll > 0 ? ((item.total / totalAll) * 100).toFixed(1) + '%' : '0%',
          }))
          .sort((a: ChartItem, b: ChartItem) => b.year.localeCompare(a.year));

        setData(processed);
      } catch (err) {
        console.error('Failed to fetch graduate chart data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [programId, year]);

  // Calculate statistics for the footer
  const totalGraduates = data.reduce((sum, item) => sum + item.total, 0);
  const averagePerYear = data.length > 0 ? Math.round(totalGraduates / data.length) : 0;
  const maxGraduates = Math.max(...data.map(item => item.total), 0);

  const getBarColor = (value: number, maxValue: number) => {
    if (maxValue === 0) return BAR_COLORS[0];
    const percentage = (value / maxValue) * 100;
    if (percentage > 75) return BAR_COLORS[2];
    if (percentage > 40) return BAR_COLORS[1];
    return BAR_COLORS[0];
  };

  return (
    <Card className="w-full h-full rounded-xl border shadow-sm bg-background text-foreground">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">Response Trends</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Number of alumni response by year
            </CardDescription>
          </div>
          <div className="p-2 rounded-full bg-blue-100">
            <Users className="h-5 w-5 text-blue-600" />
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="text-center text-muted-foreground py-12">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
            </div>
          </div>
        ) : data.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Calendar />
                </EmptyMedia>
                <EmptyTitle>No Response</EmptyTitle>
                <EmptyDescription>No data found</EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="shadow-accent bg-blue-300/10 rounded-lg p-3">
                <div className="text-2xl font-bold text-blue-700">{totalGraduates}</div>
                <div className="text-xs text-blue-600">Total Responses</div>
              </div>
              <div className="shadow-accent bg-gray-300/10 rounded-lg p-3">
                <div className="text-2xl font-bold ">{data.length}</div>
                <div className="text-xs">Years Tracked</div>
              </div>
              <div className="shadow-accent bg-green-300/10 rounded-lg p-3">
                <div className="text-2xl font-bold text-green-700">{averagePerYear}</div>
                <div className="text-xs text-green-600">Avg per Year</div>
              </div>
            </div>

            {/* Chart */}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={data}
                  margin={{ top: 10, right: 30, bottom: 10, left: 40 }}
                >
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="year"
                    tick={{ fontSize: 11, fill: '#374151' }}
                    axisLine={false}
                    tickLine={false}
                    width={40}
                  />

                  <Tooltip
                    formatter={(value: number) => [`${value} graduates`, 'Count']}
                    labelFormatter={(label) => `Year: ${label}`}
                    contentStyle={{
                      backgroundColor: 'white',
                      borderRadius: 8,
                      border: '1px solid #e5e7eb',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      color: '#111827',
                      fontSize: '13px',
                    }}
                    labelStyle={{
                      fontWeight: 600,
                      marginBottom: '4px',
                      color: '#1f2937'
                    }}
                  />

                  <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                    {data.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={getBarColor(entry.total, maxGraduates)}
                      />
                    ))}
                    <LabelList
                      dataKey="total"
                      position="right"
                      fill="#374151"
                      fontSize={11}
                      fontWeight={500}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </CardContent>

      {/* Footer with trend information */}
      {data.length > 0 && (
        <div className="px-6 pb-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-3">
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              <span>Response trends</span>
            </div>
            <span>{data.length} academic years</span>
          </div>
        </div>
      )}
    </Card>
  );
}