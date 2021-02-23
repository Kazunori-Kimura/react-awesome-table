import { ChangeEvent } from 'react';

export interface ColumnDefinition<T> {
    name: keyof T;
    getValue: (item: T) => string;
}

export interface TableDefinition<T> {
    columns: ColumnDefinition<T>[];
    getRowKey: (item: T, index: number) => string;
}

export interface Cell<T> {
    entityName: keyof T;
    rowKey: string;
    value: string;
    selected?: boolean;
    current?: boolean;
    editing?: boolean;
}

export type SortOrder = 'asc' | 'desc' | undefined;

export interface SortState {
    name: string;
    order: SortOrder;
}

export interface SortProps {
    order: SortOrder;
    onClick: VoidFunction;
}

export interface FilterProps {
    name: string;
    value: string;
    onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}
