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
import { Users, Venus, Mars, HelpCircle } from 'lucide-react';

type ChartItem = {
  sex: string;
  count: number;
  fill: string;
};

const COLORS: Record<string, string> = {
  male: '#3b82f6',   // blue-500
  female: '#ec4899', // pink-500
  unknown: '#6b7280' // gray-500
};

const GENDER_ICONS: Record<string, React.ElementType> = {
  male: Mars,
  female: Venus,
  unknown: HelpCircle
};

export default function GenderChart() {
  const [data, setData] = useState<ChartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const res = await axios.get('/chart/gender');

        const mapped = res.data.map((item: any) => {
          const sex = (item.sex || 'unknown').toLowerCase();
          return {
            sex: sex === 'unknown' ? 'Not specified' : sex,
            count: item.total,
            fill: COLORS[sex] || COLORS.unknown,
          };
        });

        setData(mapped);
      } catch (err) {
        console.error('Error fetching gender chart:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const total = data.reduce((sum, d) => sum + d.count, 0);
  const maxValue = Math.max(...data.map((d) => d.count), 0);

  const renderLegend = (props: any) => {
    const { payload } = props;
    
    return (
      <div className="mt-4 px-2">
        <div className="grid grid-cols-1 gap-2">
          {payload.map((entry: any, index: number) => {
            const percent = total > 0 ? ((entry.payload.count / total) * 100).toFixed(1) : '0';
            const isMaxValue = entry.payload.count === maxValue;
            const IconComponent = GENDER_ICONS[entry.value.toLowerCase().replace(' ', '')] || Users;
            
            return (
              <div 
                key={`legend-${index}`} 
                className={`flex items-center justify-between p-3 rounded-lg ${
                  isMaxValue ? 'shadow-sm bg-green-500/10 font-medium' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <IconComponent className="h-4 w-4" style={{ color: entry.color }} />
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: entry.color }}
                    />
                  </div>
                  <span className="text-sm capitalize">
                    {entry.value}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">
                    {entry.payload.count.toLocaleString()}
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
          <div className="mt-3 pt-3 border-t border-gray-200">
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
    <Card className="w-full rounded-xl border-0 bg-background text-foreground shadow-sm dark:border-1">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">Gender Distribution</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Demographic breakdown of alumni population
                <div className="text-muted-foreground whitespace-nowrap">Data updated {new Date().toLocaleDateString()}</div>
            </CardDescription>
          </div>
          {/* <div className="p-2 rounded-full bg-pink-100">
            <Users className="h-5 w-5 text-pink-600" />
          </div> */}
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-gray-200 rounded w-32 mx-auto"></div>
              <div className="h-32 bg-gray-100 rounded-full"></div>
              <div className="h-3 bg-gray-200 rounded w-48 mx-auto"></div>
            </div>
          </div>
        ) : data.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
            No gender data available
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6">
            {/* Pie Chart */}
            <div className="w-full lg:w-1/2 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    dataKey="count"
                    nameKey="sex"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    stroke='none'
                    label={({ percent }) =>
                      `${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {data.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.fill}
                        stroke={entry.count === maxValue ? '' : undefined}
                        strokeWidth={entry.count === maxValue ? 2 : 0}
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
                    labelFormatter={(name) => `Gender: ${name}`}
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
              <div className="border-s-muted rounded-lg p-4">
                <h4 className="text-sm font-semibold mb-3 text-center">
                  Demographic Breakdown
                </h4>
                {renderLegend({ payload: data.map((item, index) => ({
                  value: item.sex,
                  color: item.fill,
                  payload: item
                })) })}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
