import { createGenerateClassName, makeStyles, StylesProvider } from '@material-ui/styles';
import classnames from 'classnames';
import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { CellSize } from './consts';
import Header from './Header';
import { useTable } from './hook';
import { defaultMessages, MessageContext, MessageDefinitions } from './messages';
import Pagination from './Pagination';
import TableCell from './TableCell';
import TableHeader from './TableHeader';
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
        width: 'max-content',
        boxSizing: 'border-box',
        borderTopWidth: 1,
        borderTopStyle: 'solid',
        borderTopColor: '#ccc',
        borderBottomWidth: 1,
        borderBottomStyle: 'solid',
        borderBottomColor: '#ccc',
        overflow: 'auto',
        maxHeight: '100%',
    },
    table: {
        width: 'max-content',
        boxSizing: 'border-box',
        borderCollapse: 'separate',
        borderSpacing: 0,
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
        boxSizing: 'border-box',
        minHeight: CellSize.MinHeight,
    },
    rowHeaderCell: {
        boxSizing: 'border-box',
        width: '2.8rem',
        fontWeight: 'lighter',
        fontSize: '0.7rem',
        color: '#666',
        // テキストを選択状態にしない
        userSelect: 'none',
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
    readOnly = false,
    sticky = false,
    rowNumber = false,
    ...props
}: TableProps<T>): React.ReactElement {
    const containerRef = useRef<HTMLDivElement>();
    const [containerRect, setContainerRect] = useState<DOMRect>();
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
        rowsPerPage: props.rowsPerPage ?? 10,
        rowsPerPageOptions: props.rowsPerPageOptions ?? [10, 30, 100],
        messages,
        options,
        readOnly,
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

    // カレントセルが container の表示エリア内かどうか判定するために
    useLayoutEffect(() => {
        if (containerRef.current) {
            setContainerRect(containerRef.current.getBoundingClientRect());
        }
    }, []);

    return (
        <StylesProvider generateClassName={generateClassName}>
            <div className={classnames(baseClasses.root, classes.root)}>
                <MessageContext.Provider value={messages}>
                    {/* ヘッダー */}
                    {renderHeader ? (
                        renderHeader({
                            className: classes.header,
                            readOnly,
                            selectedRange,
                            onDeleteRows,
                            onInsertRow,
                            ...paginationProps,
                        })
                    ) : (
                        <Header
                            className={classes.header}
                            readOnly={readOnly}
                            selectedRange={selectedRange}
                            onDeleteRows={onDeleteRows}
                            onInsertRow={onInsertRow}
                            {...paginationProps}
                        />
                    )}
                    <div
                        ref={containerRef}
                        className={classnames(baseClasses.container, classes.container)}
                    >
                        <table className={classnames(baseClasses.table, classes.table)}>
                            <TableHeader
                                classes={classes}
                                columns={columns}
                                sticky={sticky}
                                getFilterProps={getFilterProps}
                                getSortProps={getSortProps}
                                onSelectAll={onSelectAll}
                                renderColumnHeader={CustomColumnHeader}
                            />
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
                                            >
                                                {rowNumber && (
                                                    <span>{rowsPerPage * page + rowIndex + 1}</span>
                                                )}
                                            </th>
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
                                                        containerRect={containerRect}
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
