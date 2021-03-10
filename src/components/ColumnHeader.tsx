import { makeStyles } from '@material-ui/styles';
import classnames from 'classnames';
import React from 'react';
import SortButton from './SortButton';
import { ColumnHeaderProps } from './types';

interface ColumnHeaderStyleProps {
    width?: number;
}

const useStyles = makeStyles({
    root: (props: ColumnHeaderStyleProps) => ({
        width: props.width ?? 'auto',
        verticalAlign: 'top',
    }),
});

function ColumnHeader<T>({
    className,
    column,
    sort,
    filter,
}: ColumnHeaderProps<T>): React.ReactElement {
    const classes = useStyles({ width: column.width });
    const { filterable, ...filterProps } = filter;
    return (
        <th className={classnames(className, classes.root)}>
            {column.displayName ?? column.name}
            {sort.sortable && <SortButton {...sort} />}
            {filterable && (
                <>
                    <br />
                    <input type="text" {...filterProps} />
                </>
            )}
        </th>
    );
}

export default ColumnHeader;
