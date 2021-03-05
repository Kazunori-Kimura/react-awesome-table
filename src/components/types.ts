import { KeyHandler } from 'hotkeys-js';
import { ChangeEvent, KeyboardEvent, MouseEvent, RefObject } from 'react';

export type EditorKeyDownAction = 'commit' | 'cancel' | undefined;
export type TableData<T> = Cell<T>[][];
export type HistoryCommand = 'undo' | 'redo';
export type Direction = 'up' | 'down' | 'left' | 'right';

/**
 * セル位置
 */
export interface CellLocation {
    row: number;
    column: number;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
export const isCellLocation = (item: any): item is CellLocation => {
    return (
        typeof item === 'object' && typeof item.row === 'number' && typeof item.column === 'number'
    );
};

/**
 * セル範囲
 */
export interface CellRange {
    start: CellLocation;
    end: CellLocation;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
export const isCellRange = (item: any): item is CellRange => {
    return typeof item === 'object' && isCellLocation(item.start) && isCellLocation(item.end);
};

/**
 * セル種別
 */
export type CellComponentType = 'text' | 'select' | 'custom';

/**
 * セル
 */
export interface Cell<T> {
    entityName: keyof T;
    rowKey: string;
    value: string;
    selected?: boolean;
    current?: boolean;
    editing?: boolean;
    invalid?: boolean;
    invalidMessage?: string;
    readOnly?: boolean;
    cellType: CellComponentType;
}

/**
 * 列定義からセル種別を判定する
 * @param column
 */
export function getCellComponentType<T>(column: ColumnDefinition<T>): CellComponentType {
    if (column.render) {
        return 'custom';
    }
    if (column.dataList) {
        return 'select';
    }
    return 'text';
}

/**
 * セルの validator の結果
 * [成否, エラーメッセージ]
 */
export type ValidatorResult = [boolean, string?];

/**
 * セルの validator
 */
export type ValidatorFunction<T> = (
    value: string,
    location: CellLocation,
    cells: Cell<T>[][]
) => ValidatorResult;

/**
 * カスタムコンポーネント描画時に渡される props
 */
export interface CellRenderProps<T> {
    cell: Cell<T>;
    location: CellLocation;
    row: Cell<T>[];
    column: ColumnDefinition<T>;
}

export type ValueType = 'string' | 'numeric';

export type DataListType = Readonly<{ name: string; value: string }[]>;

/**
 * 列定義
 */
export interface ColumnDefinition<T> {
    name: keyof T;
    displayName?: string;
    valueType?: ValueType;
    getValue: (item: T) => string;
    parseValue?: (value: string) => Partial<T>;
    validator?: ValidatorFunction<T> | ValidatorFunction<T>[];
    defaultValue?: string | ((row: number, cells: Cell<T>[][]) => string);
    hidden?: boolean;
    readOnly?: boolean;
    required?: boolean;
    dataList?: DataListType;
    isPermittedExceptList?: boolean;
    render?: (props: CellRenderProps<T>) => React.ReactElement | undefined | null;
}

/**
 * ソート定義
 */
export type SortOrder = 'asc' | 'desc' | undefined;

/**
 * ソートキー
 */
export interface SortState {
    name: string;
    order: SortOrder;
}

/**
 * テーブルコンテナの props
 */
export interface TableContainerProps {
    onKeyDown?: (event: KeyboardEvent) => void;
}

/**
 * ソートボタンの props
 */
export interface SortProps {
    order: SortOrder;
    onClick: VoidFunction;
}

/**
 * フィルタ テキストボックスの props
 */
export interface FilterProps {
    name: string;
    value: string;
    onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

/**
 * セルの props
 */
export interface CellProps {
    onDoubleClick?: (event: MouseEvent) => void;
    onKeyDown?: (event: KeyboardEvent) => void;
    onMouseDown?: (event: MouseEvent) => void;
    onMouseOver?: (event: MouseEvent) => void;
    onMouseUp?: (event: MouseEvent) => void;
}

/**
 * 行頭のセルの props
 */
export interface RowHeaderCellProps {
    onMouseDown?: (event: MouseEvent) => void;
    onMouseOver?: (event: MouseEvent) => void;
    onMouseUp?: (event: MouseEvent) => void;
}

/**
 * 編集セルの props
 */
export interface EditorProps {
    value: string;
    onChange?: (event: ChangeEvent<{ value: string }>) => void;
    onKeyDown?: (event: KeyboardEvent) => void;
    cancel?: VoidFunction;
    commit?: (value: string) => void;
}

/**
 * Hotkeysの定義
 */
export interface HotkeyProps {
    keys: string;
    handler: KeyHandler;
}

export type GenerateRowKeyFunction<T> = (item: T, index: number, cells?: Cell<T>[][]) => string;

export interface TableHookParameters<T> {
    items: T[];
    columns: ColumnDefinition<T>[];
    page?: number;
    rowsPerPage: Readonly<number>;
    rowsPerPageOptions?: Readonly<number[]>;
    getRowKey: GenerateRowKeyFunction<T>;
    onChange?: (data: Partial<T>[]) => void;
}

export interface TableHookReturns<T> {
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
    onDeleteRows: VoidFunction;
    onInsertRow: VoidFunction;
    onSelect: (range: CellRange) => void;
    onSelectAll: VoidFunction;
    getFilterProps: (name: keyof T) => FilterProps;
    getSortProps: (name: keyof T) => SortProps;
    getCellProps: (cell: Cell<T>, rowIndex: number, colIndex: number) => CellProps;
    getRowHeaderCellProps: (rowIndex: number) => RowHeaderCellProps;
    getEditorProps: () => EditorProps;
}

/**
 * テーブルのProps
 */
export interface TableProps<T> {
    data: T[];
    columns: ColumnDefinition<T>[];
    getRowKey: GenerateRowKeyFunction<T>;
    onChange?: (data: Partial<T>[]) => void;
}
