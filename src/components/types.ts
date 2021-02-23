import { ChangeEvent, KeyboardEvent, MouseEvent } from 'react';

/**
 * 列定義
 */
export interface ColumnDefinition<T> {
    name: keyof T;
    getValue: (item: T) => string;
}

/**
 * テーブル定義
 */
export interface TableDefinition<T> {
    columns: ColumnDefinition<T>[];
    getRowKey: (item: T, index: number) => string;
}

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
}

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
    onClick?: (event: MouseEvent) => void;
    onDoubleClick?: (event: MouseEvent) => void;
    onKeyDown?: (event: KeyboardEvent) => void;
    onMouseDown?: (event: MouseEvent) => void;
    onMouseOver?: (event: MouseEvent) => void;
    onMouseUp?: (event: MouseEvent) => void;
}
