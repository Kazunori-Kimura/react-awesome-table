import { createGenerateClassName, makeStyles, StylesProvider } from '@material-ui/styles';
import classnames from 'classnames';
import React, {
    ForwardedRef,
    forwardRef,
    useCallback,
    useImperativeHandle,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { CellSize } from './consts';
import ContextMenuPopover from './ContextMenuPopover';
import Header from './Header';
import { useTable } from './hook';
import { defaultMessages, MessageContext, MessageDefinitions } from './messages';
import Pagination from './Pagination';
import TableCell from './TableCell';
import TableHeader from './TableHeader';
import { CellLocation, PaginationProps, Position, TableHandles, TableProps } from './types';
import { ContextMenuEvent } from './useContextMenu';
import { isZeroPosition } from './util';

const generateClassName = createGenerateClassName({
    productionPrefix: 'rat',
    seed: 'rat',
});

const useStyles = makeStyles({
    root: {
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
    },
    header: {
        //
    },
    container: {
        flex: 1,
        maxWidth: '100%',
        boxSizing: 'border-box',
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: '#ccc',
        overflow: 'auto',
    },
    table: {
        width: 'max-content',
        boxSizing: 'border-box',
        borderCollapse: 'separate',
        borderSpacing: 0,
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
    stickyRowHeaderCell: {
        position: 'sticky',
        left: 0,
        zIndex: 1,
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

function TableComponent<T>(
    {
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
        disableUndo = false,
        ...props
    }: TableProps<T>,
    ref?: ForwardedRef<TableHandles<T>>
): React.ReactElement {
    const rootRef = useRef<HTMLDivElement>();
    const containerRef = useRef<HTMLDivElement>();
    const [containerRect, setContainerRect] = useState<DOMRect>();
    const [contextMenuPosition, setContextMenuPosition] = useState<Position>();
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
        hasFocus,
        onChangeCellValue,
        onChangePage,
        onChangeRowsPerPage,
        onDeleteRows,
        onInsertRow,
        onSelect,
        onSelectAll,
        getFilterProps,
        getSortProps,
        getCellProps,
        getRowHeaderCellProps,
        getEditorProps,
        selectByKeyValue,
        getSelectedCellValues,
        pasteData,
        setFocus,
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
        disableUndo,
    });

    useImperativeHandle(
        ref,
        () => ({
            selectByKeyValue,
        }),
        [selectByKeyValue]
    );

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

    const colSpan = useMemo(() => {
        return columns.filter((column) => !(column.hidden ?? false)).length;
    }, [columns]);

    /**
     * 右クリックメニューの表示
     */
    const handleContextMenu = useCallback((event: ContextMenuEvent<HTMLTableCellElement>) => {
        event.preventDefault();
        const pos: Position = {
            top: 0,
            left: 0,
        };

        if (rootRef.current) {
            const { x, y } = rootRef.current.getBoundingClientRect();
            pos.top -= y;
            pos.left -= x;
        }

        if ('changedTouches' in event) {
            const { pageX, pageY } = event.changedTouches[0];
            pos.top += pageY;
            pos.left += pageX;
        } else {
            const { clientX, clientY } = event;
            pos.top += clientY;
            pos.left += clientX;
        }
        setContextMenuPosition(pos);
    }, []);
    /**
     * 右クリックメニューを閉じる
     */
    const handleCloseContextMenu = useCallback(() => {
        setContextMenuPosition(undefined);
        setFocus(true);
    }, []);

    // カレントセルが container の表示エリア内かどうか判定するために
    // 要素のサイズを保持
    useLayoutEffect(() => {
        if (containerRef.current) {
            setContainerRect(containerRef.current.getBoundingClientRect());
        }
    }, []);

    return (
        <StylesProvider generateClassName={generateClassName}>
            <div className={classnames(baseClasses.root, classes.root)} ref={rootRef}>
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
                                            {/* 行ヘッダー */}
                                            <th
                                                className={classnames(
                                                    baseClasses.headerCell,
                                                    baseClasses.rowHeaderCell,
                                                    classes.rowHeader,
                                                    {
                                                        [baseClasses.stickyRowHeaderCell]: sticky,
                                                    }
                                                )}
                                                {...getRowHeaderCellProps(rowIndex)}
                                            >
                                                {rowNumber && (
                                                    <span>{rowsPerPage * page + rowIndex + 1}</span>
                                                )}
                                            </th>
                                            {row.map((cell, colIndex) => {
                                                if (cell.hidden) {
                                                    return undefined;
                                                }

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
                                                        hasFocus={hasFocus}
                                                        onSelect={onSelect}
                                                        onContextMenu={handleContextMenu}
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
                                                colSpan={colSpan + 1}
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
                    {/* 右クリックメニュー */}
                    <ContextMenuPopover
                        open={!isZeroPosition(contextMenuPosition)}
                        position={contextMenuPosition}
                        getSelectedCellValus={getSelectedCellValues}
                        pasteData={pasteData}
                        onClose={handleCloseContextMenu}
                    />
                </MessageContext.Provider>
            </div>
        </StylesProvider>
    );
}

type Props<T> = TableProps<T> & {
    ref?: React.Ref<TableHandles<T>>;
};

const Table = forwardRef(TableComponent) as <T>(
    props: Props<T>
) => ReturnType<typeof TableComponent>;

export default Table;
