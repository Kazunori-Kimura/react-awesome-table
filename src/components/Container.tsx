import { makeStyles } from '@material-ui/styles';
import classnames from 'classnames';
import React, { useContext } from 'react';
import { PopoverContext } from './providers/PopoverProvider';

interface Props {
    className?: string;
    children: React.ReactNode;
}

interface StyleProps {
    scrollable: boolean;
}

const useStyles = makeStyles({
    container: ({ scrollable }: StyleProps) => ({
        flex: 1,
        maxWidth: '100%',
        boxSizing: 'border-box',
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: '#ccc',
        overflow: scrollable ? 'auto' : 'hidden',
    }),
});

const Container: React.ForwardRefRenderFunction<HTMLDivElement, Props> = (
    { className, children },
    ref
) => {
    const { open } = useContext(PopoverContext);
    const classes = useStyles({ scrollable: !open });

    return (
        <div ref={ref} className={classnames(classes.container, className)}>
            {children}
        </div>
    );
};

export default React.forwardRef(Container);
