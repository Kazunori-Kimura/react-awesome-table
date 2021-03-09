import { makeStyles } from '@material-ui/styles';
import classnames from 'classnames';
import React, { MouseEvent, useContext } from 'react';
import { formatMessage, MessageContext } from './messages';
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
    const messages = useContext(MessageContext);

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
                {formatMessage(messages, 'pagination.first')}
            </button>
            <button disabled={!hasPrev} onClick={handleClickPagePrev}>
                {formatMessage(messages, 'pagination.prev')}
            </button>
            <button disabled={!hasNext} onClick={handleClickPageNext}>
                {formatMessage(messages, 'pagination.next')}
            </button>
            <button disabled={!hasNext} onClick={handleClickPageLast}>
                {formatMessage(messages, 'pagination.last')}
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
