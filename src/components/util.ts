import {
    Cell,
    CellLocation,
    CellRange,
    ColumnDefinition,
    DefaultValueGenerator,
    GenerateRowKeyFunction,
    isCellRange,
    SortOrder,
    TableData,
    ValueType,
} from './types';

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
 * CellLocation が一致するか？
 * @param a
 * @param b
 * @returns
 */
export function equalsLocation(a: CellLocation, b?: CellLocation): boolean {
    if (b) {
        return a.row === b.row && a.column === b.column;
    }
    return false;
}

/**
 * CellLocation が配列に含まれるか？
 * @param location
 * @param locations
 * @returns
 */
export function includesLocation(location: CellLocation, locations: CellLocation[] = []): boolean {
    return locations.some((item) => item.row === location.row && item.column === location.column);
}

/**
 * range が parent の範囲内かどうか
 * @param parent
 * @param range
 * @returns
 */
export function withinRange(parent: CellRange, range: CellRange): boolean {
    return (
        parent.start.row <= range.start.row &&
        parent.end.row >= range.end.row &&
        parent.start.column <= range.start.column &&
        parent.end.column >= range.end.column
    );
}

/**
 * cell が range の範囲内かどうか
 * @param range
 * @param cell
 * @returns
 */
export function withinCell(range: CellRange, cell: CellLocation): boolean {
    return (
        range.start.row <= cell.row &&
        range.end.row >= cell.row &&
        range.start.column <= cell.column &&
        range.end.column >= cell.column
    );
}

/**
 * セルの選択状態を解除 (注意！ 引数の cells を変更します)
 * @param cells
 * @param selectedCells
 */
export const clearSelection = <T>(
    cells: Cell<T>[][],
    selectedCells: CellLocation[] = []
): Cell<T>[][] => {
    selectedCells.forEach(({ row, column }) => {
        cells[row][column].selected = false;
    });
    return cells;
};

/**
 * CellLocation[] を CellRange に変換
 * @param locations
 */
export const convertRange = (locations: CellLocation[]): CellRange | undefined => {
    if (locations.length === 0) {
        return;
    }
    const list = clone(locations).sort(compareLocation);
    const start: CellLocation = clone(list[0]);
    const end: CellLocation = clone(list[list.length - 1]);
    return {
        start,
        end,
    };
};

/**
 * 範囲選択
 * @param cells
 * @param cell1
 * @param cell2
 */
function selectCells<T>(
    cells: TableData<T>,
    cell1: CellLocation,
    cell2: CellLocation
): CellLocation[] {
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
}

// overload定義
export function selectRange<T>(cells: TableData<T>, range: CellRange): CellLocation[];
export function selectRange<T>(
    cells: TableData<T>,
    cell1: CellLocation,
    cell2: CellLocation
): CellLocation[];

/**
 * 範囲選択 (注意！ 引数の cells を変更します)
 * @param cells
 * @param arg1
 * @param arg2
 */
export function selectRange<T>(
    cells: TableData<T>,
    arg1: CellRange | CellLocation,
    arg2?: CellLocation
): CellLocation[] {
    if (isCellRange(arg1)) {
        return selectCells(cells, arg1.start, arg1.end);
    }
    if (arg2) {
        return selectCells(cells, arg1, arg2);
    }
}

/**
 * 列定義の defaultValue から初期値を取得する
 * @param defaultValue
 * @param rowIndex
 * @param cells
 * @returns
 */
export function getDefaultValue<T>(
    rowIndex: number,
    cells: Cell<T>[][],
    defaultValue?: string | DefaultValueGenerator<T>
): string {
    if (defaultValue) {
        if (typeof defaultValue === 'string') {
            return defaultValue;
        } else {
            return defaultValue(rowIndex, cells);
        }
    }
    return '';
}

/**
 * 行を元に entity を生成
 * @param row
 * @param columns
 * @param rowIndex
 * @param cells
 * @param sourceData
 */
export const parseEntity = <T>(
    row: Cell<T>[],
    columns: ColumnDefinition<T>[],
    rowIndex: number,
    cells: Cell<T>[][],
    sourceData: Partial<T> = {}
): Partial<T> => {
    let entity: Partial<T> = clone(sourceData);

    columns.forEach((column) => {
        const cell = row.find((c) => c.entityName === column.name);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let value: any = undefined;
        // セットされている値を取得
        if (cell?.value) {
            value = cell.value;
        } else {
            if (typeof entity[column.name] === 'undefined') {
                // 値が取得できなければ defaultValue をセットする
                value = getDefaultValue(rowIndex, cells, column.defaultValue);
            }
        }

        if (value !== undefined) {
            // 列定義された方法で value を変換
            if (column.parseValue) {
                const tmp = column.parseValue(value);
                entity = {
                    ...entity,
                    ...tmp,
                };
            } else {
                if (column.valueType === 'numeric') {
                    const v = parseFloat(value);
                    if (!isNaN(v)) {
                        value = v;
                    } else {
                        value = undefined;
                    }
                }

                // value をセット
                entity = {
                    ...entity,
                    [column.name]: value,
                };
            }
        }
    });

    return entity;
};

/**
 * テーブルを元に entity の配列を生成
 * @param data
 * @param cells
 * @param columns
 * @param getRowKey
 */
export const parse = <T>(
    data: T[],
    cells: Cell<T>[][],
    columns: ColumnDefinition<T>[],
    getRowKey: GenerateRowKeyFunction<T>
): Partial<T>[] => {
    const rows = clone(cells);
    const entities: Partial<T>[] = [];

    let additionalRowCount = 0;
    rows.forEach((row) => {
        const sourceIndex = data.findIndex((e, i) => row[0].rowKey === getRowKey(e, i));
        if (sourceIndex !== -1) {
            // 更新行
            const source = data[sourceIndex];
            const entity = parseEntity(row, columns, sourceIndex, cells, source);
            entities.push(entity);
        } else {
            // 追加行
            const rowIndex = data.length + additionalRowCount;
            const entity = parseEntity(row, columns, rowIndex, cells);
            entities.push(entity);
            additionalRowCount += 1;
        }
    });

    return entities;
};

/**
 * 値の比較
 * @param a
 * @param b
 * @param valueType
 * @param order
 * @returns
 */
export const compareValue = (
    a: string,
    b: string,
    valueType: ValueType,
    order: SortOrder
): number => {
    const aValue = valueType === 'numeric' ? parseFloat(a) : a;
    const bValue = valueType === 'numeric' ? parseFloat(b) : b;

    if (aValue > bValue) {
        if (order === 'asc') {
            return 1;
        } else if (order === 'desc') {
            return -1;
        }
    } else if (aValue < bValue) {
        if (order === 'asc') {
            return -1;
        } else if (order === 'desc') {
            return 1;
        }
    }

    return 0;
};

export interface Rect {
    top: number;
    left: number;
    width: number;
    height: number;
}

interface Point {
    pageX: number;
    pageY: number;
}

interface Scroll {
    scrollX: number;
    scrollY: number;
}

/**
 * クリックされた point が要素の範囲内かどうかを判定する
 * @param rect
 * @param point
 */
export const isWithinRect = (
    { top, left, width, height }: Rect,
    { pageX, pageY }: Point,
    { scrollX, scrollY }: Scroll = { scrollX: 0, scrollY: 0 }
): boolean => {
    debug('isWithinRect: ', { top, left, width, height }, { pageX, pageY }, { scrollX, scrollY });
    return (
        top + scrollY <= pageY &&
        top + scrollY + height >= pageY &&
        left + scrollX <= pageX &&
        left + scrollX + width >= pageX
    );
};
