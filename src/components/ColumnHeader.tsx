import React from 'react';
import SortButton from './SortButton';
import { ColumnHeaderProps } from './types';

function ColumnHeader<T>({
    className,
    column,
    sort,
    filter,
}: ColumnHeaderProps<T>): React.ReactElement {
    return (
        <th className={className}>
            {column.displayName ?? column.name}
            {sort.sortable && <SortButton {...sort} />}
            {filter.filtable && (
                <>
                    <br />
                    <input type="text" {...filter} />
                </>
            )}
        </th>
    );
}

export default ColumnHeader;
