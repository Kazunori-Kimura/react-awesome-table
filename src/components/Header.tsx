import { makeStyles } from '@material-ui/styles';
import classnames from 'classnames';
import React, { useContext } from 'react';
import { formatMessage, MessageContext } from './messages';
import { HeaderProps } from './types';

const useStyles = makeStyles({
    root: {
        //
    },
});

function Header<T>({ className, onInsertRow, onDeleteRows }: HeaderProps<T>): React.ReactElement {
    const classes = useStyles();
    const messages = useContext(MessageContext);

    return (
        <div className={classnames(classes.root, className)}>
            <button onClick={onInsertRow}>{formatMessage(messages, 'addRow')}</button>
            <button onClick={onDeleteRows}>{formatMessage(messages, 'deleteRows')}</button>
        </div>
    );
}

export default Header;
