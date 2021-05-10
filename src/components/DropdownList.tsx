import { makeStyles } from '@material-ui/styles';
import classnames from 'classnames';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CellSize } from './consts';
import DropdownListPopover, { StyleProps } from './DropdownListPopover';
import { CellLocation, DataListType, EditorProps } from './types';

interface DropdownListProps extends EditorProps {
    className?: string;
    location: CellLocation;
    dataList: DataListType;
    width?: number;
    parent?: DOMRect;
}

interface DropdownStyleProps {
    width?: number;
    height?: number;
}

const useStyles = makeStyles({
    root: ({ height }: DropdownStyleProps) => ({
        position: 'relative',
        height: height - 1, // parent.height は borderWidth を含んでいる
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
    }),
    label: ({ width }: DropdownStyleProps) => ({
        width: `calc(${width ?? CellSize.DefaultWidth}px - 0.6rem)`,
        boxSizing: 'border-box',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
    }),
});

const DropdownList: React.FC<DropdownListProps> = ({
    className,
    value,
    location,
    dataList,
    width,
    parent,
    ...props
}) => {
    const classes = useStyles({ width, height: parent.height });
    const labelRef = useRef<HTMLDivElement>();

    const [position, setPosition] = useState<StyleProps>({ top: 0, left: 0 });

    /**
     * Popoverの表示位置
     */
    const setPopoverPosition = useCallback(() => {
        if (parent) {
            const { width, height } = parent;

            const p: StyleProps = {
                minWidth: width,
                top: height,
                right: '-0.3rem',
            };

            // 左端のセルについては左を基点に表示
            if (location.column === 0) {
                p.left = '-0.3rem';
            } else {
                p.right = '-0.3rem';
            }

            setPosition(p);
        }
    }, [location.column, parent]);

    useEffect(() => {
        setPopoverPosition();
    }, [setPopoverPosition]);

    return (
        <div className={classnames(classes.root)}>
            <DropdownListPopover
                parent={parent}
                position={position}
                location={location}
                value={value}
                items={dataList}
                {...props}
            />
            <div ref={labelRef} className={classes.label}>
                {dataList.find((item) => item.value === value)?.name ?? ''}
            </div>
        </div>
    );
};

export default DropdownList;
