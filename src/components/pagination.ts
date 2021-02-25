import hotkeys, { HotkeysEvent } from 'hotkeys-js';
import {
    ChangeEvent,
    KeyboardEvent,
    MouseEvent,
    RefObject,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { MouseButton } from './keys';
import {
    Cell,
    CellLocation,
    CellProps,
    ColumnDefinition,
    EditorKeyDownAction,
    EditorProps,
    FilterProps,
    HotkeyProps,
    RowHeaderCellProps,
    SortProps,
    SortState,
} from './types';
import { clearSelection, clone, compareLocation, debug, selectRange } from './util';

interface usePaginationParams<T> {
    items: T[];
    columns: ColumnDefinition<T>[];
    getRowKey: (item: T, index: number) => string;
    page?: number;
    rowsPerPage: Readonly<number>;
    rowsPerPageOptions?: Readonly<number[]>;
}

interface usePaginationValues<T> {
    emptyRows: number;
    page: number;
    pageItems: Cell<T>[][];
    total: number;
    lastPage: number;
    hasPrev: boolean;
    hasNext: boolean;
    rowsPerPage: Readonly<number>;
    rowsPerPageOptions?: Readonly<number[]>;
    tbodyRef: RefObject<HTMLTableSectionElement>;
    onChangePage: (event: unknown, page: number) => void;
    onChangeRowsPerPage: (event: ChangeEvent<HTMLSelectElement>) => void;
    getFilterProps: (name: keyof T) => FilterProps;
    getSortProps: (name: keyof T) => SortProps;
    getCellProps: (cell: Cell<T>, rowIndex: number, colIndex: number) => CellProps;
    getRowHeaderCellProps: (rowIndex: number) => RowHeaderCellProps;
    getEditorProps: () => EditorProps;
}

/**
 * ページあたりの行数のデフォルト候補
 */
const defaultRowsPerPageOptions = [5, 10, 30] as const;

/**
 * TablePagination の props を生成するカスタム Hooks
 */
export const usePagination = <T>({
    items,
    columns,
    getRowKey,
    page = 0,
    rowsPerPage = defaultRowsPerPageOptions[0],
    rowsPerPageOptions = defaultRowsPerPageOptions,
}: usePaginationParams<T>): usePaginationValues<T> => {
    // データ全体
    const [data, setData] = useState<Cell<T>[][]>([]);
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

    // tbody
    const tbodyRef = useRef<HTMLTableSectionElement>();

    // 初期化処理
    useEffect(() => {
        const newData: Cell<T>[][] = items.map((item, index) => {
            return columns.map((column) => ({
                entityName: column.name,
                rowKey: getRowKey(item, index),
                value: column.getValue(item),
            }));
        });
        setData(newData);
    }, [columns, getRowKey, items]);

    /**
     * 当該イベントが tbody の範囲内で発生している？
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
        (value: string, location: CellLocation, cells: Cell<T>[][]): boolean => {
            debug('setCellValue: ', value, location);
            let changed = false;
            const { validator } = columns[location.column];
            const cell = cells[location.row][location.column];

            // 値のセット
            if (cell.value !== value) {
                cell.value = value;
                changed = true;
            }

            // エラーチェック
            if (validator) {
                const [valid, message] = validator(value, location, cells);
                cell.invalid = !valid;
                cell.invalidMessage = message;
            }

            return changed;
        },
        [columns]
    );

    /**
     * セルの編集を開始する (stateを更新します)
     */
    const startEditing = useCallback(
        (location: CellLocation, defaultValue?: string) => {
            debug('startEditing');
            const newData = clone(data);
            newData[location.row][location.column].editing = true;
            const value = defaultValue ?? newData[location.row][location.column].value;
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
        (cells: Cell<T>[][]): Cell<T>[][] => {
            if (editCell) {
                debug('endEditing: ', editCell);
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
        (cells: Cell<T>[][]): Cell<T>[][] => {
            debug('commitEditing');
            // セルの更新する
            const { location, value } = editCell;
            const changed = setCellValue(value, location, cells);
            // 編集終了
            const d = endEditing(cells);

            if (changed) {
                // TODO onChange をよぶ
            }

            return d;
        },
        [editCell, endEditing, setCellValue]
    );

    /**
     * 空行を生成する
     */
    const makeNewRow = useCallback(
        (row: number, cells: Cell<T>[][]): Cell<T>[] => {
            return columns.map((column, index) => {
                let value = '';
                if (column.defaultValue) {
                    if (typeof column.defaultValue === 'string') {
                        value = column.defaultValue;
                    } else {
                        value = column.defaultValue(row);
                    }
                }
                const [valid, message] = column.validator(value, { row, column: index }, cells);
                return {
                    entityName: column.name,
                    rowKey: getRowKey(undefined, row),
                    value,
                    invalid: !valid,
                    invalidMessage: message,
                };
            });
        },
        [columns, getRowKey]
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
                    // TODO onChange を呼ぶ
                }
            }
        },
        [currentCell, data, makeNewRow, setCellValue]
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
     * カーソル移動
     * @param row
     * @param column
     */
    const navigateCursor = useCallback(
        (row: number, column: number, cells: Cell<T>[][]): Cell<T>[][] => {
            debug('navigateCursor', row, column, currentCell);
            if (currentCell) {
                // 新しいカーソル位置
                const newCurrent: CellLocation = {
                    row: currentCell.row + row,
                    column: currentCell.column + column,
                };

                // 移動可能か判定
                if (
                    newCurrent.row < 0 ||
                    newCurrent.column < 0 ||
                    newCurrent.column >= columns.length ||
                    newCurrent.row >= data.length
                ) {
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
                const newPage = Math.ceil((newCurrent.row + 1) / rowsPerPage) - 1;
                if (currentPage !== newPage) {
                    setPage(newPage);
                }

                // state更新
                setSelection(newSelection);
                setCurrentCell(newCurrent);

                return cells;
            }
        },
        [columns.length, currentCell, currentPage, data, rowsPerPage, selection]
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
            debug('keydown: ', key);

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
     * Tab, Enterによるカーソル移動
     */
    const keyDownTabEnter = useCallback(
        (key: string) => {
            let cells = clone(data);
            if (editCell) {
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
                    cells = navigateCursor(1, 0, cells);
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
            debug('keydown: ', key);
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
                const { key } = event;
                debug('anyKeydown: ', key);

                let defaultPrevent = false;

                if (['delete', 'backspace', 'clear'].includes(key.toLowerCase())) {
                    startEditing(currentCell, '');
                    defaultPrevent = true;
                }
                if (key.length === 1) {
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
            // any
            {
                keys: '*',
                handler: handleAnyKeyDown,
            },
        ];
    }, [handleAnyKeyDown, handleArrowKeyDown, handleF2KeyDown, handleTabKeyDown]);

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
            const { name, value } = event.target;
            setFilter((state) => {
                return state ? { ...state, [name]: value } : { [name]: value };
            });
            // ページングをリセットする
            setPage(0);
            // カレントセル、選択状態をクリアする
            clearSelectionAndCurrentCell();
        },
        [clearSelectionAndCurrentCell]
    );

    /**
     * フィルタの input に設定する props を生成
     * @param name
     */
    const getFilterProps = (name: keyof T): FilterProps => ({
        name: `${name}`,
        value: filter ? filter[`${name}`] ?? '' : '',
        onChange: onChangeFilter,
    });

    /**
     * ソートボタンのクリックイベントハンドラーを返す
     */
    const getSortButtonClickEventHandler = useCallback(
        (name: keyof T) => {
            return () => {
                // 1. ソートボタンをクリックした順にソート順を保持する
                //    同じボタンが複数クリックされた場合はまず該当ソート順を削除してから
                //    先頭にソート順を登録する
                const order = sort.find((e) => e.name === `${name}`)?.order;
                const newSort: SortState[] = sort.filter((e) => e.name !== `${name}`);
                newSort.unshift({
                    name: `${name}`,
                    order: order === 'desc' ? 'asc' : 'desc',
                });

                // 2. ソート順を新しいヤツから順に適用する
                const newData = clone(data);
                newData.sort((a, b) => {
                    for (const { name, order } of newSort) {
                        const index = columns.findIndex((c) => c.name === name);
                        if (a[index].value > b[index].value) {
                            if (order === 'asc') {
                                return 1;
                            } else if (order === 'desc') {
                                return -1;
                            }
                        } else if (a[index].value < b[index].value) {
                            if (order === 'asc') {
                                return -1;
                            } else if (order === 'desc') {
                                return 1;
                            }
                        }
                    }
                    return 0;
                });

                // 3. stateの更新
                setSort(newSort);

                clearSelection(newData, selection);
                setData(newData);
            };
        },
        [columns, data, selection, sort]
    );

    /**
     * ソートボタンに設定する props を生成
     * @param name
     */
    const getSortProps = (name: keyof T): SortProps => ({
        order: sort.find((e) => e.name === `${name}`)?.order,
        onClick: getSortButtonClickEventHandler(name),
    });

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
    const getCellProps = (cell: Cell<T>, rowIndex: number, colIndex: number) => ({
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
    });

    /**
     * 行頭セルに設定する props を生成
     * @param rowIndex
     */
    const getRowHeaderCellProps = (rowIndex: number): RowHeaderCellProps => ({
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
    });

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
        }),
        [editCell, handleEditorKeyDown]
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

    return {
        emptyRows,
        page: currentPage,
        pageItems,
        total: filteredData.length,
        lastPage: last,
        hasPrev: currentPage !== 0,
        hasNext: currentPage !== last,
        rowsPerPage: perPage,
        rowsPerPageOptions,
        tbodyRef,
        onChangePage,
        onChangeRowsPerPage,
        getFilterProps,
        getSortProps,
        getCellProps,
        getRowHeaderCellProps,
        getEditorProps,
    };
};