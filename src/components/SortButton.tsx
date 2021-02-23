import { makeStyles } from '@material-ui/styles';
import classnames from 'classnames';
import React from 'react';
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
    return (
        <button
            className={classnames({
                [classes.unsorted]: typeof order === 'undefined',
                [classes.active]: typeof order !== 'undefined',
            })}
            onClick={onClick}
        >
            {order ?? 'asc'}
        </button>
    );
};

export default SortButton;
