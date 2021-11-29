import { ClassNameMap } from '@material-ui/styles';
import { KeyHandler } from 'hotkeys-js';
import React, { ChangeEvent, KeyboardEvent, MouseEvent, RefObject } from 'react';
import { MessageDefinitions } from './providers/MessageProvider';
export declare type EditorKeyDownAction = 'commit' | 'cancel' | undefined;
export declare type TableData<T> = Cell<T>[][];
export declare type HistoryCommand = 'undo' | 'redo';
export declare type Direction = 'up' | 'down' | 'left' | 'right';
/**
 * セルの編集モード
 * normal: 通常モード (default)
 * input: 入力モード
 * edit: 編集モード
 * select: 範囲選択モード
 */
export declare type EditMode = 'normal' | 'input' | 'edit' | 'select';
/**
 * セル位置
 */
export interface CellLocation {
    row: number;
    column: number;
}
export declare const isCellLocation: (item: any) => item is CellLocation;
/**
 * セル範囲
 */
export interface CellRange {
    start: CellLocation;
    end: CellLocation;
}
export declare const isCellRange: (item: any) => item is CellRange;
/**
 * セル種別
 */
export declare type CellComponentType = 'text' | 'select' | 'custom';
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
    hidden?: boolean;
}
/**
 * 列定義からセル種別を判定する
 * @param column
 */
export declare function getCellComponentType<T>(column: ColumnDefinition<T>): CellComponentType;
/**
 * セルの validator の結果
 * [成否, エラーメッセージ]
 */
export declare type ValidatorResult = [boolean, string?];
/**
 * セルの validator
 */
export declare type ValidatorFunction<T> = (value: string, location: CellLocation, cells: Cell<T>[][]) => ValidatorResult;
/**
 * カスタムコンポーネント描画時に渡される props
 */
export interface CellRenderProps<T> {
    cell: Cell<T>;
    location: CellLocation;
    row: Cell<T>[];
    column: ColumnDefinition<T>;
    entity: Partial<T>;
    onChange: (value: string) => void;
}
export declare type ValueType = 'string' | 'numeric';
export declare type DataListType = Readonly<{
    name: string;
    value: string;
}[]>;
/**
 * デフォルト値の生成メソッド
 */
export declare type DefaultValueGenerator<T> = (row: number, cells: Cell<T>[][]) => string;
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
    defaultValue?: string | DefaultValueGenerator<T>;
    hidden?: boolean;
    readOnly?: boolean;
    required?: boolean;
    dataList?: DataListType;
    isPermittedExceptList?: boolean;
    width?: number;
    sortable?: boolean;
    filterable?: boolean;
    unique?: boolean;
    render?: (props: CellRenderProps<T>) => React.ReactElement | undefined | null;
}
/**
 * ソート定義
 */
export declare type SortOrder = 'asc' | 'desc' | undefined;
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
    sortable: boolean;
    order: SortOrder;
    onClick: VoidFunction;
}
/**
 * フィルタ テキストボックスの props
 */
export interface FilterProps {
    filterable: boolean;
    name: string;
    value: string;
    onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}
/**
 * セルの props
 */
