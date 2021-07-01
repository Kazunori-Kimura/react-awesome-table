import React from 'react';
import { ColumnDefinition, ColumnHeaderProps, FilterProps, SortProps, TableCssClasses } from './types';
interface Props<T> {
    classes?: TableCssClasses;
    columns: ColumnDefinition<T>[];
    sticky?: boolean;
    getFilterProps: (name: keyof T) => FilterProps;
    getSortProps: (name: keyof T) => SortProps;
    onSelectAll: VoidFunction;
    renderColumnHeader?: (props: ColumnHeaderProps<T>) => React.ReactElement;
}
declare function TableHeader<T>({ classes, columns, sticky, getFilterProps, getSortProps, onSelectAll, renderColumnHeader: CustomColumnHeader, }: Props<T>): React.ReactElement;
export default TableHeader;
