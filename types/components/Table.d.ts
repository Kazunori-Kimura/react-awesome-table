import React from 'react';
import { TableProps } from './types';
declare function Table<T>({ data, columns, getRowKey, onChange, options, }: TableProps<T>): React.ReactElement;
export default Table;
