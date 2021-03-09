import { makeStyles } from '@material-ui/styles';
import classnames from 'classnames';
import React from 'react';
import { HeaderProps } from './types';

const useStyles = makeStyles({
    root: {
        //
    },
});

function Header<T>({ className, onInsertRow, onDeleteRows }: HeaderProps<T>): React.ReactElement {
    const classes = useStyles();

    return (
        <div className={classnames(classes.root, className)}>
            <button onClick={onInsertRow}>Add Row</button>
            <button onClick={onDeleteRows}>Delete Rows</button>
        </div>
    );
}

export default Header;
