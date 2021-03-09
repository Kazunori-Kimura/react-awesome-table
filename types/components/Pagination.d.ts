import React from 'react';
import { PaginationProps } from './types';
declare function Pagination<T>({ className, page, total, lastPage, hasPrev, hasNext, rowsPerPage, rowsPerPageOptions, onChangePage, onChangeRowsPerPage, }: PaginationProps<T>): React.ReactElement;
export default Pagination;
