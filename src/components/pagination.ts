import { ChangeEvent, MouseEvent, RefObject, useEffect, useMemo, useRef, useState } from 'react';
import {
    Cell,
    CellLocation,
    CellProps,
    ColumnDefinition,
    FilterProps,
    RowHeaderCellProps,
    SortProps,
    SortState,
} from './types';

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
}

/**
 * ページあたりの行数のデフォルト候補
 */
const defaultRowsPerPageOptions = [5, 10, 30] as const;

/**
 * objectの deep copy
 * @param org
 */
function clone<T>(org: T): T {
    return JSON.parse(JSON.stringify(org)) as T;
}

/**
 * Cell位置の比較
 * @param a
 * @param b
 */
function compareLocation(a: CellLocation, b: CellLocation): -1 | 0 | 1 {
    if (a.row < b.row) {
        return -1;
    }
    if (a.row > b.row) {
        return 1;
    }
    if (a.column < b.column) {
        return -1;
    }
    if (a.column > b.column) {
        return 1;
    }
    return 0;
}

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
    const [editCell, setEditCell] = useState<CellLocation>();
    // 現在選択中のセル
    const [selection, setSelection] = useState<CellLocation[]>([]);
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
     * document での mouse upイベント
     * @param event
     */
    const handleMouseUpDocument = (event: globalThis.MouseEvent) => {
        if (tbodyRef.current) {
            const { left: x, top: y, width, height } = tbodyRef.current.getBoundingClientRect();
            const { pageX, pageY } = event;
            const within = y <= pageY && y + height >= pageY && x <= pageX && x + width >= pageX;
            if (!within) {
                console.log('drag end.');
                // ドラッグ強制終了
                setDragging(false);
                setDraggingRow(false);
            }
        }
    };

    // イベントリスナーの設定
    useEffect(() => {
        document.addEventListener('mouseup', handleMouseUpDocument);

        return () => {
            // イベントリスナーの削除
            document.removeEventListener('mouseup', handleMouseUpDocument);
        };
    }, []);

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
     * セルの選択状態を解除 (注意！ 引数の cells を変更します)
     * @param cells
     * @param selectedCells
     */
    const clearSelection = (cells: Cell<T>[][], selectedCells: CellLocation[]): Cell<T>[][] => {
        selectedCells.forEach(({ row, column }) => {
            cells[row][column].selected = false;
        });
        return cells;
    };

    /**
     * フィルタの入力処理
     * @param event
     */
    const onChangeFilter = (event: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        setFilter((state) => {
            return state ? { ...state, [name]: value } : { [name]: value };
        });
        // ページングをリセットする
        setPage(0);
        // 選択状態をクリアする
        const newData = clone(data);
        clearSelection(newData, selection);
        setData(newData);
    };

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
     * ソートボタンに設定する props を生成
     * @param name
     */
    const getSortProps = (name: keyof T): SortProps => ({
        order: sort.find((e) => e.name === `${name}`)?.order,
        /**
         * ソートボタンのクリック
         */
        onClick: () => {
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
        },
    });

    /**
     * 範囲選択 (注意！ 引数の cells を変更します)
     * @param cells
     * @param cell1
     * @param cell2
     */
    const selectRange = (
        cells: Cell<T>[][],
        cell1: CellLocation,
        cell2: CellLocation
    ): CellLocation[] => {
        const newSelection: CellLocation[] = [];
        const rowRange = [cell1.row, cell2.row].sort();
        const colRange = [cell1.column, cell2.column].sort();

        for (let r = rowRange[0]; r <= rowRange[1]; r++) {
            for (let c = colRange[0]; c <= colRange[1]; c++) {
                const select: CellLocation = { row: r, column: c };
                newSelection.push(select);
                cells[r][c].selected = true;
            }
        }

        return newSelection;
    };

    /**
     * セルのクリック
     * @param event
     * @param rowIndex
     * @param colIndex
     */
    const onCellClick = (event: MouseEvent, rowIndex: number, colIndex: number) => {
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
            // TODO: 変更を確定
            // 編集状態を解除
            newData[editCell.row][editCell.column].editing = false;
            setEditCell(undefined);
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
    };

    /**
     * 行頭のセルをクリック
     * @param event
     * @param rowIndex
     */
    const onRowClick = (event: MouseEvent, rowIndex: number) => {
        // 全体を通しての行番号
        const row = rowIndex + currentPage * perPage;

        const newData = clone(data);

        // 編集中だった場合
        if (editCell) {
            // TODO: 変更を確定
            // 編集状態を解除
            newData[editCell.row][editCell.column].editing = false;
            setEditCell(undefined);
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
    };

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
        onDoubleClick: () => {
            // 全体を通しての行番号
            const row = rowIndex + currentPage * perPage;
            // 現在セルの位置
            const location: CellLocation = { row, column: colIndex };
            console.log('double click', location);
        },
        /**
         * セルのクリック / ドラッグの開始
         * @param event
         */
        onMouseDown: (event: MouseEvent) => {
            // 全体を通しての行番号
            const row = rowIndex + currentPage * perPage;
            // 現在セルの位置
            const location: CellLocation = { row, column: colIndex };
            console.log('mouse down', location);

            // クリック時の処理
            onCellClick(event, rowIndex, colIndex);
            // ドラッグ開始
            setDragging(true);
        },
        /**
         * ドラッグ中
         * @param event
         */
        onMouseOver: () => {
            if (dragging) {
                // 全体を通しての行番号
                const row = rowIndex + currentPage * perPage;
                // 現在セルの位置
                const location: CellLocation = { row, column: colIndex };
                console.log('mouse over', location);

                // 選択範囲を更新
                const newData = clone(data);
                // 選択状態を解除
                clearSelection(newData, selection);
                // 範囲選択
                const selections = selectRange(newData, currentCell, location);
                // state更新
                setSelection(selections);
                setData(newData);
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
            console.log('mouse up', location);
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
            console.log('row mouse down', location);

            // クリック時の処理
            onRowClick(event, row);

            // ドラッグ開始
            setDraggingRow(true);
        },
        onMouseOver: (event: MouseEvent) => {
            if (draggingRow) {
                // 全体を通しての行番号
                const row = rowIndex + currentPage * perPage;
                // 現在セルの位置
                const location: CellLocation = { row, column: data[row].length - 1 };
                console.log('row mouse over', location);

                // 選択範囲を更新
                const newData = clone(data);
                // 選択状態を解除
                clearSelection(newData, selection);
                // 範囲選択
                const selections = selectRange(newData, currentCell, location);
                // state更新
                setSelection(selections);
                setData(newData);
            }
        },
        onMouseUp: () => {
            // 全体を通しての行番号
            const row = rowIndex + currentPage * perPage;
            // 現在セルの位置
            const location: CellLocation = { row, column: 0 };
            console.log('row mouse up', location);
            // ドラッグ終了
            setDraggingRow(false);
        },
    });

    /**
     * ページ変更
     * @param event
     * @param newPage
     */
    const onChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    /**
     * ページあたりの行数を変更
     * @param event
     */
    const onChangeRowsPerPage = (event: ChangeEvent<HTMLSelectElement>) => {
        const { value } = event.target;
        const v = parseInt(value, 10);
        if (!Number.isNaN(v)) {
            setPage(0);
            setRowsPerPage(v);
        }
    };

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
    };
};
