import { makeStyles } from '@material-ui/styles';
import classnames from 'classnames';
import React, { MouseEvent } from 'react';
import { usePagination } from './pagination';
import SortButton from './SortButton';
import TableCell from './TableCell';
import { CellLocation, TableProps } from './types';

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
        backgroundColor: 'rgb(247,248,249)',
        padding: '0.3rem',
    },
    row: {
        minHeight: '1.5rem',
    },
    rowHeaderCell: {
        width: '1.4rem',
    },
    cell: {
        position: 'relative',
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
    footer: {
        //
    },
});

function Table<T>({ data, columns, getRowKey, onChange }: TableProps<T>): React.ReactElement {
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
        onDeleteRows,
        onInsertRow,
        onSelectAll,
        getFilterProps,
        getSortProps,
        getCellProps,
        getRowHeaderCellProps,
        getEditorProps,
    } = usePagination({
        items: data,
        columns,
        getRowKey,
        onChange,
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
                <button onClick={onInsertRow}>Add Row</button>
                <button onClick={onDeleteRows}>Delete Rows</button>
            </div>
            <div className={classes.container}>
                <table className={classes.table}>
                    <thead>
                        <tr className={classes.headerRow}>
                            <th
                                className={classnames(classes.headerCell, classes.rowHeaderCell)}
                                onClick={onSelectAll}
                            />
                            {columns.map((column, index) => {
                                if (column.hidden) {
                                    return undefined;
                                }

                                const key = `awesome-table-header-${column.name}-${index}`;
                                return (
                                    <th className={classes.headerCell} key={key}>
                                        {column.displayName ?? column.name}
                                        <SortButton {...getSortProps(column.name)} />
                                        <br />
                                        <input type="text" {...getFilterProps(column.name)} />
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody ref={tbodyRef}>
                        {pageItems.map((row, rowIndex) => {
                            const rowKey = row.length > 0 ? row[0].rowKey : `empty-row-${rowIndex}`;
                            return (
                                <tr className={classes.row} key={rowKey}>
                                    <th
                                        className={classnames(
                                            classes.headerCell,
                                            classes.rowHeaderCell
                                        )}
                                        {...getRowHeaderCellProps(rowIndex)}
                                    />
                                    {row.map((cell, colIndex) => {
                                        const key = `awesome-table-body-${cell.entityName}-${rowIndex}-${colIndex}`;
                                        const column = columns.find(
                                            (c) => c.name === cell.entityName
                                        );
                                        const cellProps = getCellProps(cell, rowIndex, colIndex);
                                        const location: CellLocation = {
                                            row: rowIndex,
                                            column: colIndex,
                                        };

                                        return (
                                            <TableCell
                                                key={key}
                                                column={column}
                                                row={row}
                                                location={location}
                                                {...cell}
                                                {...cellProps}
                                                editorProps={getEditorProps()}
                                            />
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
                                    <td className={classes.cell} colSpan={columns.length + 1}>
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
