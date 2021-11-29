import { makeStyles } from '@material-ui/styles';
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
import Container from './Container';
import ContextMenuPopover from './ContextMenuPopover';
import Header from './Header';
import { useTable } from './hook';
import Pagination from './Pagination';
import MessageProvider from './providers/MessageProvider';
import PopoverProvider from './providers/PopoverProvider';
import StyleProvider from './providers/StyleProvider';
import TableCell from './TableCell';
import TableHeader from './TableHeader';
import { CellLocation, PaginationProps, TableHandles, TableProps } from './types';

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
        messages,
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
    const [rootRect, setRootRect] = useState<DOMRect>();
    const [containerRect, setContainerRect] = useState<DOMRect>();
    const baseClasses = useStyles();

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
        mode,
        setMode,
    } = useTable({
        items: data,
        columns,
        getRowKey,
        onChange,
        rowsPerPage: props.rowsPerPage ?? 10,
        rowsPerPageOptions: props.rowsPerPageOptions ?? [10, 30, 100],
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
     * 右クリックメニューを閉じた際にフォーカスを戻す
     */
    const handleCloseContextMenu = useCallback(() => {
        setFocus(true);
    }, [setFocus]);

    /**
     * 範囲選択モードへの切り替え
     */
    const switchSelectMode = useCallback(() => {
        setMode('select');
    }, [setMode]);

    // カレントセルが container の表示エリア内かどうか判定するために
    // 要素のサイズを保持
    useLayoutEffect(() => {
        if (rootRef.current && containerRef.current) {
            setRootRect(rootRef.current.getBoundingClientRect());
            setContainerRect(containerRef.current.getBoundingClientRect());
        }
    }, []);

    return (
        <StyleProvider>
            <MessageProvider messages={messages}>
                <PopoverProvider root={rootRect} mode={mode} setMode={setMode}>
                    <div className={classnames(baseClasses.root, classes.root)} ref={rootRef}>
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
                        <Container ref={containerRef} className={classes.container}>
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
                                            row.length > 0
                                                ? row[0].rowKey
                                                : `empty-row-${rowIndex}`;
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
                                                            [baseClasses.stickyRowHeaderCell]:
                                                                sticky,
                                                        }
                                                    )}
                                                    {...getRowHeaderCellProps(rowIndex)}
                                                >
                                                    {rowNumber && (
                                                        <span>
                                                            {rowsPerPage * page + rowIndex + 1}
                                                        </span>
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
                                                            setMode={setMode}
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
                        </Container>
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
                            getSelectedCellValus={getSelectedCellValues}
                            pasteData={pasteData}
                            switchSelectMode={switchSelectMode}
                            onSelect={onSelect}
                            onClose={handleCloseContextMenu}
                        />
                    </div>
                </PopoverProvider>
            </MessageProvider>
        </StyleProvider>
    );
}

type Props<T> = TableProps<T> & {
    ref?: React.Ref<TableHandles<T>>;
};

const Table = forwardRef(TableComponent) as <T>(
    props: Props<T>
) => ReturnType<typeof TableComponent>;

export default Table;
