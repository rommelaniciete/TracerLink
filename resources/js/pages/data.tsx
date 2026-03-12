'use client';

import axios from 'axios';
import { useEffect, useState } from 'react';
import { Head } from '@inertiajs/react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ChartPieLegend } from '@/components/employment-pie-chart';
import LocationPieChart from '@/components/work-location-chart';
import RelatedChart from '@/components/YesNoPieChart';
import PursuingStudiesChart from '@/components/PursuingStudiesChart';
import TotalGraduatesChart from '@/components/TotalGraduatesChart';
import GenderChart from '@/components/GenderChart';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Filter, X, ChevronDown, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Program = {
  id: number;
  name: string;
};

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Dashboard', href: '/' },
  { title: 'Data Analytics', href: '/data' },
];

export default function Data() {
  const [selectedProgram, setSelectedProgram] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [programs, setPrograms] = useState<Program[]>([]);
  const [years, setYears] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    axios.get('/alumni-chart-options').then((res) => {
      setPrograms(res.data.programs);
      setYears(res.data.years);
      setIsLoading(false);
    });
  }, []);

  const clearFilters = () => {
    setSelectedProgram('');
    setSelectedYear('');
  };

  const hasActiveFilters = Boolean(selectedProgram || selectedYear);

  /** Single function to return filter button label */
  const getFilterButtonText = () => {
    const programName = programs.find(p => String(p.id) === selectedProgram)?.name;

    if (selectedProgram && selectedYear) return `${programName} • ${selectedYear}`;
    if (selectedProgram) return programName || "Filter data";
    if (selectedYear) return `Year: ${selectedYear}`;

    return "Filter data";
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Analytics Dashboard" />

      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Alumni Analytics
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Explore responses data with interactive filters and visualizations
            </p>
          </div>

          {/* Filter Controls */}
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="text-gray-600 dark:text-gray-300 border-gray-300 dark:border-zinc-700"
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}

            <DropdownMenu open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant={hasActiveFilters ? "default" : "outline"}
                  className="flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  {getFilterButtonText()}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-80 p-4">
                <DropdownMenuLabel className="text-lg font-semibold">
                  Filter Data
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <div className="space-y-4 mt-4">
                  {/* Program Select */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Program
                    </label>
                    <Select
                      value={selectedProgram}
                      onValueChange={setSelectedProgram}
                    >
                      <SelectTrigger className="w-full">
                        {isLoading ? (
                          <div className="flex items-center">
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            <span>Loading programs...</span>
                          </div>
                        ) : (
                          <SelectValue placeholder="All programs" />
                        )}
                      </SelectTrigger>
                      <SelectContent>
                        {programs.map((program) => (
                          <SelectItem key={program.id} value={String(program.id)}>
                            {program.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Year Select */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Graduation Year
                    </label>
                    <Select
                      value={selectedYear}
                      onValueChange={setSelectedYear}
                    >
                      <SelectTrigger className="w-full">
                        {isLoading ? (
                          <div className="flex items-center">
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            <span>Loading years...</span>
                          </div>
                        ) : (
                          <SelectValue placeholder="All years" />
                        )}
                      </SelectTrigger>
                      <SelectContent>
                        {years.map((year) => (
                          <SelectItem key={year} value={year}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button className="w-full mt-2" onClick={() => setIsFilterOpen(false)}>
                    Close 
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Active Filter Chips */}
        {hasActiveFilters && (
          <div className="mb-6 flex flex-wrap gap-2">
            {selectedProgram && (
              <div className="inline-flex items-center px-3 py-1.5 rounded-full text-sm bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                Program: {programs.find(p => String(p.id) === selectedProgram)?.name}
                <button
                  onClick={() => setSelectedProgram('')}
                  className="ml-2 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 p-0.5"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            {selectedYear && (
              <div className="inline-flex items-center px-3 py-1.5 rounded-full text-sm bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                Year: {selectedYear}
                <button
                  onClick={() => setSelectedYear('')}
                  className="ml-2 rounded-full hover:bg-green-200 dark:hover:bg-green-800 p-0.5"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Charts */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <ChartPieLegend programId={selectedProgram} year={selectedYear} />
            <RelatedChart programId={selectedProgram} year={selectedYear} />
            <LocationPieChart programId={selectedProgram} year={selectedYear} />
              <PursuingStudiesChart programId={selectedProgram} year={selectedYear} />
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          
           
          </div>
          <div>
                <TotalGraduatesChart programId={selectedProgram} year={selectedYear} />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
