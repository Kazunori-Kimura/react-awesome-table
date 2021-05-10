import { createGenerateClassName, makeStyles, StylesProvider } from '@material-ui/styles';
import classnames from 'classnames';
import React, { useMemo } from 'react';
import ColumnHeader from './ColumnHeader';
import { CellSize } from './consts';
import Header from './Header';
import { useTable } from './hook';
import { defaultMessages, MessageContext, MessageDefinitions } from './messages';
import Pagination from './Pagination';
import TableCell from './TableCell';
import { CellLocation, PaginationProps, TableProps } from './types';

const generateClassName = createGenerateClassName({
    productionPrefix: 'rat',
    seed: 'rat',
});

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
        borderBottomWidth: 1,
        borderBottomStyle: 'solid',
        borderBottomColor: '#ccc',
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
        boxSizing: 'border-box',
        minHeight: CellSize.MinHeight,
    },
    rowHeaderCell: {
        boxSizing: 'border-box',
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
    emptyCell: {
        boxSizing: 'border-box',
        borderBottom: 'none',
        // '3' は微調整の結果
        height: CellSize.MinHeight + 3,
    },
    footer: {
        //
    },
});

function Table<T>({
    classes = {},
    messages: msgs = {},
    data,
    columns,
    getRowKey,
    onChange,
    options,
    renderHeader,
    renderColumnHeader: CustomColumnHeader,
    renderPagination,
}: TableProps<T>): React.ReactElement {
    const baseClasses = useStyles();

    const messages: MessageDefinitions = useMemo(() => {
        return {
            ...defaultMessages,
            ...msgs,
        };
    }, [msgs]);

    const {
        page,
        pageItems,
        allItems,
        total,
        emptyRows,
        lastPage,
        hasPrev,
        hasNext,
        rowsPerPage,
        rowsPerPageOptions,
        selectedRange,
        tbodyRef,
        onChangeCellValue,
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
    } = useTable({
        items: data,
        columns,
        getRowKey,
        onChange,
        rowsPerPage: 10,
        rowsPerPageOptions: [10, 30, 100],
        messages,
        options,
    });

    const paginationProps: PaginationProps<T> = useMemo(() => {
        return {
            page,
            pageItems,
            total,
            lastPage,
            hasPrev,
            hasNext,
            rowsPerPage,
            rowsPerPageOptions,
            onChangePage,
            onChangeRowsPerPage,
        };
    }, [
        hasNext,
        hasPrev,
        lastPage,
        onChangePage,
        onChangeRowsPerPage,
        page,
        pageItems,
        rowsPerPage,
        rowsPerPageOptions,
        total,
    ]);

    return (
        <StylesProvider generateClassName={generateClassName}>
            <div className={classnames(baseClasses.root, classes.root)}>
                <MessageContext.Provider value={messages}>
                    {/* ヘッダー */}
                    {renderHeader ? (
                        renderHeader({
                            className: classes.header,
                            selectedRange,
                            onDeleteRows,
                            onInsertRow,
                            ...paginationProps,
                        })
                    ) : (
                        <Header
                            className={classes.header}
                            selectedRange={selectedRange}
                            onDeleteRows={onDeleteRows}
                            onInsertRow={onInsertRow}
                            {...paginationProps}
                        />
                    )}
                    <div className={classnames(baseClasses.container, classes.container)}>
                        <table className={classnames(baseClasses.table, classes.table)}>
                            <thead>
                                <tr
                                    className={classnames(baseClasses.headerRow, classes.headerRow)}
                                >
                                    <th
                                        className={classnames(
                                            baseClasses.headerCell,
                                            baseClasses.rowHeaderCell,
                                            classes.headerCell
                                        )}
                                        onClick={onSelectAll}
                                    />
                                    {columns.map((column, index) => {
                                        if (column.hidden) {
                                            return undefined;
                                        }

                                        const key = `awesome-table-header-${column.name}-${index}`;
                                        const sortProps = getSortProps(column.name);
                                        const filterProps = getFilterProps(column.name);

                                        if (CustomColumnHeader) {
                                            return (
                                                <CustomColumnHeader
                                                    key={key}
                                                    className={classnames(
                                                        baseClasses.headerCell,
                                                        classes.headerCell
                                                    )}
                                                    column={column}
                                                    sort={sortProps}
                                                    filter={filterProps}
                                                />
                                            );
                                        }

                                        return (
                                            <ColumnHeader
                                                key={key}
                                                className={classnames(
                                                    baseClasses.headerCell,
                                                    classes.headerCell
                                                )}
                                                column={column}
                                                sort={sortProps}
                                                filter={filterProps}
                                            />
                                        );
                                    })}
                                </tr>
                            </thead>
                            <tbody ref={tbodyRef} className={classes.tbody}>
                                {pageItems.map((row, rowIndex) => {
                                    const rowKey =
                                        row.length > 0 ? row[0].rowKey : `empty-row-${rowIndex}`;
                                    return (
                                        <tr
                                            className={classnames(baseClasses.row, classes.row)}
                                            key={rowKey}
                                        >
                                            <th
                                                className={classnames(
                                                    baseClasses.headerCell,
                                                    baseClasses.rowHeaderCell,
                                                    classes.rowHeader
                                                )}
                                                {...getRowHeaderCellProps(rowIndex)}
                                            />
                                            {row.map((cell, colIndex) => {
                                                const key = `awesome-table-body-${cell.entityName}-${rowIndex}-${colIndex}`;
                                                const column = columns.find(
                                                    (c) => c.name === cell.entityName
                                                );
                                                const cellProps = getCellProps(
                                                    cell,
                                                    rowIndex,
                                                    colIndex
                                                );
                                                const location: CellLocation = {
                                                    row: rowIndex + page * rowsPerPage,
                                                    column: colIndex,
                                                };

                                                return (
                                                    <TableCell<T>
                                                        key={key}
                                                        className={classes.cell}
                                                        column={column}
                                                        columns={columns}
                                                        data={data}
                                                        row={row}
                                                        cells={allItems}
                                                        getRowKey={getRowKey}
                                                        onChangeCellValue={onChangeCellValue}
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
                                            className={baseClasses.row}
                                            key={`awesome-table-body-empty-rows-${index}`}
                                        >
                                            <td
                                                className={classnames(
                                                    baseClasses.cell,
                                                    baseClasses.emptyCell,
                                                    classes.cell
                                                )}
                                                colSpan={columns.length + 1}
                                            >
                                                &nbsp;
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                    {/* ページング */}
                    {renderPagination ? (
                        renderPagination({
                            className: classes.pagination,
                            ...paginationProps,
                        })
                    ) : (
                        <Pagination className={classes.pagination} {...paginationProps} />
                    )}
                </MessageContext.Provider>
            </div>
        </StylesProvider>
    );
}

export default Table;
