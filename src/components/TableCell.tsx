import { makeStyles } from '@material-ui/styles';
import classnames from 'classnames';
import React, { useCallback, useMemo } from 'react';
import DropdownList from './DropdownList';
import {
    Cell,
    CellLocation,
    CellProps,
    ChangeCellValueFunction,
    ColumnDefinition,
    EditorProps,
    GenerateRowKeyFunction,
} from './types';
import { parseEntity } from './util';

type PropsBase<T> = Cell<T> & CellProps;

interface TableCellProps<T> extends PropsBase<T> {
    className?: string;
    column: ColumnDefinition<T>;
    columns: ColumnDefinition<T>[];
    row: Cell<T>[];
    cells: Cell<T>[][];
    data: T[];
    location: CellLocation;
    editorProps: EditorProps;
    getRowKey: GenerateRowKeyFunction<T>;
    onChangeCellValue: ChangeCellValueFunction;
}

const useStyles = makeStyles({
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
    current: {
        // カレントセルの枠線
        boxShadow: '0px 0px 1px 2px #0096ff inset',
    },
    selected: {
        // 選択セルの背景色
        backgroundColor: '#E2EDFB',
    },
    readOnly: {
        // 読み取り専用セルの背景色
        backgroundColor: '#f9f9f9',
    },
    invalid: {
        // エラーセル
        position: 'absolute',
        top: 0,
        right: 0,
        borderTop: '0.6rem solid #ff0000',
        borderLeft: '0.6rem solid transparent',
    },
    edit: {
        padding: 0,
    },
    editor: {
        marginLeft: 2,
        fontSize: '1rem',
        height: '100%',
        width: 'calc(100% - 4px)',
        boxSizing: 'border-box',
        border: 'none',
        backgroundColor: 'inherit',
        boxShadow: 'none',
        outline: 0,
        '&:focus': {
            border: 'none',
            boxShadow: 'none',
            outline: 0,
        },
    },
    inner: {
        display: 'flex',
        alignItems: 'center',
        width: '100%',
    },
    spacer: {
        flex: 1,
    },
    caret: {
        marginRight: -4,
        backgroundColor: 'inherit',
        border: 'none',
        outline: 0,
        '&:focus': {
            border: 'none',
            boxShadow: 'none',
            outline: 0,
        },
    },
    numeric: {
        justifyContent: 'flex-end',
    },
});

function TableCell<T>({
    className,
    column,
    columns,
    location,
    row,
    cells,
    data,
    rowKey,
    current = false,
    editing = false,
    invalid = false,
    invalidMessage = '',
    readOnly = false,
    selected = false,
    value,
    editorProps,
    getRowKey,
    onChangeCellValue,
    onDoubleClick,
    onKeyDown,
    onMouseDown,
    onMouseOver,
    onMouseUp,
}: TableCellProps<T>): React.ReactElement {
    const classes = useStyles();

    const entity: Partial<T> = useMemo(() => {
        // data から元データを取得する
        const source: Partial<T> = data.find((e, i) => rowKey === getRowKey(e, i));
        return parseEntity(row, columns, location.row, cells, source);
    }, [cells, columns, data, getRowKey, location.row, row, rowKey]);

    /**
     * カスタムコンポーネントで値が更新された
     */
    const onChange = useCallback(
        (value: string) => {
            onChangeCellValue(location, value);
        },
        [location, onChangeCellValue]
    );

    return (
        <td
            className={classnames(classes.cell, className, {
                [classes.current]: current,
                [classes.edit]: editing,
                [classes.readOnly]: readOnly && !selected,
                [classes.selected]: selected && !editing,
            })}
            onDoubleClick={onDoubleClick}
            onKeyDown={onKeyDown}
            onMouseDown={onMouseDown}
            onMouseOver={onMouseOver}
            onMouseUp={onMouseUp}
        >
            {/* カスタムコンポーネント */}
            {column.render &&
                column.render({
                    cell: row[location.column],
                    location,
                    row,
                    column,
                    entity,
                    onChange,
                })}
            {/* 通常のコンポーネント */}
            {!Boolean(column.render) &&
                (editing ? (
                    <>
                        {/* 編集モード */}
                        {column.dataList ? (
                            <DropdownList
                                className={classes.editor}
                                location={location}
                                dataList={column.dataList}
                                {...editorProps}
                            />
                        ) : (
                            <input
                                type="text"
                                className={classes.editor}
                                autoFocus
                                value={editorProps.value}
                                onChange={editorProps.onChange}
                                onKeyDown={editorProps.onKeyDown}
                            />
                        )}
                    </>
                ) : (
                    <div
                        className={classnames(classes.inner, {
                            [classes.numeric]: column.valueType === 'numeric',
                        })}
                    >
                        {/* 通常モード */}
                        <span>
                            {column.dataList
                                ? column.dataList.find((item) => item.value === value)?.name ?? ''
                                : value}
                        </span>
                        {column.dataList && (
                            <>
                                <div className={classes.spacer} />
                                <button className={classes.caret} onClick={onDoubleClick}>
                                    ▼
                                </button>
                            </>
                        )}
                    </div>
                ))}
            {invalid && <div className={classes.invalid} title={invalidMessage} />}
        </td>
    );
}

export default TableCell;
