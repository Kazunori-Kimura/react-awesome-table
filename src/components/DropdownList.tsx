import { makeStyles } from '@material-ui/styles';
import classnames from 'classnames';
import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import DropdownListPopover, { StyleProps } from './DropdownListPopover';
import { CellLocation, DataListType, EditorProps } from './types';

interface DropdownListProps extends EditorProps {
    className?: string;
    location: CellLocation;
    dataList: DataListType;
}

const useStyles = makeStyles({
    root: {
        position: 'relative',
    },
    list: {
        //
    },
    listItem: {
        //
        '&:hover': {
            //
        },
    },
});

const DropdownList: React.FC<DropdownListProps> = ({
    className,
    value,
    location,
    dataList,
    ...props
}) => {
    const classes = useStyles();
    const ref = useRef<HTMLDivElement>();

    const [position, setPosition] = useState<StyleProps>({ top: 0, left: 0 });

    const setPopoverPosition = useCallback(() => {
        if (ref.current) {
            const { width, height, top, left, right, bottom } = ref.current.getBoundingClientRect();
            const { width: screenWidth, height: screenHeight } = window.screen;

            console.log('target: ', {
                width,
                height,
                top,
                left,
                right,
                bottom,
                screenWidth,
                screenHeight,
            });

            const POPOVER_WIDTH = 400;
            const POPOVER_HEIGHT = 200;

            const hd = screenHeight - bottom - POPOVER_HEIGHT;
            const wd = right - POPOVER_WIDTH;
            const p: StyleProps = {
                minWidth: width,
            };

            if (hd < 30 && top > POPOVER_HEIGHT) {
                // 上に表示
                p.bottom = height * -1;
            } else {
                // 下に表示
                p.top = height + 3;
            }
            if (wd > 30) {
                // 右を基点に表示
                p.right = 0;
            } else {
                // 左を基点に表示
                p.left = 0;
            }

            setPosition(p);
        }
    }, []);

    useLayoutEffect(() => {
        setPopoverPosition();
    }, [setPopoverPosition]);

    return (
        <div ref={ref} className={classnames(classes.root, className)}>
            <span>{value}</span>
            <DropdownListPopover
                position={position}
                location={location}
                value={value}
                items={dataList}
                {...props}
            />
        </div>
    );
};

export default DropdownList;
