import { makeStyles } from '@material-ui/styles';
import classnames from 'classnames';
import React, {
    useCallback,
    useContext,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { EditMode } from '..';
import { CellSize, TableCellRole } from './consts';
import DropdownList from './DropdownList';
import useContextMenu, { ContextMenuEvent } from './hooks/useContextMenu';
import { PopoverContext } from './providers/PopoverProvider';
import {
    Cell,
    CellLocation,
    CellProps,
    CellRange,
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
    containerRect?: DOMRect;
    hasFocus: boolean;
    onSelect: (range: CellRange) => void;
    setMode: (mode: EditMode) => void;
}

interface StyleProps {
    width?: number;
    isDropdown: boolean;
    hasFocus: boolean;
    mode: EditMode;
}

const useStyles = makeStyles({
    cell: (props: StyleProps) => ({
        position: 'relative',
        borderBottomWidth: 1,
        borderBottomStyle: 'solid',
        borderBottomColor: '#ccc',
        borderRightWidth: 1,
        borderRightStyle: 'solid',
        borderRightColor: '#ccc',
        paddingLeft: '0.3rem',
        paddingRight: '0.3rem',
        minHeight: CellSize.MinHeight,
        // テキストを選択状態にしない
        userSelect: 'none',
        '-webkit-user-select': 'none',
        '-webkit-touch-callout': 'none',
        width: props.width ?? CellSize.DefaultWidth,
        boxSizing: 'border-box',
        '&:hover': {
            cursor: props.mode === 'select' ? 'cell' : 'auto',
        },
    }),
    current: ({ hasFocus }) => ({
        // カレントセルの枠線
        boxShadow: `0px 0px 1px 2px ${hasFocus ? '#0096ff' : '#a3a3a3'} inset`,
    }),
    selected: ({ hasFocus }) => ({
        // 選択セルの背景色
        backgroundColor: hasFocus ? '#E2EDFB' : '#ececec',
    }),
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
        minHeight: CellSize.MinHeight,
    },
    label: (props: StyleProps) => ({
        width: props.isDropdown
            ? `calc(${props.width ?? CellSize.DefaultWidth}px - 1.6rem)`
            : `calc(${props.width ?? CellSize.DefaultWidth}px - 0.6rem)`,
        boxSizing: 'border-box',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
    }),
    spacer: {
        flex: 1,
    },
    caret: {
        marginRight: -4,
        minHeight: CellSize.MinHeight,
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
        textAlign: 'right',
    },
});

function TableCell<T>({
    mode,
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
    containerRect,
    hasFocus,
    onSelect,
    setMode,
}: TableCellProps<T>): React.ReactElement {
    const [titleText, setTitleText] = useState<string>();
    const [cellRect, setCellRect] = useState<DOMRect>();
    const classes = useStyles({
        width: column.width,
        isDropdown: Boolean(column.dataList),
        hasFocus,
        mode,
    });
    const cellRef = useRef<HTMLTableCellElement>(null);
    const labelRef = useRef<HTMLDivElement>(null);
    const { openContextMenu, location: prevLocation } = useContext(PopoverContext);

    const entity: Partial<T> = useMemo(() => {
        // data から元データを取得する
        const source: Partial<T> = data.find((e, i) => rowKey === getRowKey(e, i));
        return parseEntity(row, columns, location.row, cells, source);
    }, [cells, columns, data, getRowKey, location.row, row, rowKey]);

    /**
     * 表示する文字列
     */
    const displayValue = useMemo(() => {
        return column.dataList
            ? column.dataList.find((item) => item.value === value)?.name ?? ''
            : value;
    }, [column.dataList, value]);

    /**
     * カスタムコンポーネントで値が更新された
     */
    const onChange = useCallback(
        (value: string) => {
            onChangeCellValue(location, value);
        },
        [location, onChangeCellValue]
    );

    /**
     * セルのクリック
     */
    const handleClick = useCallback(() => {
        // 範囲選択モード時
        if (mode === 'select') {
            // 範囲選択する
            const range: CellRange = {
                start: prevLocation,
                end: location,
            };
            onSelect(range);
            // 通常モードに戻す
            setMode('normal');
        }
    }, [location, mode, onSelect, prevLocation, setMode]);

    /**
     * 右クリック/要素長押しによるメニュー表示
     */
    const handleContextMenu = useCallback(
        (event: ContextMenuEvent) => {
            // 該当セルが未選択であれば、選択処理を行う
            if (!selected) {
                const range: CellRange = {
                    start: location,
                    end: location,
                };
                onSelect(range);
            }
            // 右クリックメニューの表示
            openContextMenu(event, location);
        },
        [location, openContextMenu, onSelect, selected]
    );
    // イベントハンドラー
    const contextMenuHandler = useContextMenu({ callback: handleContextMenu });

    useLayoutEffect(() => {
        if (cellRef.current) {
            setCellRect(cellRef.current.getBoundingClientRect());
        }

        if (labelRef.current) {
            // 省略時は offsetWidth と scrollWidth の値が異なる
            const { offsetWidth, scrollWidth } = labelRef.current;
            if (offsetWidth !== scrollWidth) {
                setTitleText(displayValue);
            }
        }
    }, [displayValue]);

    // カレントセルが表示されるようにスクロール
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (current && cellRef.current && containerRect) {
            const { top, bottom, left, right } = cellRef.current.getBoundingClientRect();
            // 要素が表示されているかどうかの判定
            let isOutside = false;
            const options: ScrollIntoViewOptions = {
                behavior: 'smooth',
                block: 'nearest',
                inline: 'nearest',
            };
            // ヘッダーの下に隠れないように高さを考慮
            isOutside = containerRect.top + CellSize.MinHeight > top;
            isOutside = isOutside || containerRect.bottom < bottom;
            if (isOutside) {
                options.block = 'end';
            }
            // 水平方向
            const isOutsideHorizontalStart = containerRect.left + 100 > left;
            const isOutsideHorizontalEnd = containerRect.right < right;
            if (isOutsideHorizontalStart) {
                isOutside = true;
                options.inline = 'end';
            } else if (isOutsideHorizontalEnd) {
                isOutside = true;
                options.inline = 'end';
            }
            if (isOutside) {
                // クリック直後にスクロールさせるとドラッグと認識されるため
                // 50ms待ってからスクロールする
                timer = setTimeout(() => {
                    cellRef.current.scrollIntoView(options);
                }, 50);
            }
        }

        return () => {
            if (timer) {
                clearTimeout(timer);
            }
        };
    }, [containerRect, current]);

    return (
        <td
            ref={cellRef}
            className={classnames(classes.cell, className, {
                [classes.current]: current,
                [classes.edit]: editing,
                [classes.readOnly]: readOnly && !selected,
                [classes.selected]: selected && !editing,
            })}
            onClick={handleClick}
            onDoubleClick={onDoubleClick}
            onKeyDown={onKeyDown}
            onMouseDown={onMouseDown}
            onMouseOver={onMouseOver}
            onMouseUp={onMouseUp}
            {...contextMenuHandler}
            data-rat-roll={TableCellRole}
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
                        {/* 入力/編集モード */}
                        {column.dataList ? (
                            <DropdownList
                                className={classes.editor}
                                location={location}
                                dataList={column.dataList}
                                width={column.width}
                                parent={cellRect}
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
                    <div className={classes.inner}>
                        {/* 通常モード */}
                        <div
                            ref={labelRef}
                            className={classnames(classes.label, {
                                [classes.numeric]: column.valueType === 'numeric',
                            })}
                            title={titleText}
                        >
                            {displayValue}
                        </div>
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
