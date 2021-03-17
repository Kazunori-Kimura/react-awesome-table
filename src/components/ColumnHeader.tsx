import { makeStyles } from '@material-ui/styles';
import classnames from 'classnames';
import React, { useContext } from 'react';
import { CellSize } from './consts';
import { formatMessage, MessageContext } from './messages';
import SortButton from './SortButton';
import { ColumnHeaderProps } from './types';

interface ColumnHeaderStyleProps {
    width?: number;
}

const useStyles = makeStyles({
    root: (props: ColumnHeaderStyleProps) => ({
        width: props.width ?? CellSize.DefaultWidth,
        boxSizing: 'border-box',
        verticalAlign: 'top',
    }),
    filter: {
        width: '100%',
        boxSizing: 'border-box',
    },
});

function ColumnHeader<T>({
    className,
    column,
    sort,
    filter,
}: ColumnHeaderProps<T>): React.ReactElement {
    const classes = useStyles({ width: column.width });
    const messages = useContext(MessageContext);
    const { filterable, ...filterProps } = filter;

    return (
        <th className={classnames(className, classes.root)}>
            {column.displayName ?? column.name}
            {sort.sortable && <SortButton {...sort} />}
            {filterable && (
                <>
                    <br />
                    <input
                        type="text"
                        className={classes.filter}
                        placeholder={formatMessage(messages, 'filter')}
                        {...filterProps}
                    />
                </>
            )}
        </th>
    );
}

export default ColumnHeader;
