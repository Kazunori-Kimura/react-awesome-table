import hotkeys, { HotkeysEvent } from 'hotkeys-js';
import {
    ChangeEvent,
    KeyboardEvent,
    MouseEvent,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { MouseButton } from './keys';
import { defaultMessages, formatMessage } from './messages';
import {
    Cell,
    CellLocation,
    CellRange,
    defaultTableOptions,
    Direction,
    EditorKeyDownAction,
    EditorProps,
    FilterProps,
    getCellComponentType,
    HistoryCommand,
    HotkeyProps,
    RowHeaderCellProps,
    SortProps,
    SortState,
    TableData,
    TableHookParameters,
    TableHookReturns,
    TableOptions,
} from './types';
import {
    clearSelection,
    clone,
    compareLocation,
    compareValue,
    convertRange,
    debug,
    parse,
    selectRange,
    withinCell,
    withinRange,
} from './util';
import { validateCell } from './validate';

/**
 * ページあたりの行数のデフォルト候補
 */
const defaultRowsPerPageOptions = [5, 10, 30] as const;

/**
 * Table の props を生成するカスタム Hooks
 */
export const useTable = <T>({
    items,
    columns,
    getRowKey,
    onChange,
    page = 0,
    rowsPerPage = defaultRowsPerPageOptions[0],
    rowsPerPageOptions = defaultRowsPerPageOptions,
    options = defaultTableOptions,
    messages = defaultMessages,
}: TableHookParameters<T>): TableHookReturns<T> => {
    // データ全体
    const [data, setData] = useState<TableData<T>>([]);
    // 現在表示ページ
    const [currentPage, setPage] = useState(page);
    // ページあたりの行数
    const [perPage, setRowsPerPage] = useState(rowsPerPage);
    // フィルタリング文字列
    const [filter, setFilter] = useState<Record<string, string>>();
    // ソート情報
    const [sort, setSort] = useState<SortState[]>([]);
    // 現在フォーカスのあるセル
    const [currentCell, setCurrentCell] = useState<CellLocation>();
    // 現在編集中のセル
    const [editCell, setEditCell] = useState<{ location: CellLocation; value: string }>();
    // 現在選択中のセル
    const [selection, setSelection] = useState<CellLocation[]>([]);
    // テーブルがフォーカスを持っている
    const [focus, setFocus] = useState(false);
    // ドラッグ中かどうか
    const [dragging, setDragging] = useState(false);
    // 行のドラッグ
    const [draggingRow, setDraggingRow] = useState(false);
    // undoデータ
    const [undo, setUndo] = useState<TableData<T>[]>([]);
    // undo履歴の位置
    const [undoIndex, setUndoIndex] = useState(-1);

    // tbody
    const tbodyRef = useRef<HTMLTableSectionElement>();

    // 初期化処理
    useEffect(() => {
        const newData: TableData<T> = items.map((item, index) => {
            return columns
                .filter((c) => !(c.hidden ?? false))
                .map((column) => ({
                    entityName: column.name,
                    rowKey: getRowKey(item, index),
                    value: column.getValue(item),
                    readOnly: column.readOnly ?? false,
                    cellType: getCellComponentType(column),
                }));
        });
        setData(newData);
        setUndo([newData]);
        setUndoIndex(0);
    }, [columns, getRowKey, items]);

    /**
     * オプション設定
     */
    const settings: TableOptions = useMemo(() => {
        return {
            ...defaultTableOptions,
            ...options,
        };
    }, [options]);

    /**
     * テーブルの列数
     */
    const columnLength = useMemo(() => {
        return columns.filter((column) => !(column.hidden ?? false)).length;
    }, [columns]);

    /**
     * ページ表示範囲
     */
    const currentPageRange: CellRange = useMemo(() => {
        const startRow = currentPage * rowsPerPage;
        const endRow = startRow + rowsPerPage - 1;
        return {
            start: {
                row: startRow,
                column: 0,
            },
            end: {
                row: endRow,
                column: columnLength - 1,
            },
        };
    }, [columnLength, currentPage, rowsPerPage]);

    /**
     * 当該イベントが tbody の範囲内で発生しているかどうかを判定
     * @param event
     */
    const withinTbody = useCallback((event: globalThis.MouseEvent): boolean => {
        if (tbodyRef.current) {
            const { left: x, top: y, width, height } = tbodyRef.current.getBoundingClientRect();
            const { pageX, pageY } = event;
            return y <= pageY && y + height >= pageY && x <= pageX && x + width >= pageX;
        }
        return false;
    }, []);

    /**
     * document での mouse down イベント
     * @param event
     */
    const handleMouseDownDocument = useCallback(
        (event: globalThis.MouseEvent) => {
            const within = withinTbody(event);
            debug('document mouse down', within);

            setFocus(within);
        },
        [withinTbody]
    );

    /**
     * document での mouse upイベント
     * @param event
     */
    const handleMouseUpDocument = useCallback(
        (event: globalThis.MouseEvent) => {
            if (tbodyRef.current) {
                if (!withinTbody(event)) {
                    debug('drag end.');
                    // ドラッグ強制終了
                    setDragging(false);
                    setDraggingRow(false);
                }
            }
        },
        [withinTbody]
    );

    /**
     * クリップボードにコピーするデータを生成する
     */
    const createCopyData = useCallback((): string => {
        if (selection) {
            const range = selection.sort(compareLocation);
            const rowRange = [range[0].row, range[range.length - 1].row].sort();
            const colRange = [range[0].column, range[range.length - 1].column].sort();
            const copiedData: string[][] = [];

            for (let r = rowRange[0]; r <= rowRange[1]; r++) {
                const row: string[] = [];
                for (let c = colRange[0]; c <= colRange[1]; c++) {
                    row.push(data[r][c].value);
                }
                copiedData.push(row);
            }

            return copiedData.map((row) => row.join('\t')).join('\n');
        }
        return '';
    }, [data, selection]);

    /**
     * copy
     * @param event
     */
    const handleCopy = useCallback(
        (event: globalThis.ClipboardEvent) => {
            if (focus && !Boolean(editCell)) {
                const copyData = createCopyData();
                debug('copy: ', copyData);
                event.clipboardData.setData('text/plain', copyData);
                event.preventDefault();
            }
        },
        [createCopyData, editCell, focus]
    );

    /**
     * セルに値をセットする (注意! 引数の cells を変更します)
     * @returns value が更新されたかどうか
     */
    const setCellValue = useCallback(
        (value: string, location: CellLocation, cells: TableData<T>): boolean => {
            debug('setCellValue: ', value, location);
            let changed = false;
            const cell = cells[location.row][location.column];
            const column = columns.find((c) => c.name === cell.entityName);
            if (column) {
                // 読み取り専用時は更新しない
                if (cell.readOnly) {
                    return false;
                }

                // 値のセット
                if (cell.value !== value) {
                    cell.value = value;
                    changed = true;
                }

                // エラーチェック
                const [valid, message] = validateCell(column, value, location, cells, messages);
                cell.invalid = !valid;
                cell.invalidMessage = message;
            }

            return changed;
        },
        [columns, messages]
    );

    /**
     * onChangeの呼び出し
     */
    const handleChange = useCallback(
        (cells: TableData<T>) => {
            if (onChange) {
                const newData = parse(items, cells, columns, getRowKey);
                onChange(newData);
            }
        },
        [columns, getRowKey, items, onChange]
    );

    /**
     * undo履歴に追加する
     */
    const pushUndoList = useCallback(
        (cells: TableData<T>) => {
            // セルの選択状態、カレントセルの指定をクリアする
            let temp = clone(cells);
            temp = clearSelection(temp, selection);
            if (currentCell) {
                temp[currentCell.row][currentCell.column].current = false;
            }

            // 履歴追加
            const index = undoIndex + 1;
            const history = clone(undo).slice(0, index);
            history.push(temp);

            // state更新
            setUndo(history);
            setUndoIndex(index);
        },
        [currentCell, selection, undo, undoIndex]
    );

    /**
     * セルの編集を開始する (stateを更新します)
     */
    const startEditing = useCallback(
        (location: CellLocation, defaultValue?: string) => {
            if (data[location.row][location.column].readOnly) {
                // 読み取り専用の場合は何もしない
                return;
            }
            debug('startEditing');
            const newData = clone(data);
            const cell = newData[location.row][location.column];
            cell.editing = true;

            // 初期値のセット
            let value = cell.value;
            if (cell.cellType === 'text' && typeof defaultValue !== 'undefined') {
                value = defaultValue;
            }

            setEditCell({
                location,
                value,
            });
            setData(newData);
        },
        [data]
    );

    /**
     * セルの編集を終了する (注意! 引数の cells を変更します)
     * 編集中の内容は破棄されます。
     */
    const endEditing = useCallback(
        (cells: TableData<T>): TableData<T> => {
            if (editCell) {
                debug('endEditing: ', editCell.location);
                cells[editCell.location.row][editCell.location.column].editing = false;
                setEditCell(undefined);
            }
            return cells;
        },
        [editCell]
    );

    /**
     * セルの編集を終了する
     */
    const cancelEditing = useCallback(() => {
        let newData = clone(data);
        newData = endEditing(newData);
        setData(newData);
    }, [data, endEditing]);

    /**
     * セルの編集を確定する (注意! 引数の cells を変更します)
     */
    const commitEditing = useCallback(
        (cells: TableData<T>, optionValue?: string): TableData<T> => {
            debug('commitEditing');
            // セルの更新する
            const { location, value } = editCell;
            let val: string = value;
            if (optionValue) {
                val = optionValue;
            }
            const changed = setCellValue(val, location, cells);
            // 編集終了
            const d = endEditing(cells);

            if (changed) {
                handleChange(cells);
                // 履歴更新
                pushUndoList(cells);
            }

            return d;
        },
        [editCell, endEditing, handleChange, pushUndoList, setCellValue]
    );

    /**
     * セルの編集を確定する
     */
    const commit = useCallback(
        (value: string) => {
            const cells = clone(data);
            commitEditing(cells, value);
            setData(cells);
        },
        [commitEditing, data]
    );

    /**
     * 空行を生成する
     * (行の挿入は行わない)
     */
    const makeNewRow = useCallback(
        (row: number, cells: TableData<T>): Cell<T>[] => {
            return columns
                .filter((c) => !(c.hidden ?? false))
                .map((column, index) => {
                    let value = '';
                    if (column.defaultValue) {
                        if (typeof column.defaultValue === 'string') {
                            value = column.defaultValue;
                        } else {
                            value = column.defaultValue(row, cells);
                        }
                    }

                    // エラーチェック
                    const [valid, message] = validateCell(
                        column,
                        value,
                        { row, column: index },
                        cells,
                        messages
                    );

                    return {
                        entityName: column.name,
                        rowKey: getRowKey(undefined, row, cells),
                        value,
                        invalid: !valid,
                        invalidMessage: message,
                        readOnly: column.readOnly,
                        cellType: getCellComponentType(column),
                    };
                });
        },
        [columns, getRowKey, messages]
    );

    /**
     * 値のペースト
     */
    const pasteData = useCallback(
        (rawData: string) => {
            if (currentCell && rawData) {
                // 改行・タブで区切って配列に変換
                const pasteItems: string[][] = rawData
                    .split('\n')
                    .map((value) => value.split('\t'));
                debug(pasteItems);

                const newData = clone(data);
                let changed = true;

                for (let i = 0; i < pasteItems.length; i++) {
                    const row = currentCell.row + i;
                    if (row >= newData.length) {
                        // 新規行を追加
                        const newRow = makeNewRow(row, newData);
                        newData.push(newRow);
                    }

                    for (let j = 0; j < pasteItems[i].length; j++) {
                        const column = currentCell.column + j;
                        if (column >= newData[row].length) {
                            // 範囲外のため貼り付けしない
                            break;
                        }

                        // 貼り付け処理
                        const value = pasteItems[i][j];
                        const location: CellLocation = { row, column };
                        changed = changed && setCellValue(value, location, newData);
                    }
                }

                // stateの更新
                setData(newData);

                if (changed) {
                    handleChange(newData);
                    // 履歴更新
                    pushUndoList(newData);
                }
            }
        },
        [currentCell, data, handleChange, makeNewRow, pushUndoList, setCellValue]
    );

    /**
     * paste
     */
    const handlePaste = useCallback(
        (event: globalThis.ClipboardEvent) => {
            if (focus && !Boolean(editCell) && currentCell) {
                const rawData = event.clipboardData.getData('text');
                debug('paste: ', rawData);

                pasteData(rawData);
            }
        },
        [currentCell, editCell, focus, pasteData]
    );

    // イベントリスナーの設定
    useEffect(() => {
        document.addEventListener('mousedown', handleMouseDownDocument);
        document.addEventListener('mouseup', handleMouseUpDocument);
        document.addEventListener('copy', handleCopy);
        document.addEventListener('paste', handlePaste);

        return () => {
            // イベントリスナーの削除
            document.removeEventListener('mousedown', handleMouseDownDocument);
            document.removeEventListener('mouseup', handleMouseUpDocument);
            document.removeEventListener('copy', handleCopy);
            document.removeEventListener('paste', handlePaste);
        };
    }, [handleCopy, handleMouseDownDocument, handleMouseUpDocument, handlePaste]);

    // --- hotkeys ---

    /**
     * 行数からページ番号を割り出す
     */
    const getPageNumberFromRowIndex = useCallback(
        (rowIndex: number): number => {
            return Math.ceil((rowIndex + 1) / rowsPerPage) - 1;
        },
        [rowsPerPage]
    );

    /**
     * カーソル移動
     * @param row
     * @param column
     */
    const navigateCursor = useCallback(
        (row: number, column: number, cells: TableData<T>, pressedEnter = false): TableData<T> => {
            debug('navigateCursor', row, column, currentCell);
            if (currentCell) {
                // 新しいカーソル位置
                const newCurrent: CellLocation = {
                    row: currentCell.row + row,
                    column: currentCell.column + column,
                };

                // 移動可能か判定
                if (newCurrent.column < 0) {
                    if (settings.navigateCellFromRowEdge === 'prevOrNextRow') {
                        // 前行の最後尾に移動
                        newCurrent.row -= 1;
                        newCurrent.column = columnLength - 1;
                    } else if (settings.navigateCellFromRowEdge === 'loop') {
                        // 同一行の最後尾に移動
                        newCurrent.column = columnLength - 1;
                    } else {
                        // 移動不可
                        return cells;
                    }
                }

                if (newCurrent.column >= columnLength) {
                    if (settings.navigateCellFromRowEdge === 'prevOrNextRow') {
                        // 次行の先頭に移動
                        newCurrent.row += 1;
                        newCurrent.column = 0;
                    } else if (settings.navigateCellFromRowEdge === 'loop') {
                        // 同一行の先頭に移動
                        newCurrent.column = 0;
                    } else {
                        // 移動不可
                        return cells;
                    }
                }

                if (newCurrent.row >= data.length) {
                    if (settings.pressEnterOnLastRow === 'insert' && pressedEnter) {
                        // 行追加する
                        const row = makeNewRow(newCurrent.row, cells);
                        cells.push(row);
                    } else {
                        // 移動不可
                        return cells;
                    }
                }

                if (newCurrent.row < 0) {
                    // 移動不可
                    return cells;
                }

                // 選択をクリア
                clearSelection(cells, selection);
                // 現在のカレントをクリア
                cells[currentCell.row][currentCell.column].current = false;

                // 選択、カレントを更新
                const cell = cells[newCurrent.row][newCurrent.column];
                cell.current = true;
                cell.selected = true;
                const newSelection: CellLocation[] = [newCurrent];

                // 行数からページ番号を割り出して
                // 前/次ページに移動した場合はページ番号を更新
                const newPage = getPageNumberFromRowIndex(newCurrent.row);
                if (currentPage !== newPage) {
                    setPage(newPage);
                }

                // state更新
                setSelection(newSelection);
                setCurrentCell(newCurrent);

                return cells;
            }
        },
        [
            columnLength,
            currentCell,
            currentPage,
            data.length,
            getPageNumberFromRowIndex,
            makeNewRow,
            selection,
            settings.navigateCellFromRowEdge,
            settings.pressEnterOnLastRow,
        ]
    );

    /**
     * 矢印キーによるカーソル移動
     */
    const handleArrowKeyDown = useCallback(
        (event: globalThis.KeyboardEvent, hotkeysEvent: HotkeysEvent) => {
            if (!focus || editCell) {
                // フォーカスが無い、あるいは編集中の場合は何もしない
                return;
            }
            const { key } = hotkeysEvent;
            debug('handleArrowKeyDown: ', key);

            let cells = clone(data);
            switch (key) {
                case 'left':
                    cells = navigateCursor(0, -1, cells);
                    break;
                case 'right':
                    cells = navigateCursor(0, 1, cells);
                    break;
                case 'up':
                    cells = navigateCursor(-1, 0, cells);
                    break;
                case 'down':
                    cells = navigateCursor(1, 0, cells);
                    break;
            }

            setData(cells);
            // デフォルトの挙動をキャンセル
            event.preventDefault();

            // TODO カレントセルが表示されるようにスクロールしてほしい
        },
        [data, editCell, focus, navigateCursor]
    );

    /**
     * 選択範囲を拡張する
     */
    const expandSelection = useCallback(
        (direction: Direction, cells: TableData<T>): [boolean, TableData<T>, CellLocation[]] => {
            // 現在の選択範囲
            const range = convertRange(selection);
            switch (direction) {
                case 'up':
                    range.start.row -= 1;
                    if (
                        range.start.row < 0 ||
                        getPageNumberFromRowIndex(range.start.row) !== currentPage
                    ) {
                        return [false, cells, selection];
                    }
                    break;
                case 'down':
                    range.end.row += 1;
                    if (
                        range.end.row >= cells.length ||
                        getPageNumberFromRowIndex(range.end.row) !== currentPage
                    ) {
                        return [false, cells, selection];
                    }
                    break;
                case 'left':
                    range.start.column -= 1;
                    if (range.start.column < 0) {
                        return [false, cells, selection];
                    }
                    break;
                case 'right':
                    range.end.column += 1;
                    if (range.end.column >= columnLength) {
                        return [false, cells, selection];
                    }
                    break;
            }

            // 選択範囲の更新
            const newSelection = selectRange(cells, range);

            return [true, cells, newSelection];
        },
        [columnLength, currentPage, getPageNumberFromRowIndex, selection]
    );

    /**
     * Shift+矢印キーによる選択範囲の拡張
     */
    const handleShiftArrowKeyDown = useCallback(
        (event: globalThis.KeyboardEvent, hotkeysEvent: HotkeysEvent) => {
            if (!focus || editCell) {
                // フォーカスが無い、あるいは編集中の場合は何もしない
                return;
            }
            const { key } = hotkeysEvent;
            debug('handleArrowKeyDown: ', key);

            const cells = clone(data);
            let direction: Direction;
            switch (key) {
                case 'shift+left':
                    direction = 'left';
                    break;
                case 'shift+right':
                    direction = 'right';
                    break;
                case 'shift+up':
                    direction = 'up';
                    break;
                case 'shift+down':
                    direction = 'down';
                    break;
            }

            const [ok, newData, newSelection] = expandSelection(direction, cells);
            if (ok) {
                setData(newData);
                setSelection(newSelection);
            }
            // デフォルトの挙動をキャンセル
            event.preventDefault();

            // TODO カレントセルが表示されるようにスクロールしてほしい
        },
        [data, editCell, expandSelection, focus]
    );

    /**
     * Tab, Enterによるカーソル移動
     */
    const keyDownTabEnter = useCallback(
        (key: string) => {
            let cells = clone(data);
            if (editCell) {
                // DropdownのPopover表示中はカーソル移動しない
                const cell = cells[editCell.location.row][editCell.location.column];
                if (cell.cellType === 'select' && cell.editing) {
                    return;
                }
                // 更新を確定する
                cells = commitEditing(cells);
            }

            switch (key) {
                case 'shift+tab':
                    cells = navigateCursor(0, -1, cells);
                    break;
                case 'tab':
                    cells = navigateCursor(0, 1, cells);
                    break;
                case 'shift+enter':
                    cells = navigateCursor(-1, 0, cells);
                    break;
                case 'enter':
                    cells = navigateCursor(1, 0, cells, true);
                    break;
            }

            setData(cells);
        },
        [commitEditing, data, editCell, navigateCursor]
    );

    /**
     * Tab, Enterによるカーソル移動 (hotkeysから呼ばれる)
     */
    const handleTabKeyDown = useCallback(
        (event: globalThis.KeyboardEvent, hotkeysEvent: HotkeysEvent) => {
            if (!focus) {
                return;
            }
            const { key } = hotkeysEvent;
            debug('handleTabKeyDown: ', key);
            // カーソル移動
            keyDownTabEnter(key);
            // デフォルトの挙動をキャンセル
            event.preventDefault();

            // TODO カレントセルが表示されるようにスクロールしてほしい
        },
        [focus, keyDownTabEnter]
    );

    /**
     * F2キーによる編集開始
     */
    const handleF2KeyDown = useCallback(
        (event: globalThis.KeyboardEvent) => {
            if (!focus) {
                return;
            }
            if (editCell) {
                return;
            }

            // 編集開始
            if (currentCell) {
                startEditing(currentCell);
                // デフォルトの挙動をキャンセル
                event.preventDefault();
            }
        },
        [currentCell, editCell, focus, startEditing]
    );

    /**
     * undo/redo 処理
     */
    const restoreHistory = useCallback(
        (command: HistoryCommand) => {
            debug(`${command}: `, undoIndex, undo);
            let index = undoIndex;
            if (command === 'undo') {
                index = Math.max(-1, index - 1);
            } else {
                index = index === undo.length - 1 ? index : index + 1;
            }

            if (index !== undoIndex && index > -1) {
                const history = clone(undo[index]);
                const newSelection: CellLocation[] = [];

                // カレントセルを選択状態とする
                if (currentCell) {
                    if (history.length - 1 > currentCell.row) {
                        history[currentCell.row][currentCell.column].current = true;
                        history[currentCell.row][currentCell.column].selected = true;
                        newSelection.push(currentCell);
                    } else {
                        // 該当セルが存在しない
                        setCurrentCell(undefined);
                    }
                }

                setData(history);
                setUndoIndex(index);
                // 選択解除
                setSelection(newSelection);

                // onChangeを呼び出す
                handleChange(history);
            }
        },
        [currentCell, handleChange, undo, undoIndex]
    );

    /**
     * Ctrl+Z / Ctrl+Y による undo/redo
     */
    const handleUndoRedo = useCallback(
        (event: globalThis.KeyboardEvent, hotkeysEvent: HotkeysEvent) => {
            if (!focus) {
                return;
            }
            if (editCell) {
                return;
            }

            const { key } = hotkeysEvent;
            debug('handleUndoRedo: ', key);

            switch (key) {
                case 'ctrl+z':
                    restoreHistory('undo');
                    break;
                case 'command+z':
                    restoreHistory('undo');
                    break;
                case 'ctrl+y':
                    restoreHistory('redo');
                    break;
                case 'command+y':
                    restoreHistory('redo');
                    break;
            }

            // デフォルトの挙動をキャンセル
            event.preventDefault();
        },
        [editCell, focus, restoreHistory]
    );

    /**
     * 範囲選択
     */
    const onSelect = useCallback(
        (range: CellRange) => {
            // 引数の range が現在ページの範囲内？
            if (!withinRange(currentPageRange, range)) {
                // 範囲外であれば終了
                return;
            }

            const cells = clone(data);
            // 編集中なら確定
            if (editCell) {
                commitEditing(cells);
            }
            // 現在の選択を解除
            clearSelection(cells, selection);
            // 範囲選択
            const newSelection = selectRange(cells, range);

            // カレントセルの更新要否
            let needUpdateCurrent = true;
            if (currentCell) {
                if (withinCell(range, currentCell)) {
                    // カレントセルが選択範囲内なら更新不要
                    needUpdateCurrent = false;
                } else {
                    // 現在のカレントセルをクリア
                    cells[currentCell.row][currentCell.column].current = false;
                    cells[currentCell.row][currentCell.column].selected = false;
                }
            }

            if (needUpdateCurrent) {
                // 選択範囲の先頭をカレントセルとする
                const newCurrent = clone(range.start);
                cells[newCurrent.row][newCurrent.column].current = true;
                setCurrentCell(newCurrent);
            }

            // state保存
            setSelection(newSelection);
            setData(cells);
        },
        [commitEditing, currentCell, currentPageRange, data, editCell, selection]
    );

    /**
     * 全件選択
     */
    const onSelectAll = useCallback(() => {
        // 現在表示しているページを範囲選択
        onSelect(currentPageRange);
    }, [currentPageRange, onSelect]);

    /**
     * Ctrl+A で全件選択
     */
    const handleCtrlAKeyDown = useCallback(
        (event: globalThis.KeyboardEvent) => {
            // フォーカスがないor編集中であれば何もしない
            if (!focus) {
                return;
            }
            if (editCell) {
                return;
            }

            // 全件選択
            onSelectAll();
            // デフォルトの挙動をキャンセル
            event.preventDefault();
        },
        [editCell, focus, onSelectAll]
    );

    /**
     * 任意のキー押下で値をセットするとともに編集開始
     */
    const handleAnyKeyDown = useCallback(
        (event: globalThis.KeyboardEvent, hotkeysEvent: HotkeysEvent) => {
            if (!focus) {
                return;
            }
            if (editCell) {
                return;
            }

            if (currentCell) {
                const { key, metaKey, ctrlKey } = event;
                debug('handleAnyKeyDown: ', key);

                let defaultPrevent = false;

                if (['delete', 'backspace', 'clear'].includes(key.toLowerCase())) {
                    startEditing(currentCell, '');
                    defaultPrevent = true;
                }
                if (key.length === 1 && !metaKey && !ctrlKey) {
                    startEditing(currentCell, key);
                    defaultPrevent = true;
                }

                if (defaultPrevent) {
                    event.preventDefault();
                }
            }
        },
        [currentCell, editCell, focus, startEditing]
    );

    /**
     * Hotkyesの設定
     */
    const hotkeySettings: HotkeyProps[] = useMemo(() => {
        return [
            // 矢印キー
            {
                keys: 'left,right,up,down',
                handler: handleArrowKeyDown,
            },
            // Shift+矢印キー
            {
                keys: 'shift+left,shift+right,shift+up,shift+down',
                handler: handleShiftArrowKeyDown,
            },
            // Tab, Enter
            {
                keys: 'shift+tab,tab,shift+enter,enter',
                handler: handleTabKeyDown,
            },
            // F2
            {
                keys: 'f2',
                handler: handleF2KeyDown,
            },
            // Ctrl+Z/Ctrl+Y
            {
                keys: 'ctrl+z,command+z,ctrl+y,command+y',
                handler: handleUndoRedo,
            },
            // Ctrl+A
            {
                keys: 'ctrl+a,command+a',
                handler: handleCtrlAKeyDown,
            },
            // any
            {
                keys: '*',
                handler: handleAnyKeyDown,
            },
        ];
    }, [
        handleAnyKeyDown,
        handleArrowKeyDown,
        handleCtrlAKeyDown,
        handleF2KeyDown,
        handleShiftArrowKeyDown,
        handleTabKeyDown,
        handleUndoRedo,
    ]);

    // Hotkeys
    useEffect(() => {
        hotkeySettings.forEach(({ keys, handler }) => {
            hotkeys(keys, handler);
        });

        return () => {
            // 割当削除
            hotkeySettings.forEach(({ keys }) => {
                hotkeys.unbind(keys);
            });
        };
    }, [hotkeySettings]);

    /**
     * フィルタリングされたデータ
     */
    const filteredData = useMemo(
        () =>
            data.filter((row) => {
                if (filter) {
                    return columns.every((column) => {
                        const filterText = filter[`${column.name}`];
                        if (filterText) {
                            const cell = row.find((e) => e.entityName === column.name);
                            if (cell) {
                                return cell.value.indexOf(filterText) === 0;
                            }
                        }
                        return true;
                    });
                }
                return true;
            }),
        [columns, data, filter]
    );

    /**
     * 現在ページの表示データ
     */
    const pageItems = useMemo(
        () => filteredData.slice(currentPage * perPage, currentPage * perPage + perPage),
        [currentPage, filteredData, perPage]
    );

    /**
     * 最終ページの空行数
     */
    const emptyRows = useMemo(() => {
        return perPage - Math.min(perPage, data.length - currentPage * perPage);
    }, [data.length, currentPage, perPage]);

    /**
     * 最終ページ番号
     */
    const last = useMemo(() => {
        return Math.ceil(data.length / perPage) - 1;
    }, [data.length, perPage]);

    /**
     * 選択状態、カレントセルをクリア
     */
    const clearSelectionAndCurrentCell = useCallback(() => {
        const newData = clone(data);
        // 選択状態の解除
        clearSelection(newData, selection);
        if (currentCell) {
            // カレントセルのクリア
            newData[currentCell.row][currentCell.column].current = false;
        }
        setData(newData);
        setCurrentCell(undefined);
        setSelection([]);
    }, [currentCell, data, selection]);

    /**
     * フィルタの入力処理
     * @param event
     */
    const onChangeFilter = useCallback(
        (event: ChangeEvent<HTMLInputElement>) => {
            if (!settings.filtable) {
                return;
            }

            const { name, value } = event.target;
            setFilter((state) => {
                return state ? { ...state, [name]: value } : { [name]: value };
            });
            // ページングをリセットする
            setPage(0);
            // カレントセル、選択状態をクリアする
            clearSelectionAndCurrentCell();
        },
        [clearSelectionAndCurrentCell, settings.filtable]
    );

    /**
     * フィルタの input に設定する props を生成
     * @param name
     */
    const getFilterProps = useCallback(
        (name: keyof T): FilterProps => ({
            filtable: settings.filtable,
            name: `${name}`,
            value: filter ? filter[`${name}`] ?? '' : '',
            onChange: onChangeFilter,
        }),
        [filter, onChangeFilter, settings.filtable]
    );

    /**
     * ソートボタンのクリックイベントハンドラーを返す
     */
    const getSortButtonClickEventHandler = useCallback(
        (name: keyof T) => {
            return () => {
                if (!settings.sortable) {
                    return;
                }

                // 1. ソートボタンをクリックした順にソート順を保持する
                //    同じボタンが複数クリックされた場合はまず該当ソート順を削除してから
                //    先頭にソート順を登録する
                const order = sort.find((e) => e.name === `${name}`)?.order;
                const newSort: SortState[] = sort.filter((e) => e.name !== `${name}`);
                newSort.unshift({
                    name: `${name}`,
                    order: order === 'desc' ? 'asc' : 'desc',
                });

                const newData = clone(data);
                // 選択の解除
                clearSelection(newData, selection);
                // カレントセルの解除
                if (currentCell) {
                    newData[currentCell.row][currentCell.column].current = false;
                }

                // 2. ソート順を新しいヤツから順に適用する
                newData.sort((a, b) => {
                    for (const { name, order } of newSort) {
                        const column = columns.find((c) => c.name === name);
                        const aValue = a.find((e) => e.entityName === column.name).value;
                        const bValue = b.find((e) => e.entityName === column.name).value;
                        return compareValue(aValue, bValue, column.valueType, order);
                    }
                    return 0;
                });

                // 3. stateの更新
                setSort(newSort);
                setData(newData);
                setSelection([]);
                setCurrentCell(undefined);
            };
        },
        [columns, currentCell, data, selection, settings.sortable, sort]
    );

    /**
     * ソートボタンに設定する props を生成
     * @param name
     */
    const getSortProps = useCallback(
        (name: keyof T): SortProps => ({
            sortable: settings.sortable,
            order: sort.find((e) => e.name === `${name}`)?.order,
            onClick: getSortButtonClickEventHandler(name),
        }),
        [getSortButtonClickEventHandler, settings.sortable, sort]
    );

    /**
     * セルのクリック
     * @param event
     * @param rowIndex
     * @param colIndex
     */
    const onCellClick = useCallback(
        (event: MouseEvent, rowIndex: number, colIndex: number) => {
            // 全体を通しての行番号
            const row = rowIndex + currentPage * perPage;
            // 選択セルの位置
            const location: CellLocation = { row, column: colIndex };

            // カレントセルと同じセルをクリックした？
            if (currentCell && compareLocation(currentCell, location) === 0) {
                // 何もせず終了
                return;
            }

            const newData = clone(data);
            // 編集中に別のセルをクリック
            if (editCell) {
                // 更新を確定
                commitEditing(newData);
            }

            // 選択状態を解除
            clearSelection(newData, selection);
            const newSelection: CellLocation[] = [];

            if (currentCell && event.shiftKey) {
                // シフトキーを押しながらセルクリック -> 範囲選択
                // カレントセルは変更しない
                const selections = selectRange(newData, currentCell, location);
                newSelection.push(...selections);
            } else {
                // 単一選択
                newSelection.push(location);
                newData[row][colIndex].current = true;
                newData[row][colIndex].selected = true;

                // 前のカレントセルを解除
                if (currentCell) {
                    newData[currentCell.row][currentCell.column].current = false;
                }

                setCurrentCell(location);
            }

            setData(newData);
            setSelection(newSelection);
        },
        [commitEditing, currentCell, currentPage, data, editCell, perPage, selection]
    );

    /**
     * セルのダブルクリック
     */
    const onCellDoubleClick = useCallback(
        (_: MouseEvent, rowIndex: number, colIndex: number) => {
            // 全体を通しての行番号
            const row = rowIndex + currentPage * perPage;
            // 選択セルの位置
            const location: CellLocation = { row, column: colIndex };

            // 該当セルの編集開始
            startEditing(location);
        },
        [currentPage, perPage, startEditing]
    );

    /**
     * マウスでのセル範囲選択
     */
    const onCellMouseOver = useCallback(
        (location: CellLocation) => {
            // 選択範囲を更新
            const newData = clone(data);
            // 選択状態を解除
            clearSelection(newData, selection);
            // 範囲選択
            const selections = selectRange(newData, currentCell, location);
            // state更新
            setSelection(selections);
            setData(newData);
        },
        [currentCell, data, selection]
    );

    /**
     * 行頭のセルをクリック
     * @param event
     * @param rowIndex
     */
    const onRowClick = useCallback(
        (event: MouseEvent, rowIndex: number) => {
            // 全体を通しての行番号
            const row = rowIndex + currentPage * perPage;

            const newData = clone(data);

            // 編集中だった場合
            if (editCell) {
                // 更新を確定
                commitEditing(newData);
            }

            // 選択状態を解除
            clearSelection(newData, selection);
            const newSelection: CellLocation[] = [];

            if (currentCell && event.shiftKey) {
                // シフトキーを押しながらセルクリック -> 範囲選択
                // カレントセルは変更しない
                const rangeStart: CellLocation = {
                    row: currentCell.row,
                    column: 0,
                };
                const rangeEnd: CellLocation = {
                    row,
                    column: newData[row].length - 1,
                };
                const selections = selectRange(newData, rangeStart, rangeEnd);
                newSelection.push(...selections);
            } else {
                // 単一行選択
                const rangeStart: CellLocation = { row, column: 0 };
                const rangeEnd: CellLocation = {
                    row,
                    column: newData[row].length - 1,
                };
                const selections = selectRange(newData, rangeStart, rangeEnd);
                newSelection.push(...selections);

                // 前のカレントセルを解除
                if (currentCell) {
                    newData[currentCell.row][currentCell.column].current = false;
                }

                // 選択行の先頭をカレントセルとする
                newData[rangeStart.row][rangeStart.column].current = true;
                setCurrentCell(rangeStart);
            }

            setData(newData);
            setSelection(newSelection);
        },
        [commitEditing, currentCell, currentPage, data, editCell, perPage, selection]
    );

    /**
     * 行の範囲選択
     */
    const onRowMouseOver = useCallback(
        (location: CellLocation) => {
            // 選択範囲を更新
            const newData = clone(data);
            // 選択状態を解除
            clearSelection(newData, selection);
            // 範囲選択
            const selections = selectRange(newData, currentCell, location);
            // state更新
            setSelection(selections);
            setData(newData);
        },
        [currentCell, data, selection]
    );

    /**
     * セルに設定する props を生成
     * @param cell
     * @param rowIndex
     * @param colIndex
     */
    const getCellProps = useCallback(
        (cell: Cell<T>, rowIndex: number, colIndex: number) => ({
            /**
             * セルのダブルクリック
             */
            onDoubleClick: (event: MouseEvent) => {
                // 全体を通しての行番号
                const row = rowIndex + currentPage * perPage;
                // 現在セルの位置
                const location: CellLocation = { row, column: colIndex };
                debug('double click', location);

                onCellDoubleClick(event, rowIndex, colIndex);
            },
            /**
             * セルのクリック / ドラッグの開始
             * @param event
             */
            onMouseDown: (event: MouseEvent) => {
                if (event.button === MouseButton.Primary) {
                    // 全体を通しての行番号
                    const row = rowIndex + currentPage * perPage;
                    // 現在セルの位置
                    const location: CellLocation = { row, column: colIndex };
                    debug('mouse down', location);

                    // クリック時の処理
                    onCellClick(event, rowIndex, colIndex);
                    // ドラッグ開始
                    setDragging(true);
                }
            },
            /**
             * ドラッグ中
             * @param event
             */
            onMouseOver: () => {
                if (dragging && !Boolean(editCell)) {
                    // 全体を通しての行番号
                    const row = rowIndex + currentPage * perPage;
                    // 現在セルの位置
                    const location: CellLocation = { row, column: colIndex };
                    debug('mouse over', location);

                    // 範囲選択
                    onCellMouseOver(location);
                }
            },
            /**
             * ドラッグ終了
             */
            onMouseUp: () => {
                // 全体を通しての行番号
                const row = rowIndex + currentPage * perPage;
                // 現在セルの位置
                const location: CellLocation = { row, column: colIndex };
                debug('mouse up', location);
                // ドラッグ終了
                setDragging(false);
            },
        }),
        [currentPage, dragging, editCell, onCellClick, onCellDoubleClick, onCellMouseOver, perPage]
    );

    /**
     * 行頭セルに設定する props を生成
     * @param rowIndex
     */
    const getRowHeaderCellProps = useCallback(
        (rowIndex: number): RowHeaderCellProps => ({
            onMouseDown: (event: MouseEvent) => {
                // 全体を通しての行番号
                const row = rowIndex + currentPage * perPage;
                // 現在セルの位置
                const location: CellLocation = { row, column: 0 };
                debug('row mouse down', location);

                // クリック時の処理
                onRowClick(event, rowIndex);

                // ドラッグ開始
                setDraggingRow(true);
            },
            onMouseOver: (event: MouseEvent) => {
                if (draggingRow) {
                    // 全体を通しての行番号
                    const row = rowIndex + currentPage * perPage;
                    // 現在セルの位置
                    const location: CellLocation = { row, column: data[row].length - 1 };
                    debug('row mouse over', location);

                    // 選択範囲を更新
                    onRowMouseOver(location);
                }
            },
            onMouseUp: () => {
                // 全体を通しての行番号
                const row = rowIndex + currentPage * perPage;
                // 現在セルの位置
                const location: CellLocation = { row, column: 0 };
                debug('row mouse up', location);
                // ドラッグ終了
                setDraggingRow(false);
            },
        }),
        [currentPage, data, draggingRow, onRowClick, onRowMouseOver, perPage]
    );

    /**
     * 編集モードでのキーボード操作
     * @param event
     */
    const handleEditorKeyDown = useCallback(
        (event: KeyboardEvent) => {
            const keys: string[] = [];
            let action: EditorKeyDownAction = undefined;
            if (event.shiftKey) {
                keys.push('shift');
            }
            switch (event.key) {
                case 'Tab':
                    keys.push('tab');
                    action = 'commit';
                    break;
                case 'Enter':
                    keys.push('enter');
                    action = 'commit';
                    break;
                case 'Escape':
                    action = 'cancel';
                    break;
            }

            if (action) {
                if (action === 'commit') {
                    keyDownTabEnter(keys.join('+'));
                }
                if (action === 'cancel') {
                    cancelEditing();
                }
                event.preventDefault();
            }
        },
        [cancelEditing, keyDownTabEnter]
    );

    /**
     * 編集セルの props を生成
     */
    const getEditorProps = useCallback(
        (): EditorProps => ({
            value: editCell?.value ?? '',
            onChange: (event: ChangeEvent<{ value: string }>) => {
                const { value } = event.target;
                setEditCell({
                    ...editCell,
                    value,
                });
            },
            onKeyDown: handleEditorKeyDown,
            cancel: cancelEditing,
            commit,
        }),
        [cancelEditing, commit, editCell, handleEditorKeyDown]
    );

    /**
     * ページ変更
     * @param event
     * @param newPage
     */
    const onChangePage = useCallback(
        (_: unknown, newPage: number) => {
            setPage(newPage);
            // カレントセル、選択状態をクリアする
            clearSelectionAndCurrentCell();
        },
        [clearSelectionAndCurrentCell]
    );

    /**
     * ページあたりの行数を変更
     * @param event
     */
    const onChangeRowsPerPage = useCallback(
        (event: ChangeEvent<HTMLSelectElement>) => {
            const { value } = event.target;
            const v = parseInt(value, 10);
            if (!Number.isNaN(v)) {
                setPage(0);
                setRowsPerPage(v);
                // カレントセル、選択状態をクリアする
                clearSelectionAndCurrentCell();
            }
        },
        [clearSelectionAndCurrentCell]
    );

    /**
     * 行追加
     */
    const insertRow = useCallback(
        (rowIndex?: number) => {
            const insertRowNumber = rowIndex + 1 ?? data.length;
            const newData = clone(data);
            const newRow = makeNewRow(insertRowNumber, newData);

            // 選択状態の解除
            clearSelection(newData, selection);
            if (currentCell) {
                // カレントセルのクリア
                newData[currentCell.row][currentCell.column].current = false;
            }

            if (typeof rowIndex === 'number') {
                newData.splice(insertRowNumber, 0, newRow);
            } else {
                newData.push(newRow);
            }

            // 挿入行にフォーカスを設定する
            const location: CellLocation = {
                row: insertRowNumber,
                column: 0,
            };
            newData[location.row][location.column].current = true;
            newData[location.row][location.column].selected = true;

            setCurrentCell(location);
            setSelection([location]);
            setData(newData);
            setFocus(true);
        },
        [currentCell, data, makeNewRow, selection]
    );

    /**
     * 選択セルの下 / 最下部に新規行を追加する
     */
    const onInsertRow = useCallback(() => {
        insertRow(currentCell?.row);
    }, [currentCell?.row, insertRow]);

    /**
     * 行削除
     */
    const deleteRows = useCallback(() => {
        if (selection.length === 0) {
            return;
        }

        const rows = selection.map((s) => s.row);
        const min = Math.min(...rows);
        const max = Math.max(...rows);
        // ${max - min + 1}件 のデータを削除します。よろしいですか？
        const message = formatMessage(messages, 'deleteConfirm', { count: `${max - min + 1}` });
        if (window.confirm(message)) {
            const newData = clone(data);

            // 選択状態の解除
            clearSelection(newData, selection);
            if (currentCell) {
                // カレントセルのクリア
                newData[currentCell.row][currentCell.column].current = false;
            }

            // 削除
            newData.splice(min, max - min + 1);

            setCurrentCell(undefined);
            setSelection([]);
            setData(newData);
            setFocus(false);
        }
    }, [currentCell, data, messages, selection]);

    /**
     * 選択セルを削除する
     */
    const onDeleteRows = useCallback(() => {
        deleteRows();
    }, [deleteRows]);

    /**
     * locationを指定して値を更新
     */
    const onChangeCellValue = useCallback(
        (location: CellLocation, value: string) => {
            debug('onChangeCellValue: ', location, value);
            const cells = clone(data);
            if (setCellValue(value, location, cells)) {
                handleChange(cells);
                // 履歴更新
                pushUndoList(cells);
                // 更新確定
                setData(cells);
            }
        },
        [data, handleChange, pushUndoList, setCellValue]
    );

    return {
        emptyRows,
        page: currentPage,
        pageItems,
        allItems: data,
        total: filteredData.length,
        lastPage: last,
        hasPrev: currentPage !== 0,
        hasNext: currentPage !== last,
        rowsPerPage: perPage,
        rowsPerPageOptions,
        tbodyRef,
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
    };
};
