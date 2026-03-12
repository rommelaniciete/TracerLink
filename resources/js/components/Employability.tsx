'use client';

import * as React from "react";
import { useState, useMemo } from "react";
import { usePage } from "@inertiajs/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RefreshCw, Download, BookA } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
type AlumniRow = {
  id: number;
  program_id: number;
  last_name: string;
  given_name: string;
  middle_initial?: string;
  sex?: string;
  employment_status: string;
  company_name?: string;
  work_position?: string;
  program?: { id: number; name: string };
};

type Program = { id: number; name: string };

export default function EmployabilityPage() {
  const { props } = usePage<{ alumni: AlumniRow[]; programs: Program[] }>();
  const [query, setQuery] = useState("");
  const [programFilter, setProgramFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return props.alumni.filter(a => {
      const matchesQuery = [
        a.program?.name || 'N/A',
        `${a.given_name || 'N/A'} ${a.middle_initial || ''} ${a.last_name || 'N/A'}`,
        a.sex || 'N/A',
        a.employment_status || 'N/A',
        a.company_name || 'N/A',
        a.work_position || 'N/A'
      ].join(' ').toLowerCase().includes(q);

      const matchesProgram = programFilter === "all" || a.program?.name === programFilter;
      return matchesQuery && matchesProgram;
    });
  }, [props.alumni, query, programFilter]);

  const exportToExcel = () => {
    const data = filtered.map(a => ({
      "Program Name": a.program?.name || "N/A",
      "Graduate Name": `${a.last_name || "N/A"}, ${a.given_name || "N/A"} ${a.middle_initial || ""}`,
      "Status": a.employment_status || "N/A",
      "Sex": a.sex || "N/A",
      "Company / Business": a.company_name || "N/A",
      "Position / Work Nature": a.work_position || "N/A",
    }));

    // Create worksheet from JSON
    const ws = XLSX.utils.json_to_sheet(data);

    // Set column widths
    ws['!cols'] = [
      { wch: 25 },
      { wch: 30 },
      { wch: 15 },
      { wch: 10 },
      { wch: 35 },
      { wch: 25 },
    ];

    // Bold the header row
    const header = Object.keys(data[0] || {});
    header.forEach((_, i) => {
      const cell = ws[XLSX.utils.encode_cell({ r: 0, c: i })];
      if (cell) {
        cell.v = cell.v.toString();
      }
    });

    // Create workbook and append worksheet
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Employability");

    // Save as Excel file
    XLSX.writeFile(wb, "Employability_Report.xlsx");
  };

  return (
    <div>
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Employability Report</h1>
            <p className="mt-1 text-sm text-muted-foreground">Generate and print a detailed report of alumni employability data.</p>
          </div>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search alumni, program, or company..."
              className="w-64"
            />
            <Select value={programFilter} onValueChange={setProgramFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select program" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Programs</SelectItem>
                {props.programs.map(p => (
                  <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => { setQuery(''); setProgramFilter('all'); }}
              title="Reset filters"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={exportToExcel}
              title="Export to Excel"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export Excel
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <div className="w-full overflow-x-auto rounded-2xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PROGRAM NAME</TableHead>
                  <TableHead>NAME OF ALUMNI</TableHead>
                  <TableHead>STATUS</TableHead>
                  <TableHead>SEX</TableHead>
                  <TableHead>NAME OF COMPANY / TYPE OF BUSINESS</TableHead>
                  <TableHead>POSITION / NATURE OF WORK</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(a => (
                  <TableRow key={a.id} className="hover:bg-muted/40">
                    <TableCell>{a.program?.name || 'N/A'}</TableCell>
                    <TableCell>{`${a.last_name || 'N/A'}, ${a.given_name || 'N/A'} ${a.middle_initial || ''}`}</TableCell>
                    <TableCell>{a.employment_status || 'N/A'}</TableCell>
                    <TableCell>{a.sex || 'N/A'}</TableCell>
                    <TableCell>{a.company_name || 'N/A'}</TableCell>
                    <TableCell>{a.work_position || 'N/A'}</TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      <Empty>
                        <EmptyHeader>
                          <EmptyMedia variant="icon">
                            <BookA />
                          </EmptyMedia>
                          <EmptyTitle>No Employability</EmptyTitle>
                          <EmptyDescription>No data found</EmptyDescription>
                        </EmptyHeader>
                      </Empty>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}