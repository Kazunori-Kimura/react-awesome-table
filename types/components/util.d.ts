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
export declare const convertRange: (locations: CellLocation[]) => CellRange;
export declare function selectRange<T>(cells: TableData<T>, range: CellRange): CellLocation[];
export declare function selectRange<T>(cells: TableData<T>, cell1: CellLocation, cell2: CellLocation): CellLocation[];
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
