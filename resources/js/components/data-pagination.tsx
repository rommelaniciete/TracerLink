import * as React from 'react';

import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PaginatedResponse } from '@/types/pagination';

type DataPaginationProps = {
    pagination: PaginatedResponse<unknown>;
    onPageChange: (page: number) => void;
    onPerPageChange: (perPage: number) => void;
    perPageOptions?: number[];
    itemLabel: string;
    disabled?: boolean;
};

function getPageNumbers(currentPage: number, lastPage: number): Array<number | 'ellipsis'> {
    if (lastPage <= 7) {
        return Array.from({ length: lastPage }, (_, index) => index + 1);
    }

    if (currentPage <= 3) {
        return [1, 2, 3, 4, 'ellipsis', lastPage];
    }

    if (currentPage >= lastPage - 2) {
        return [1, 'ellipsis', lastPage - 3, lastPage - 2, lastPage - 1, lastPage];
    }

    return [1, 'ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis', lastPage];
}

export function DataPagination({
    pagination,
    onPageChange,
    onPerPageChange,
    perPageOptions = [10, 20, 50, 100],
    itemLabel,
    disabled = false,
}: DataPaginationProps) {
    const pageNumbers = React.useMemo(
        () => getPageNumbers(pagination.current_page, pagination.last_page),
        [pagination.current_page, pagination.last_page],
    );

    const hasResults = pagination.total > 0;

    return (
        <div className="flex flex-col gap-4 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1 text-sm text-muted-foreground sm:flex-row sm:items-center sm:gap-3">
                <span>
                    {hasResults
                        ? `Showing ${pagination.from} to ${pagination.to} of ${pagination.total} ${itemLabel}`
                        : `No ${itemLabel} found`}
                </span>

                <div className="flex items-center gap-2">
                    <span>Rows per page</span>
                    <Select
                        value={String(pagination.per_page)}
                        onValueChange={(value) => onPerPageChange(Number(value))}
                        disabled={disabled}
                    >
                        <SelectTrigger className="h-9 w-20">
                            <SelectValue placeholder={pagination.per_page} />
                        </SelectTrigger>
                        <SelectContent>
                            {perPageOptions.map((option) => (
                                <SelectItem key={option} value={String(option)}>
                                    {option}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {pagination.last_page > 1 && (
                <Pagination className="mx-0 w-auto justify-start sm:justify-end">
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious
                                onClick={() => onPageChange(pagination.current_page - 1)}
                                disabled={disabled || pagination.current_page <= 1}
                            />
                        </PaginationItem>

                        {pageNumbers.map((page, index) => (
                            <PaginationItem key={`${page}-${index}`}>
                                {page === 'ellipsis' ? (
                                    <PaginationEllipsis />
                                ) : (
                                    <PaginationLink
                                        isActive={page === pagination.current_page}
                                        onClick={() => onPageChange(page)}
                                        disabled={disabled}
                                    >
                                        {page}
                                    </PaginationLink>
                                )}
                            </PaginationItem>
                        ))}

                        <PaginationItem>
                            <PaginationNext
                                onClick={() => onPageChange(pagination.current_page + 1)}
                                disabled={disabled || pagination.current_page >= pagination.last_page}
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            )}
        </div>
    );
}
