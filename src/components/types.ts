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
