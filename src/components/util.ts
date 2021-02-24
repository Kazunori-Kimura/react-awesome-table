import { Cell, CellLocation } from './types';

/**
 * デバッグログ
 * @param args
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const debug = (...args: any): void => {
    if (process.env.NODE_ENV === 'development') {
        console.log(...args);
    }
};

/**
 * objectの deep copy
 * @param org
 */
export function clone<T>(org: T): T {
    return JSON.parse(JSON.stringify(org)) as T;
}

/**
 * Cell位置の比較
 * @param a
 * @param b
 */
export function compareLocation(a: CellLocation, b: CellLocation): -1 | 0 | 1 {
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
 * セルの選択状態を解除 (注意！ 引数の cells を変更します)
 * @param cells
 * @param selectedCells
 */
export const clearSelection = <T>(
    cells: Cell<T>[][],
    selectedCells: CellLocation[]
): Cell<T>[][] => {
    selectedCells.forEach(({ row, column }) => {
        cells[row][column].selected = false;
    });
    return cells;
};

/**
 * 範囲選択 (注意！ 引数の cells を変更します)
 * @param cells
 * @param cell1
 * @param cell2
 */
export const selectRange = <T>(
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
