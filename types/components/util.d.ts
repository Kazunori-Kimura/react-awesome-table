import { Cell, CellLocation, CellRange, ColumnDefinition, GenerateRowKeyFunction, SortOrder, TableData, ValueType } from './types';
/**
 * デバッグログ
 * @param args
 */
export declare const debug: (...args: any) => void;
/**
 * objectの deep copy
 * @param org
 */
export declare function clone<T>(org: T): T;
/**
 * Cell位置の比較
 * @param a
 * @param b
 */
export declare function compareLocation(a: CellLocation, b: CellLocation): -1 | 0 | 1;
/**
 * range が parent の範囲内かどうか
 * @param parent
 * @param range
 * @returns
 */
export declare function withinRange(parent: CellRange, range: CellRange): boolean;
/**
 * cell が range の範囲内かどうか
 * @param range
 * @param cell
 * @returns
 */
export declare function withinCell(range: CellRange, cell: CellLocation): boolean;
/**
 * セルの選択状態を解除 (注意！ 引数の cells を変更します)
 * @param cells
 * @param selectedCells
 */
export declare const clearSelection: <T>(cells: Cell<T>[][], selectedCells: CellLocation[]) => Cell<T>[][];
/**
 * CellLocation[] を CellRange に変換
 * @param locations
 */
export declare const convertRange: (locations: CellLocation[]) => CellRange | undefined;
export declare function selectRange<T>(cells: TableData<T>, range: CellRange): CellLocation[];
export declare function selectRange<T>(cells: TableData<T>, cell1: CellLocation, cell2: CellLocation): CellLocation[];
/**
 * 行を元に entity を生成
 * @param row
 * @param columns
 * @param rowIndex
 * @param cells
 * @param sourceData
 */
export declare const parseEntity: <T>(row: Cell<T>[], columns: ColumnDefinition<T>[], rowIndex: number, cells: Cell<T>[][], sourceData?: Partial<T>) => Partial<T>;
/**
 * テーブルを元に entity の配列を生成
 * @param data
 * @param cells
 * @param columns
 * @param getRowKey
 */
export declare const parse: <T>(data: T[], cells: Cell<T>[][], columns: ColumnDefinition<T>[], getRowKey: GenerateRowKeyFunction<T>) => Partial<T>[];
/**
 * 値の比較
 * @param a
 * @param b
 * @param valueType
 * @param order
 * @returns
 */
export declare const compareValue: (a: string, b: string, valueType: ValueType, order: SortOrder) => number;
export interface Rect {
    top: number;
    left: number;
    width: number;
    height: number;
}
export interface Point {
    pageX: number;
    pageY: number;
}
/**
 * クリックされた point が要素の範囲内かどうかを判定する
 * @param rect
 * @param point
 */
export declare const isWithinRect: ({ top, left, width, height }: Rect, { pageX, pageY }: Point) => boolean;
