"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { TrendingUp, Users, Calendar, ArrowUp, ArrowDown, Users2 } from "lucide-react"
import { CartesianGrid, LabelList, Line, LineChart, XAxis, YAxis, ResponsiveContainer } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Button } from "./ui/button"

export const description = "A line chart showing total graduates per year"

type ChartItem = {
  year: string
  total: number
}

const chartConfig = {
  graduates: {
    label: "Graduates",
    color: "#3b82f6", // blue-500
  },
} satisfies ChartConfig

export function GraduatesLineChart() {
  const [data, setData] = useState<ChartItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [trend, setTrend] = useState<{ direction: 'up' | 'down' | 'stable', percentage: number }>({ direction: 'stable', percentage: 0 })

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const res = await axios.get("/chart/total-graduates")
        const sortedData = res.data.sort((a: ChartItem, b: ChartItem) => a.year.localeCompare(b.year))
        setData(sortedData)

        // Calculate trend
        if (sortedData.length >= 2) {
          const currentYear = sortedData[sortedData.length - 1].total
          const previousYear = sortedData[sortedData.length - 2].total
          const percentageChange = ((currentYear - previousYear) / previousYear) * 100

          setTrend({
            direction: percentageChange > 0 ? 'up' : percentageChange < 0 ? 'down' : 'stable',
            percentage: Math.abs(percentageChange)
          })
        }
      } catch (err) {
        console.error("Failed to fetch graduates chart data:", err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  // Calculate statistics
  const totalGraduates = data.reduce((sum, item) => sum + item.total, 0)
  const averagePerYear = data.length > 0 ? Math.round(totalGraduates / data.length) : 0
  const peakYear = data.length > 0 ? data.reduce((max, item) => item.total > max.total ? item : max, data[0]) : null

  return (
    <Card className="w-full rounded-xl border-0 bg-background text-foreground shadow-sm dark:border-1">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">Response Trends</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Number of responses by academic year
              <div className="text-muted-foreground whitespace-nowrap">Data updated {new Date().toLocaleDateString()}</div>
            </CardDescription>
          </div>
          {/* <div className="p-2 rounded-full bg-blue-100">
            <Users className="h-5 w-5 text-blue-600" />
          </div> */}
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-gray-200 rounded w-32 mx-auto"></div>
              <div className="h-40 bg-gray-100 rounded"></div>
              <div className="h-3 bg-gray-200 rounded w-48 mx-auto"></div>
            </div>
          </div>
        ) : data.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Users2 />
                </EmptyMedia>
                <EmptyTitle>No Response</EmptyTitle>
                <EmptyDescription>No data found</EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-blue-300/10 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-700">{totalGraduates}</div>
                <div className="text-xs text-blue-600">Total Responses</div>
              </div>
              <div className="bg-gray-300/10 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold ">{data.length}</div>
                <div className="text-xs ">Years Tracked</div>
              </div>
              <div className="bg-green-300/10 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-700">{averagePerYear}</div>
                <div className="text-xs text-green-600">Avg per Year</div>
              </div>
            </div>

            {/* Chart */}
            <div className="h-64">
              <ChartContainer config={chartConfig}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    accessibilityLayer
                    data={data}
                    margin={{
                      top: 20,
                      left: 12,
                      right: 12,
                      bottom: 8,
                    }}
                  >
                    <CartesianGrid vertical={false} stroke="#f3f4f6" />
                    <XAxis
                      dataKey="year"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tick={{ fontSize: 11, fill: '#6b7280' }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tick={{ fontSize: 11, fill: '#6b7280' }}
                      width={40}
                    />
                    <ChartTooltip
                      cursor={false}
                      content={
                        <ChartTooltipContent
                          indicator="line"
                          labelFormatter={(value) => `Year: ${value}`}
                          formatter={(value) => [`${value} graduates`, 'Count']}
                        />
                      }
                    />
                    <Line
                      dataKey="total"
                      type="monotone"
                      stroke="var(--color-graduates)"
                      strokeWidth={2}
                      dot={{
                        fill: "var(--color-graduates)",
                        strokeWidth: 2,
                        r: 4,
                        stroke: "#fff"
                      }}
                      activeDot={{
                        r: 6,
                        stroke: "#fff",
                        strokeWidth: 2,
                      }}
                    >
                      <LabelList
                        dataKey="total"
                        position="top"
                        offset={12}
                        className="fill-foreground"
                        fontSize={11}
                        fontWeight={500}
                      />
                    </Line>
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>

            {/* Trend Indicator */}
            {data.length >= 2 && (
              <div className="flex items-center justify-center gap-2 text-sm ">
                <div className={`flex items-center gap-1 px-3 py-1 rounded-full z-999999 ${trend.direction === 'up' ? 'bg-green-100 text-green-800' :
                  trend.direction === 'down' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                  {trend.direction === 'up' ? <ArrowUp className="h-3 w-3" /> :
                    trend.direction === 'down' ? <ArrowDown className="h-3 w-3" /> : null}
                  <span className="font-medium  ">
                    {trend.direction === 'up' ? '+' : trend.direction === 'down' ? '-' : ''}
                    {trend.percentage.toFixed(1)}% responses from previous year
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* Additional Info */}
      {peakYear && (
        <div className="px-6 pb-4">
          <div className="text-xs text-muted-foreground border-t pt-3 text-center">
            Peak year: {peakYear.year} with {peakYear.total} responses
          </div>
        </div>
      )}
    </Card>
  )
}
