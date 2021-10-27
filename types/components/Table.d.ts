import React, { ForwardedRef } from 'react';
import { TableHandles, TableProps } from './types';
declare function TableComponent<T>({ classes, messages, data, columns, getRowKey, onChange, options, renderHeader, renderColumnHeader: CustomColumnHeader, renderPagination, readOnly, sticky, rowNumber, disableUndo, ...props }: TableProps<T>, ref?: ForwardedRef<TableHandles<T>>): React.ReactElement;
declare type Props<T> = TableProps<T> & {
    ref?: React.Ref<TableHandles<T>>;
};
declare const Table: <T>(props: Props<T>) => ReturnType<typeof TableComponent>;
export default Table;
