import { KeyHandler } from 'hotkeys-js';
import { ChangeEvent, KeyboardEvent, MouseEvent } from 'react';

export type EditorKeyDownAction = 'commit' | 'cancel' | undefined;

/**
 * セル位置
 */
export interface CellLocation {
    row: number;
    column: number;
}

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
}

/**
 * 列定義
 */
export interface ColumnDefinition<T> {
    name: keyof T;
    displayName?: string;
    getValue: (item: T) => string;
    setValue?: (value: string) => Partial<T>;
    validator?: (value: string, location: CellLocation, cells: Cell<T>[][]) => [boolean, string?];
    defaultValue?: string | ((row: number) => string);
    hidden?: boolean;
    readOnly?: boolean;
}

/**
 * テーブル定義
 */
export interface TableProps<T> {
    data: T[];
    columns: ColumnDefinition<T>[];
    getRowKey: (item: T | undefined, rowIndex: number) => string;
    validator: (item: unknown) => item is T;
    onChange?: (data: T[]) => void;
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
}

/**
 * Hotkeysの定義
 */
export interface HotkeyProps {
    keys: string;
    handler: KeyHandler;
}
