import { makeStyles } from '@material-ui/styles';
import classnames from 'classnames';
import React, { useContext } from 'react';
import { formatMessage, MessageContext } from './messages';
import { SortProps } from './types';

const useStyles = makeStyles({
    unsorted: {
        color: '#999',
    },
    active: {
        color: '#000',
    },
});

const SortButton: React.FC<SortProps> = ({ order, onClick }) => {
    const classes = useStyles();
    const messages = useContext(MessageContext);
    return (
        <button
            className={classnames({
                [classes.unsorted]: typeof order === 'undefined',
                [classes.active]: typeof order !== 'undefined',
            })}
            onClick={onClick}
        >
            {formatMessage(messages, order ?? 'asc')}
        </button>
    );
};

export default SortButton;
