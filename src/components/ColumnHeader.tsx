import React from 'react';
import SortButton from './SortButton';
import { ColumnHeaderProps } from './types';

function ColumnHeader<T>({
    className,
    column,
    sort,
    filter,
}: ColumnHeaderProps<T>): React.ReactElement {
    const { filtable, ...filterProps } = filter;
    return (
        <th className={className}>
            {column.displayName ?? column.name}
            {sort.sortable && <SortButton {...sort} />}
            {filtable && (
                <>
                    <br />
                    <input type="text" {...filterProps} />
                </>
            )}
        </th>
    );
}

export default ColumnHeader;
