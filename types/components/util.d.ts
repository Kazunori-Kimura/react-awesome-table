import { Cell, CellLocation, CellRange, ColumnDefinition, DefaultValueGenerator, GenerateRowKeyFunction, SortOrder, TableData, ValueType } from './types';
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
 * CellLocation が一致するか？
 * @param a
 * @param b
 * @returns
 */
export declare function equalsLocation(a: CellLocation, b?: CellLocation): boolean;
/**
 * CellLocation が配列に含まれるか？
 * @param location
 * @param locations
 * @returns
 */
export declare function includesLocation(location: CellLocation, locations?: CellLocation[]): boolean;
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
export declare const clearSelection: <T>(cells: Cell<T>[][], selectedCells?: CellLocation[]) => Cell<T>[][];
/**
 * CellLocation[] を CellRange に変換
 * @param locations
 */
export declare const convertRange: (locations: CellLocation[]) => CellRange | undefined;
export declare function selectRange<T>(cells: TableData<T>, range: CellRange): CellLocation[];
export declare function selectRange<T>(cells: TableData<T>, cell1: CellLocation, cell2: CellLocation): CellLocation[];
/**
 * 列定義の defaultValue から初期値を取得する
 * @param defaultValue
 * @param rowIndex
 * @param cells
 * @returns
 */
export declare function getDefaultValue<T>(rowIndex: number, cells: Cell<T>[][], defaultValue?: string | DefaultValueGenerator<T>): string;
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
export declare const isWithinRect: ({ top, left, width, height }: Rect, { pageX, pageY }: Point, { scrollX, scrollY }?: Scroll) => boolean;
/**
 * セルの値のみを比較するために抽出
 * @param cells
 * @returns
 */
export declare function getCellValues<T>(cells: TableData<T>): string[][];
/**
 * テーブルデータが一致するかどうかを判定する
 * @param a
 * @param b
 * @returns
 */
export declare function equalsCells<T>(a: TableData<T>, b: TableData<T>): boolean;
/**
 * 2次元配列から安全に要素を取り出す
 * @param cells
 * @param row
 * @param column
 * @returns
 */
export declare function safeGetCell<T>(cells: TableData<T>, row: number, column: number): Cell<T> | undefined;
/**
 * TableCellの子要素かどうか
 * @param element
 * @returns
 */
export declare function isChildOfTableCell(element: HTMLElement): boolean;
export {};
