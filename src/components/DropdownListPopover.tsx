import { makeStyles } from '@material-ui/styles';
import classnames from 'classnames';
import React, { KeyboardEvent, useCallback, useEffect, useRef, useState } from 'react';
import { Popover } from './consts';
import { CellLocation, DataListType, EditorProps } from './types';
import { isWithinRect } from './util';

interface DropdownListPopoverProps extends EditorProps {
    location: CellLocation;
    position: StyleProps;
    items: DataListType;
    parent?: DOMRect;
}

export interface StyleProps {
    minWidth?: number;
    top?: number;
    bottom?: number;
    left?: number | string;
    right?: number | string;
}

const useStyles = makeStyles({
    root: (props: StyleProps) => ({
        boxShadow: '0px 0px 5px 3px rgba(10,10,10,0.2)',
        width: 'max-content',
        minHeight: '0.5rem',
        maxHeight: Popover.MaxHeight,
        maxWidth: Popover.MaxWidth,
        boxSizing: 'border-box',
        zIndex: 10,
        backgroundColor: '#fff',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        outline: 0,
        position: 'absolute',
        ...props,
    }),
    list: {
        display: 'flex',
        flexDirection: 'column',
    },
    item: {
        padding: '0.3rem',
        width: '100%',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textAlign: 'left',
        textOverflow: 'ellipsis',
        backgroundColor: '#fff',
        border: '1px solid #fff',
        outline: 0,
    },
    active: {
        backgroundColor: '#eee',
        borderTop: '1px solid #ccc',
        borderBottom: '1px solid #ccc',
    },
});

const DropdownListPopover: React.FC<DropdownListPopoverProps> = ({
    location,
    parent,
    position,
    value,
    items,
    commit,
    cancel,
}) => {
    const classes = useStyles(position);
    const ref = useRef<HTMLDivElement>();

    const [activeIndex, setActive] = useState(-1);

    const triggerChange = useCallback(
        (selectedValue?: string) => {
            if (typeof selectedValue === 'string' && value !== selectedValue) {
                // 更新の確定
                commit(selectedValue);
                return;
            }

            // 更新をキャンセル
            cancel();
        },
        [cancel, commit, value]
    );

    /**
     * 項目をクリック
     * @param index
     */
    const handleClick = (index: number): VoidFunction => {
        const item = items[index];
        return () => {
            triggerChange(item.value);
        };
    };

    /**
     * キーボード操作
     * @param event
     */
    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        const { key } = event;
        // ArrowUp, ArrowDown で選択
        // Space, Enter で確定
        // Escape でキャンセル
        switch (key) {
            case 'ArrowUp':
                setActive(activeIndex === 0 ? 0 : activeIndex - 1);
                break;
            case 'ArrowDown':
                setActive(activeIndex === items.length - 1 ? items.length - 1 : activeIndex + 1);
                break;
            case ' ':
                if (activeIndex >= 0) {
                    triggerChange(items[activeIndex].value);
                }
                break;
            case 'Enter':
                if (activeIndex >= 0) {
                    triggerChange(items[activeIndex].value);
                }
                break;
            case 'Escape':
                triggerChange();
                break;
            case 'Esc':
                triggerChange();
                break;
        }
    };

    /**
     * リストの外側をクリックされたら編集をキャンセルする
     */
    const handleClickOutside = useCallback(
        (event: globalThis.MouseEvent) => {
            if (ref.current && parent) {
                const { scrollX, scrollY } = window;
                const { left, top, width, height } = ref.current.getBoundingClientRect();
                const { pageX, pageY } = event;

                const insideSelf = isWithinRect(
                    { left, top, width, height },
                    { pageX, pageY },
                    { scrollX, scrollY }
                );
                const insideParent = isWithinRect(parent, { pageX, pageY }, { scrollX, scrollY });

                if (!(insideSelf || insideParent)) {
                    // 編集をキャンセル
                    triggerChange();
                }
            }
        },
        [parent, triggerChange]
    );

    useEffect(() => {
        if (ref.current) {
            ref.current.focus();
        }
        document.addEventListener('click', handleClickOutside);

        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [handleClickOutside]);

    return (
        <div className={classes.root} ref={ref} tabIndex={0} onKeyDown={handleKeyDown}>
            <div className={classes.list}>
                {items.map((item, index) => {
                    const key = `${location.row}_${location.column}_${item.value}`;
                    return (
                        <button
                            key={key}
                            className={classnames({
                                [classes.active]: activeIndex === index,
                                [classes.item]: true,
                            })}
                            onMouseOver={() => setActive(index)}
                            onClick={handleClick(index)}
                        >
                            {item.name}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default DropdownListPopover;