export interface CellProps {
    mode: EditMode;
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
    onChange?: (event: ChangeEvent<{
        value: string;
    }>) => void;
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
declare type PressEnterOnLastRow = 'insert' | 'none';
declare type NavigateCellFromRowEdge = 'prevOrNextRow' | 'loop' | 'none';
/**
 * テーブル設定
 */
export interface TableOptions {
    /**
     * 最下行で Enter を入力した際の挙動
     */
    pressEnterOnLastRow?: PressEnterOnLastRow;
    /**
     * 右端で次のセルに移動した際の挙動
     */
    navigateCellFromRowEdge?: NavigateCellFromRowEdge;
    /**
     * ソート可否
     */
    sortable?: boolean;
    /**
     * フィルタリング可否
     */
    filterable?: boolean;
}
export declare const defaultTableOptions: TableOptions;
/**
 * 行をユニークにする関数
 */
export declare type GenerateRowKeyFunction<T> = (item: T | null | undefined, index: number, cells?: Cell<T>[][]) => string;
/**
 * 更新時のコールバック関数
 */
export declare type ChangeEventCallback<T> = (data: Partial<T>[], invalid: boolean) => void;
export interface TableHookParameters<T> {
    items: T[];
    columns: ColumnDefinition<T>[];
    page?: number;
    rowsPerPage: Readonly<number>;
    rowsPerPageOptions?: Readonly<number[]>;
    getRowKey: GenerateRowKeyFunction<T>;
    onChange?: ChangeEventCallback<T>;
    messages?: MessageDefinitions;
    options?: TableOptions;
    readOnly?: boolean;
    disableUndo?: boolean;
}
/**
 * セルの値を更新する関数
 */
export declare type ChangeCellValueFunction = (location: CellLocation, value: string) => void;
/**
 * key, value を指定して該当行を表示する
 * 該当行がなければ false を返す
 */
declare type SelectByKeyValueFunction<T> = (key: keyof T, value: string) => boolean;
/**
 * カスタムフックの戻り値
 */
export interface TableHookReturns<T> {
    emptyRows: number;
    page: number;
    pageItems: Cell<T>[][];
    allItems: Cell<T>[][];
    total: number;
    lastPage: number;
    hasPrev: boolean;
    hasNext: boolean;
    rowsPerPage: Readonly<number>;
    rowsPerPageOptions?: Readonly<number[]>;
    selectedRange?: CellRange;
    tbodyRef: RefObject<HTMLTableSectionElement>;
    hasFocus: boolean;
    onChangeCellValue: ChangeCellValueFunction;
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
    selectByKeyValue: SelectByKeyValueFunction<T>;
    getSelectedCellValues: () => string;
    pasteData: (text: string) => void;
    setFocus: (focus: boolean) => void;
    mode: EditMode;
    setMode: (mode: EditMode) => void;
}
/**
 * 親コンポーネントに渡されるインスタンス
 * useImperativeHandle/forwardRef で使用
 */
export interface TableHandles<T> {
    selectByKeyValue: SelectByKeyValueFunction<T>;
}
export declare type TableCssClassNames = 'root' | 'header' | 'container' | 'table' | 'headerRow' | 'headerCell' | 'tbody' | 'row' | 'rowHeader' | 'cell' | 'pagination';
export declare type TableCssClasses = Partial<ClassNameMap<TableCssClassNames>>;
/**
 * テーブルのProps
 */
export interface TableProps<T> {
    classes?: TableCssClasses;
    messages?: MessageDefinitions;
    data: T[];
    columns: ColumnDefinition<T>[];
    getRowKey: GenerateRowKeyFunction<T>;
    onChange?: ChangeEventCallback<T>;
    options?: TableOptions;
    renderHeader?: (props: HeaderProps<T>) => React.ReactElement | null;
    renderColumnHeader?: (props: ColumnHeaderProps<T>) => React.ReactElement;
    renderPagination?: (props: PaginationProps<T>) => React.ReactElement | null;
    rowsPerPage?: Readonly<number>;
    rowsPerPageOptions?: Readonly<number[]>;
    readOnly?: boolean;
    sticky?: boolean;
    rowNumber?: boolean;
    disableUndo?: boolean;
}
/**
 * ページングのprops
 */
export interface PaginationProps<T> {
    className?: string;
    page: number;
    pageItems: Cell<T>[][];
    total: number;
    lastPage: number;
    hasPrev: boolean;
    hasNext: boolean;
    rowsPerPage: Readonly<number>;
    rowsPerPageOptions?: Readonly<number[]>;
    onChangePage: (event: unknown, page: number) => void;
    onChangeRowsPerPage: (event: ChangeEvent<HTMLSelectElement>) => void;
}
/**
 * ヘッダーの props
 */
export interface HeaderProps<T> extends PaginationProps<T> {
    readOnly?: boolean;
    selectedRange?: CellRange;
    onDeleteRows: VoidFunction;
    onInsertRow: VoidFunction;
}
/**
 * 列ヘッダーの props
 */
export interface ColumnHeaderProps<T> {
    className?: string;
    column: ColumnDefinition<T>;
    sort: SortProps;
    filter: FilterProps;
}
export interface Position {
    top?: number;
    left?: number;
    bottom?: number;
    right?: number;
}
export {};
