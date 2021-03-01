import { makeStyles } from '@material-ui/styles';
import classnames from 'classnames';
import React, { useMemo } from 'react';
import { Cell, CellProps, ColumnDefinition, EditorProps } from './types';

type PropsBase<T> = Cell<T> & CellProps;

interface TableCellProps<T> extends PropsBase<T> {
    column: ColumnDefinition<T>;
    editorProps: EditorProps;
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
});

function TableCell<T>({
    column,
    rowKey,
    current = false,
    editing = false,
    invalid = false,
    invalidMessage = '',
    readOnly = false,
    selected = false,
    value,
    editorProps,
    onDoubleClick,
    onKeyDown,
    onMouseDown,
    onMouseOver,
    onMouseUp,
}: TableCellProps<T>): React.ReactElement {
    const classes = useStyles();

    const list = useMemo(() => {
        if (column.dataList) {
            return `${rowKey}_${column.name}`;
        }
        return undefined;
    }, [column.dataList, column.name, rowKey]);

    return (
        <td
            className={classnames(classes.cell, {
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
            {editing ? (
                <>
                    <input
                        type="text"
                        className={classes.editor}
                        autoFocus
                        {...editorProps}
                        list={list}
                    />
                    {column.dataList && (
                        <datalist id={list}>
                            {column.dataList.map(({ name, value: optionValue }) => {
                                const key = `${rowKey}_${column.name}_${optionValue}`;
                                return (
                                    <option key={key} value={optionValue}>
                                        {name}
                                    </option>
                                );
                            })}
                        </datalist>
                    )}
                </>
            ) : (
                <span>{value}</span>
            )}
            {invalid && <div className={classes.invalid} title={invalidMessage} />}
        </td>
    );
}

export default TableCell;
