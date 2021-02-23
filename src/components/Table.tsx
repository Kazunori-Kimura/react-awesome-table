import { makeStyles } from '@material-ui/styles';
import classnames from 'classnames';
import React, { MouseEvent } from 'react';
import { usePagination } from './pagination';
import SortButton from './SortButton';
import { TableDefinition } from './types';

export interface TableProps<T> extends TableDefinition<T> {
    data: T[];
}

const useStyles = makeStyles({
    root: {
        //
    },
    header: {
        //
    },
    container: {
        //
    },
    table: {
        width: 'max-content',
        boxSizing: 'border-box',
        borderCollapse: 'collapse',
        borderTopWidth: 1,
        borderTopStyle: 'solid',
        borderTopColor: '#ccc',
        borderLeftWidth: 1,
        borderLeftStyle: 'solid',
        borderLeftColor: '#ccc',
    },
    headerRow: {
        //
    },
    headerCell: {
        borderBottomWidth: 1,
        borderBottomStyle: 'solid',
        borderBottomColor: '#ccc',
        borderRightWidth: 1,
        borderRightStyle: 'solid',
        borderRightColor: '#ccc',
        padding: '0.3rem',
    },
    row: {
        minHeight: '1.5rem',
    },
    cell: {
        borderBottomWidth: 1,
        borderBottomStyle: 'solid',
        borderBottomColor: '#ccc',
        borderRightWidth: 1,
        borderRightStyle: 'solid',
        borderRightColor: '#ccc',
        padding: '0.3rem',
        // テキストを選択状態にしない
        userSelect: 'none',
    },
    current: {
        // 枠線
        boxShadow: '0px 0px 1px 2px #0096ff inset',
    },
    selected: {
        backgroundColor: '#E2EDFB',
    },
    footer: {
        //
    },
});

function Table<T>({ data, columns, getRowKey }: TableProps<T>): React.ReactElement {
    const classes = useStyles();
    const {
        page,
        pageItems,
        total,
        emptyRows,
        lastPage,
        hasPrev,
        hasNext,
        rowsPerPage,
        rowsPerPageOptions,
        tbodyRef,
        onChangePage,
        onChangeRowsPerPage,
        getFilterProps,
        getSortProps,
        getCellProps,
    } = usePagination({
        items: data,
        columns,
        getRowKey,
        rowsPerPage: 10,
        rowsPerPageOptions: [10, 30, 100],
    });

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
        <div className={classes.root}>
            <div className={classes.header}>
                <button>Add</button>
                <button>Delete</button>
            </div>
            <div className={classes.container}>
                <table className={classes.table}>
                    <thead>
                        <tr className={classes.headerRow}>
                            {columns.map((column, index) => {
                                const key = `awesome-table-header-${column.name}-${index}`;
                                return (
                                    <th className={classes.headerCell} key={key}>
                                        {column.name}
                                        <SortButton {...getSortProps(column.name)} />
                                        <br />
                                        <input type="text" {...getFilterProps(column.name)} />
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody ref={tbodyRef}>
                        {pageItems.map((item, rowIndex) => {
                            const rowKey =
                                item.length > 0 ? item[0].rowKey : `empty-row-${rowIndex}`;
                            return (
                                <tr className={classes.row} key={rowKey}>
                                    {item.map((cell, colIndex) => {
                                        const key = `awesome-table-body-${cell.entityName}-${rowIndex}-${colIndex}`;
                                        return (
                                            <td
                                                className={classnames(classes.cell, {
                                                    [classes.current]: cell.current,
                                                    [classes.selected]: cell.selected,
                                                })}
                                                key={key}
                                                {...getCellProps(cell, rowIndex, colIndex)}
                                            >
                                                {cell.value}
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                        {/* empty rows */}
                        {emptyRows > 0 &&
                            [...Array(emptyRows)].map((_, index) => (
                                <tr
                                    className={classes.row}
                                    key={`awesome-table-body-empty-rows-${index}`}
                                >
                                    <td className={classes.cell} colSpan={columns.length}>
                                        &nbsp;
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>
            <div className={classes.footer}>
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
        </div>
    );
}

export default Table;
