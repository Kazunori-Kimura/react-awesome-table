import { ChangeEvent, useMemo, useState } from 'react';

interface usePaginationParams<T> {
    items: T[];
    page?: number;
    rowsPerPage: number;
    rowsPerPageOptions?: number[];
}

interface usePaginationValues<T> {
    emptyRows: number;
    page: number;
    pageItems: T[];
    lastPage: number;
    hasPrev: boolean;
    hasNext: boolean;
    rowsPerPage: number;
    rowsPerPageOptions: number[];
    onChangePage: (event: unknown, page: number) => void;
    onChangeRowsPerPage: (event: ChangeEvent<HTMLSelectElement>) => void;
}

/**
 * TablePagination の props を生成するカスタム Hooks
 */
export const usePagination = <T>({
    items,
    page = 0,
    rowsPerPage,
    rowsPerPageOptions = [5, 10, 30],
}: usePaginationParams<T>): usePaginationValues<T> => {
    const [currentPage, setPage] = useState(page);
    const [perPage, setRowsPerPage] = useState(rowsPerPage);

    const onChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const onChangeRowsPerPage = (event: ChangeEvent<HTMLSelectElement>) => {
        const { value } = event.target;
        const v = parseInt(value, 10);
        if (!Number.isNaN(v)) {
            setPage(0);
            setRowsPerPage(v);
        }
    };

    const emptyRows = useMemo(() => {
        return perPage - Math.min(perPage, items.length - currentPage * perPage);
    }, [items.length, currentPage, perPage]);

    const pageItems = useMemo(
        () => items.slice(currentPage * perPage, currentPage * perPage + perPage),
        [currentPage, items, perPage]
    );

    const last = useMemo(() => {
        return Math.ceil(items.length / perPage) - 1;
    }, [items.length, perPage]);

    return {
        emptyRows,
        page: currentPage,
        pageItems,
        lastPage: last,
        hasPrev: currentPage !== 0,
        hasNext: currentPage !== last,
        rowsPerPage: perPage,
        rowsPerPageOptions,
        onChangePage,
        onChangeRowsPerPage,
    };
};
