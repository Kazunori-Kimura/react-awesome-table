import { makeStyles } from '@material-ui/styles';
import classnames from 'classnames';
import React, { MouseEvent } from 'react';
import { PaginationProps } from './types';

const useStyles = makeStyles({
    root: {
        //
    },
});

function Pagination<T>({
    className,
    page,
    total,
    lastPage,
    hasPrev,
    hasNext,
    rowsPerPage,
    rowsPerPageOptions,
    onChangePage,
    onChangeRowsPerPage,
}: PaginationProps<T>): React.ReactElement {
    const classes = useStyles();

    const handleClickPageFirst = (event: MouseEvent) => {
        onChangePage(event, 0);
    };
    const handleClickPagePrev = (event: MouseEvent) => {
        onChangePage(event, page - 1);
    };
    const handleClickPageNext = (event: MouseEvent) => {
        onChangePage(event, page + 1);
    };
    const handleClickPageLast = (event: MouseEvent) => {
        onChangePage(event, lastPage);
    };

    return (
        <div className={classnames(classes.root, className)}>
            <button disabled={!hasPrev} onClick={handleClickPageFirst}>
                first
            </button>
            <button disabled={!hasPrev} onClick={handleClickPagePrev}>
                prev
            </button>
            <button disabled={!hasNext} onClick={handleClickPageNext}>
                next
            </button>
            <button disabled={!hasNext} onClick={handleClickPageLast}>
                last
            </button>
            <select value={rowsPerPage} onChange={onChangeRowsPerPage}>
                {rowsPerPageOptions.map((value) => (
                    <option key={`rows-per-page-options-${value}`} value={value}>
                        {value}
                    </option>
                ))}
            </select>
            <span>
                {1 + page * rowsPerPage} - {Math.min(page * rowsPerPage + rowsPerPage, total)} /{' '}
                {total}
            </span>
            <span>page: {page + 1}</span>
        </div>
    );
}

export default Pagination;
