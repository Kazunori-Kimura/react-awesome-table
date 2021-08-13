import React from 'react';
import { TableProps } from './types';
declare function Table<T>({ classes, messages: msgs, data, columns, getRowKey, onChange, options, renderHeader, renderColumnHeader: CustomColumnHeader, renderPagination, readOnly, sticky, rowNumber, disableUndo, ...props }: TableProps<T>): React.ReactElement;
export default Table;
